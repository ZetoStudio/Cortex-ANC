import neo4j, { type Driver, type Session } from 'neo4j-driver';

let driver: Driver | null = null;

function getDriver(): Driver | null {
  const uri = process.env.NEO4J_URI;
  if (!uri) return null;
  if (!driver) {
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(
        process.env.NEO4J_USER ?? 'neo4j',
        process.env.NEO4J_PASSWORD ?? 'cortexneo4j',
      ),
    );
  }
  return driver;
}

export async function withNeo4jSession<T>(
  _tenantId: string,
  fn: (session: Session) => Promise<T>,
): Promise<T | null> {
  const d = getDriver();
  if (!d) return null;
  const session = d.session();
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

export async function upsertNeo4jNode(
  tenantId: string,
  label: string,
  props: Record<string, unknown>,
): Promise<void> {
  await withNeo4jSession(tenantId, async (session) => {
    await session.run(
      `MERGE (n:${label} {tenant_id: $tenantId, id: $id})
       SET n += $props`,
      { tenantId, id: props.id, props: { ...props, tenant_id: tenantId } },
    );
  });
}

export async function upsertNeo4jRelationship(
  tenantId: string,
  fromId: string,
  toId: string,
  type: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  await withNeo4jSession(tenantId, async (session) => {
    await session.run(
      `MATCH (a {tenant_id: $tenantId, id: $fromId}), (b {tenant_id: $tenantId, id: $toId})
       MERGE (a)-[r:${type}]->(b)
       SET r += $props`,
      { tenantId, fromId, toId, props: { ...props, tenant_id: tenantId } },
    );
  });
}

export async function countNeo4jNodes(tenantId: string): Promise<number> {
  const result = await withNeo4jSession(tenantId, async (session) => {
    const r = await session.run(`MATCH (n {tenant_id: $tenantId}) RETURN count(n) AS c`, {
      tenantId,
    });
    return r.records[0]?.get('c')?.toNumber?.() ?? 0;
  });
  return result ?? 0;
}
