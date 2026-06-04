export type CortexEvent = {
  id: string;
  source: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
  text?: string;
  organizationId?: string;
};

export type ExtractedEntity = {
  name: string;
  type: string;
  confidence: number;
};

export type EntityExtractedEvent = {
  eventId: string;
  entities: ExtractedEntity[];
  relationships: Array<{ from: string; to: string; type: string }>;
  text: string;
};

export const TOPICS = {
  RAW_EVENTS: 'raw.events',
  ENTITY_EXTRACTED: 'entity.extracted',
  AGENT_INTERACTIONS: 'agent.interactions',
} as const;
