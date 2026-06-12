import { Kafka, type Consumer, type Producer } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

let kafkaInstance: Kafka | null = null;

export function getKafka(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'cortex',
      brokers,
    });
  }
  return kafkaInstance;
}

export async function createProducer(): Promise<Producer> {
  const producer = getKafka().producer();
  await producer.connect();
  return producer;
}

export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = getKafka().consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export async function publishEvent(
  topic: string,
  payload: unknown,
  options?: { tenantId?: string },
): Promise<void> {
  const producer = await createProducer();
  const headers: Record<string, string> = {};
  if (options?.tenantId) headers.tenant_id = options.tenantId;
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload), headers }],
  });
  await producer.disconnect();
}
