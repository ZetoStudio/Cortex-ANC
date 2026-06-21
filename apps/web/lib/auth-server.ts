import { randomUUID } from 'node:crypto';

import { resolveRoleFromEmail } from '@cortex/auth';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function authBaseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function trustedOrigins(): string[] {
  const base = authBaseUrl();
  return [
    base,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
  ];
}

function socialProviders(): Record<string, { clientId: string; clientSecret: string }> {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};
  const githubId = process.env.GITHUB_CLIENT_ID?.trim();
  const githubSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (githubId && githubSecret) {
    providers.github = { clientId: githubId, clientSecret: githubSecret };
  }
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret) {
    providers.google = { clientId: googleId, clientSecret: googleSecret };
  }
  return providers;
}

function createAuth() {
  const providers = socialProviders();
  return betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET ?? 'cortex-dev-secret',
    baseURL: authBaseUrl(),
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
    },
    ...(Object.keys(providers).length > 0 ? { socialProviders: providers } : {}),
    user: {
      additionalFields: {
        tenantId: {
          type: 'string',
          required: false,
          input: false,
        },
        role: {
          type: 'string',
          required: false,
          defaultValue: 'member',
          input: false,
        },
        employeeId: {
          type: 'string',
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const role = resolveRoleFromEmail(
              user.email ?? '',
              user.role as string | null | undefined,
            );
            if (role === 'super_admin') {
              if (!user.tenantId) {
                const tenantId = `tenant-${randomUUID().slice(0, 8)}`;
                const slug = 'platform-admin';
                await pool.query(
                  `INSERT INTO tenants (id, name, slug, owner_user_id) VALUES ($1, $2, $3, $4)`,
                  [tenantId, 'Platform Admin', slug, user.id],
                );
                await pool.query(`INSERT INTO tenant_onboarding (tenant_id) VALUES ($1)`, [
                  tenantId,
                ]);
                await pool.query(
                  `UPDATE "user" SET "tenantId" = $1, role = 'super_admin' WHERE id = $2`,
                  [tenantId, user.id],
                );
              } else {
                await pool.query(`UPDATE "user" SET role = 'super_admin' WHERE id = $1`, [user.id]);
              }
              return;
            }

            if (user.tenantId) return;
            const tenantId = `tenant-${randomUUID().slice(0, 8)}`;
            const slug = (user.email?.split('@')[0] ?? 'workspace')
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .slice(0, 48);
            const name = user.name ?? `${slug}'s Workspace`;
            await pool.query(
              `INSERT INTO tenants (id, name, slug, owner_user_id) VALUES ($1, $2, $3, $4)`,
              [tenantId, name, slug || tenantId, user.id],
            );
            await pool.query(`INSERT INTO tenant_onboarding (tenant_id) VALUES ($1)`, [tenantId]);
            await pool.query(`UPDATE "user" SET "tenantId" = $1, role = $2 WHERE id = $3`, [
              tenantId,
              role,
              user.id,
            ]);
          },
        },
      },
    },
  });
}

export const auth = createAuth();
