/** Hand-maintained + generated catalogue. Run `bun run adapt:connectors` to expand. */
export const CORE_CONNECTORS = [
  { id: 'slack', name: 'Slack', status: 'ready' as const },
  { id: 'github', name: 'GitHub', status: 'ready' as const },
  { id: 'gmail', name: 'Gmail', status: 'ready' as const },
  { id: 'linear', name: 'Linear', status: 'ready' as const },
  { id: 'notion', name: 'Notion', status: 'ready' as const },
] as const;

const generatedCatalog: typeof CORE_CONNECTORS | null = null;

export async function getConnectorCatalog() {
  try {
    const mod = await import('./registry.generated');
    return mod.CONNECTOR_CATALOG ?? CORE_CONNECTORS;
  } catch {
    return CORE_CONNECTORS;
  }
}

export function getConnectorCount(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./registry.generated') as { CONNECTOR_COUNT?: number };
    return mod.CONNECTOR_COUNT ?? CORE_CONNECTORS.length;
  } catch {
    return CORE_CONNECTORS.length;
  }
}
