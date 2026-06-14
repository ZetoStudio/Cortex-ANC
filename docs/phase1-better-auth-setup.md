# Cortex v2 Phase 1 — Better Auth setup

## 1. Environment

Copy `.env.example` and set:

```bash
BETTER_AUTH_SECRET=<random-32-chars>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sign-in (pick one or both)
GITHUB_CLIENT_ID=...          # OAuth App → callback /api/auth/callback/github
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...          # optional
GOOGLE_CLIENT_SECRET=...
```

Email/password works with no OAuth setup. Run `bun run auth:migrate` if sign-up returns 500.

## 2. Database

```bash
bun run infra:up
bun run db:init      # schema + multi-tenancy RLS + Better Auth tables
bun run db:wipe      # empty all tenant data (safe re-run)
```

## 3. Sign up flow

1. `/auth/login` — Google SSO or email/password sign-up
2. Better Auth hook creates `tenants` row + `tenant_onboarding` record
3. Redirect to `/onboarding` — connect Google Workspace + GitHub via Nango
4. OAuth triggers `IngestInitialData` Temporal workflow
5. Executive Desk — ask questions with citations from real ingested data

## 4. Connector OAuth (no Nango)

Add this redirect URI to **both** Google and GitHub OAuth apps:

`http://localhost:3010/oauth/callback`

Sign-in (Better Auth) still uses `http://localhost:3000/api/auth/callback/{google|github}`.
