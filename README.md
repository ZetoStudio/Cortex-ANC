# Cortex Platform

**The single brain for your entire business.**

## Documentation

Product docs — read in order:

1. [The Brain](./docs/brain.md) — what Cortex is
2. [How Cortex works](./docs/architecture.md) — product architecture
3. [Executive guide](./docs/executive-guide.md) — leadership & CEO
4. [Client guide](./docs/client-guide.md) — external customer (BetaCorp)

Full index: **[docs/README.md](./docs/README.md)**

## Run locally (developers)

```bash
cp .env.example .env    # set GROQ_API_KEY
bun install
bun run demo            # first time
bun run start:all       # full stack
```

Open http://localhost:3000/auth/login

```bash
bun run start:all:stop  # stop background services
docker compose down     # stop containers
```

## Sign-in

- **Production:** Google OAuth (configure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`).
- **Super admin:** `aneeshg@zeto.studio` (Google sign-in) — Panel access and employee approvals.
- **Local dev only:** HR and Employee shortcuts on the login page when `HR_DEV_BYPASS` / `EMPLOYEE_DEV_BYPASS` are enabled (hidden in production).

## Railway (V1)

```bash
# Build & run via Dockerfile; set DATABASE_URL and run postdeploy:
bun run db:migrate
```

Health check: `GET /api/health` → `{ status, db }`. See [.env.example](./.env.example) for required variables.
