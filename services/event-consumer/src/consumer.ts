import { randomUUID } from 'node:crypto';

import { GraphClient, indexDocument } from '@cortex/graph-core';
import {
  createLogger,
  llmClient,
  type CortexEvent,
  type EntityExtractedEvent,
} from '@cortex/shared';
import { createConsumer, publishEvent, TOPICS } from '@cortex/shared/kafka';

const log = createLogger('event-consumer');

function extractEntitiesRegex(text: string): EntityExtractedEvent['entities'] {
  const entities: EntityExtractedEvent['entities'] = [];
  const projectMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
  if (projectMatch) {
    for (const name of projectMatch.slice(0, 5)) {
      entities.push({ name, type: 'project', confidence: 0.6 });
    }
  }
  const ticketMatch = text.match(/\b[A-Z]+-\d+\b/g);
  if (ticketMatch) {
    for (const name of ticketMatch) {
      entities.push({ name, type: 'ticket', confidence: 0.9 });
    }
  }
  if (/\bAcme\b/i.test(text)) {
    entities.push({ name: 'Acme', type: 'project', confidence: 0.95 });
  }
  return entities;
}

async function extractEntities(text: string): Promise<EntityExtractedEvent> {
  const entities = extractEntitiesRegex(text);
  const relationships: EntityExtractedEvent['relationships'] = [];

  if (process.env.USE_LLM_ENTITY_EXTRACTION === 'true') {
    try {
      const raw = await llmClient.completeLocal(
        `Extract entities as JSON array [{name,type}]. Text: ${text.slice(0, 800)}`,
        0,
      );
      const parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] ?? '[]') as Array<{
        name: string;
        type: string;
      }>;
      for (const e of parsed) {
        entities.push({ name: e.name, type: e.type, confidence: 0.7 });
      }
    } catch {
      // regex fallback
    }
  }

  return {
    eventId: randomUUID(),
    entities,
    relationships,
    text,
  };
}

async function ingestEvent(event: CortexEvent): Promise<void> {
  const text =
    event.text ??
    String(event.payload.message ?? event.payload.text ?? JSON.stringify(event.payload));

  const docId = `event-${event.id}`;
  await indexDocument(docId, text, {
    title: `${event.source}: ${event.type}`,
    source: event.source,
    type: 'event',
    project: String(event.payload.project ?? ''),
  });

  const extracted = await extractEntities(text);
  extracted.eventId = event.id;

  if (process.env.DATABASE_URL) {
    const graph = new GraphClient();
    await graph.upsertNode({
      id: `source:${event.source}`,
      label: event.source,
      type: 'source',
      properties: {},
    });
    for (const entity of extracted.entities) {
      const nodeId = await graph.upsertNode({
        label: entity.name,
        type: entity.type,
        properties: { source: event.source, confidence: entity.confidence },
      });
      await graph.upsertEdge({
        fromId: `source:${event.source}`,
        toId: nodeId,
        type: 'mentioned_in',
        properties: { eventId: event.id },
      });
    }
    await graph.close();
  }

  try {
    await publishEvent(TOPICS.ENTITY_EXTRACTED, extracted);
  } catch {
    log.warn('Could not publish entity.extracted');
  }

  log.info({ eventId: event.id, entities: extracted.entities.length }, 'ingested event');
}

async function main(): Promise<void> {
  const consumer = await createConsumer('cortex-event-consumer');
  await consumer.subscribe({ topic: TOPICS.RAW_EVENTS, fromBeginning: true });

  log.info('Consuming raw.events');

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as CortexEvent;
      await ingestEvent(event);
    },
  });
}

main().catch((err) => {
  log.error({ err }, 'event-consumer failed');
  process.exit(1);
});
