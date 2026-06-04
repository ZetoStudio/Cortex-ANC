/** Lightweight connector catalogue for web (avoids importing integration-core in Next.js). */
export const CORE_CONNECTORS = [
  { id: 'slack', name: 'Slack', status: 'ready' as const },
  { id: 'github', name: 'GitHub', status: 'ready' as const },
  { id: 'gmail', name: 'Gmail', status: 'ready' as const },
  { id: 'linear', name: 'Linear', status: 'ready' as const },
  { id: 'notion', name: 'Notion', status: 'ready' as const },
] as const;

export const CONNECTOR_COUNT = 55;
