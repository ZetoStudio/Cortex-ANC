import {
  getConnectedAccount,
  getValidAccessToken,
  saveConnectedAccount,
  type StoredAccountToken,
} from '../auth/connected-accounts';
import { type OAuthProvider } from '../auth/oauth';

export type ConnectorProvider = 'google-workspace' | 'github';

export function connectorConnectionId(tenantId: string, provider: string): string {
  return `${tenantId}-${provider}`;
}

export type StoredConnectorToken = StoredAccountToken;

function toOAuthProvider(provider: ConnectorProvider): OAuthProvider {
  return provider === 'google-workspace' ? 'google' : 'github';
}

export async function getConnectorToken(
  tenantId: string,
  provider: ConnectorProvider,
): Promise<StoredConnectorToken | null> {
  return getConnectedAccount(tenantId, toOAuthProvider(provider));
}

export async function saveConnectorToken(
  tenantId: string,
  provider: ConnectorProvider,
  token: StoredConnectorToken,
): Promise<void> {
  await saveConnectedAccount(tenantId, toOAuthProvider(provider), token);
}

/** Refresh Google access token if expired. */
export async function getGoogleAccessToken(tenantId: string): Promise<string | null> {
  return getValidAccessToken('google', tenantId);
}
