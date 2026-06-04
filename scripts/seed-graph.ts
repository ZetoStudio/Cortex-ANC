import { GraphClient } from '../packages/graph-core/src/graph-client';
import { indexDocument } from '../packages/graph-core/src/index';
import { MOCK_DOCUMENTS } from '../packages/graph-core/src/mock-data';

const dbUrl = process.env.DATABASE_URL ?? 'postgresql://cortex:cortex@localhost:5434/cortex';

console.log('🧠 Seeding Cortex brain (vectors + knowledge graph)…');

for (const doc of MOCK_DOCUMENTS) {
  await indexDocument(doc.id, doc.text, doc.metadata);
}

const graph = new GraphClient(dbUrl);

const acmeId = await graph.upsertNode({
  id: 'project:acme',
  label: 'Acme Mobile Launch',
  type: 'project',
  properties: { status: 'blocked', blocker: 'Stripe API keys' },
});

await graph.upsertNode({
  id: 'person:jane',
  label: 'Jane (Platform Lead)',
  type: 'person',
  properties: { team: 'Platform' },
});

await graph.upsertNode({
  id: 'risk:api-keys',
  label: 'Missing production API keys',
  type: 'risk',
  properties: { severity: 'high', eta_days: 3 },
});

await graph.upsertEdge({
  fromId: acmeId,
  toId: 'person:jane',
  type: 'owned_by',
  properties: {},
});

await graph.upsertEdge({
  fromId: acmeId,
  toId: 'risk:api-keys',
  type: 'blocked_by',
  properties: {},
});

await graph.upsertNode({
  id: 'source:slack',
  label: 'slack',
  type: 'source',
  properties: {},
});

await graph.upsertEdge({
  fromId: 'source:slack',
  toId: acmeId,
  type: 'mentioned_in',
  properties: { channel: '#acme-launch' },
});

await graph.close();

console.log('✅ Graph seeded: Acme project, Jane, API key risk');
console.log('✅ Vector store seeded:', MOCK_DOCUMENTS.length, 'documents');
