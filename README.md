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

## Demo accounts

Not shown on the login page:

| Role   | Email               | Password   |
| ------ | ------------------- | ---------- |
| CEO    | `ceo@cortex.anc`    | `password` |
| Client | `client@cortex.anc` | `password` |
| Admin  | `admin@cortex.anc`  | `password` |

**CEO** → Acme + Global Dynamics (internal). **Client** → BetaCorp only. **Admin** → all projects + admin tools.

See [Executive guide](./docs/executive-guide.md) and [Client guide](./docs/client-guide.md) for role-specific walkthroughs.
