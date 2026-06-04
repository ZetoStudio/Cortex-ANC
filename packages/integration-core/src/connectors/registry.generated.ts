// Run `bun run adapt:connectors` to refresh from activepieces-main
export const CONNECTOR_CATALOG = [
  { id: 'slack', name: 'Slack', status: 'ready' as const, path: './connectors/slack' },
  { id: 'github', name: 'GitHub', status: 'ready' as const, path: './connectors/github' },
  { id: 'gmail', name: 'Gmail', status: 'ready' as const, path: './connectors/gmail' },
  { id: 'linear', name: 'Linear', status: 'ready' as const, path: './connectors/linear' },
  { id: 'notion', name: 'Notion', status: 'ready' as const, path: './connectors/notion' },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    status: 'adapted' as const,
    path: './connectors-adapted/google-sheets',
  },
  { id: 'jira', name: 'Jira', status: 'adapted' as const, path: './connectors-adapted/jira' },
  {
    id: 'hubspot',
    name: 'HubSpot',
    status: 'adapted' as const,
    path: './connectors-adapted/hubspot',
  },
  { id: 'stripe', name: 'Stripe', status: 'adapted' as const, path: './connectors-adapted/stripe' },
  {
    id: 'discord',
    name: 'Discord',
    status: 'adapted' as const,
    path: './connectors-adapted/discord',
  },
  {
    id: 'airtable',
    name: 'Airtable',
    status: 'adapted' as const,
    path: './connectors-adapted/airtable',
  },
  { id: 'trello', name: 'Trello', status: 'adapted' as const, path: './connectors-adapted/trello' },
  { id: 'asana', name: 'Asana', status: 'adapted' as const, path: './connectors-adapted/asana' },
  {
    id: 'salesforce',
    name: 'Salesforce',
    status: 'adapted' as const,
    path: './connectors-adapted/salesforce',
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    status: 'adapted' as const,
    path: './connectors-adapted/zendesk',
  },
  {
    id: 'intercom',
    name: 'Intercom',
    status: 'adapted' as const,
    path: './connectors-adapted/intercom',
  },
  { id: 'twilio', name: 'Twilio', status: 'adapted' as const, path: './connectors-adapted/twilio' },
  { id: 'openai', name: 'OpenAI', status: 'adapted' as const, path: './connectors-adapted/openai' },
  {
    id: 'anthropic',
    name: 'Anthropic',
    status: 'adapted' as const,
    path: './connectors-adapted/anthropic',
  },
  {
    id: 'webhook',
    name: 'Webhook',
    status: 'adapted' as const,
    path: './connectors-adapted/webhook',
  },
] as const;

export const CONNECTOR_COUNT = 55;
