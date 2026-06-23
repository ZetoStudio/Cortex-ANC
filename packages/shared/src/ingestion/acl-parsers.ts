import type { ACLPolicy, ConnectorSource, RawItem, TenantContext } from './adapter';

function defaultACL(): ACLPolicy {
  return {
    visibility: 'role',
    allowedRoles: ['ceo', 'admin'],
    sourcePermission: 'unknown',
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
}

function safeParse(fn: () => ACLPolicy): ACLPolicy {
  try {
    return fn();
  } catch {
    return defaultACL();
  }
}

export function parseGmailACL(raw: RawItem, ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const labelIds = Array.isArray(data?.labelIds)
      ? data.labelIds.filter((id): id is string => typeof id === 'string')
      : [];
    const sourcePermission = labelIds.length > 0 ? labelIds.join(',') : 'unknown';

    if (labelIds.includes('INBOX') && !labelIds.includes('CATEGORY_PROMOTIONS')) {
      return {
        visibility: 'user',
        allowedUserIds: [ctx.userId],
        sourcePermission,
      };
    }

    return { ...defaultACL(), sourcePermission };
  });
}

export function parseGoogleDriveACL(raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const permissions = Array.isArray(data?.permissions)
      ? data.permissions
          .map((p) => asRecord(p))
          .filter((p): p is Record<string, unknown> => p !== null)
      : [];

    const firstRole = permissions
      .map((p) => p.role)
      .find((role): role is string => typeof role === 'string');
    const sourcePermission = firstRole ?? 'unknown';

    if (permissions.some((p) => p.type === 'anyone')) {
      return { visibility: 'public', sourcePermission };
    }

    const emailAddresses = permissions
      .map((p) => p.emailAddress)
      .filter((email): email is string => typeof email === 'string');

    if (emailAddresses.length > 0) {
      return {
        visibility: 'user',
        allowedUserIds: emailAddresses,
        sourcePermission,
      };
    }

    return {
      visibility: 'role',
      allowedRoles: ['ceo', 'admin'],
      sourcePermission,
    };
  });
}

export function parseGoogleCalendarACL(raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const visibility = typeof data?.visibility === 'string' ? data.visibility : undefined;
    const sourcePermission = visibility ?? 'default';

    if (visibility === 'public') {
      return { visibility: 'public', sourcePermission };
    }

    return {
      visibility: 'role',
      allowedRoles: ['ceo', 'admin', 'hr'],
      sourcePermission,
    };
  });
}

export function parseGitHubACL(raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const repository = asRecord(data?.repository);
    const isPrivate = repository?.private === true;
    const sourcePermission = isPrivate ? 'private' : 'public';

    if (repository?.private === false) {
      return { visibility: 'public', sourcePermission };
    }

    return {
      visibility: 'role',
      allowedRoles: ['ceo', 'admin'],
      sourcePermission,
    };
  });
}

export function parseNotionACL(raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const parent = asRecord(data?.parent);
    const parentType = typeof parent?.type === 'string' ? parent.type : undefined;
    const sourcePermission = parentType ?? 'unknown';

    if (parentType === 'workspace') {
      return {
        visibility: 'role',
        allowedRoles: ['ceo', 'admin', 'hr'],
        sourcePermission,
      };
    }

    return {
      visibility: 'role',
      allowedRoles: ['ceo', 'admin'],
      sourcePermission,
    };
  });
}

export function parseSlackACL(raw: RawItem, ctx: TenantContext): ACLPolicy {
  return safeParse(() => {
    const data = asRecord(raw.raw);
    const channelType = typeof data?.channel_type === 'string' ? data.channel_type : undefined;
    const sourcePermission = channelType ?? 'unknown';

    if (channelType === 'public_channel') {
      return { visibility: 'team', sourcePermission };
    }

    if (channelType === 'private_channel') {
      const channel = typeof data?.channel === 'string' ? data.channel : 'unknown';
      return {
        visibility: 'team',
        allowedTeamIds: [channel],
        sourcePermission,
      };
    }

    if (channelType === 'im' || channelType === 'mpim') {
      const members = Array.isArray(data?.members)
        ? data.members.filter((id): id is string => typeof id === 'string')
        : [];
      return {
        visibility: 'user',
        allowedUserIds: members.length > 0 ? members : [ctx.userId],
        sourcePermission,
      };
    }

    return { ...defaultACL(), sourcePermission };
  });
}

export function parseLinearACL(_raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => ({
    visibility: 'role',
    allowedRoles: ['ceo', 'admin'],
    sourcePermission: 'internal',
  }));
}

export function parseJiraACL(_raw: RawItem, _ctx: TenantContext): ACLPolicy {
  return safeParse(() => ({
    visibility: 'role',
    allowedRoles: ['ceo', 'admin'],
    sourcePermission: 'internal',
  }));
}

export function parseACL(source: ConnectorSource, raw: RawItem, ctx: TenantContext): ACLPolicy {
  try {
    switch (source) {
      case 'gmail':
        return parseGmailACL(raw, ctx);
      case 'google_drive':
        return parseGoogleDriveACL(raw, ctx);
      case 'google_calendar':
        return parseGoogleCalendarACL(raw, ctx);
      case 'github':
        return parseGitHubACL(raw, ctx);
      case 'notion':
        return parseNotionACL(raw, ctx);
      case 'slack':
        return parseSlackACL(raw, ctx);
      case 'linear':
        return parseLinearACL(raw, ctx);
      case 'jira':
        return parseJiraACL(raw, ctx);
      default:
        return defaultACL();
    }
  } catch {
    return defaultACL();
  }
}
