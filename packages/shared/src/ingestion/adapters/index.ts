import type { ConnectorAdapter, ConnectorSource } from '../adapter';

import GmailAdapter from './gmail.adapter';
import GitHubAdapter from './github.adapter';
import GoogleCalendarAdapter from './google-calendar.adapter';

export { ConnectorAuthError, ConnectorRateLimitError } from './connector-http';
export { default as GitHubAdapter } from './github.adapter';
export { default as GmailAdapter } from './gmail.adapter';
export { default as GoogleCalendarAdapter } from './google-calendar.adapter';

export const ADAPTER_REGISTRY: Partial<Record<ConnectorSource, ConnectorAdapter>> = {
  github: new GitHubAdapter(),
  gmail: new GmailAdapter(),
  google_calendar: new GoogleCalendarAdapter(),
};
