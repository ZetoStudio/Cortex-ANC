# Getting Started

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker Desktop](https://docker.com) — Kafka, Postgres, Temporal, LiteLLM, etc.
- **Groq API key** — [console.groq.com](https://console.groq.com)

## Setup

```bash
cd cortex-platform
cp .env.example .env
```

Required in `.env`:

```bash
GROQ_API_KEY=gsk_...                    # real key, not placeholder
LLM_PROVIDER=groq
DATABASE_URL=postgresql://cortex:cortex@localhost:5434/cortex
NEXTAUTH_SECRET=cortex-demo-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000
LITELLM_URL=http://localhost:4000
```

## First-time bootstrap

```bash
bun install
bun run demo        # infra + db:init + seed:brain + build
```

## Daily dev

**Lightweight (web only, no Docker):**

```bash
cd apps/web && bun run dev
```

Brain answers need Postgres + `GROQ_API_KEY`. Without Docker, vector/graph use in-memory fallback.

**Full stack:**

```bash
bun run start:all
```

**Stop:**

```bash
bun run start:all:stop
docker compose down
```

## Auth (demo)

Login uses **one-click role buttons** — no email/password form. Each button signs you in with a pre-configured demo persona (credentials are handled server-side, not shown in the UI).

See [Demo guide](./demo-guide.md).

## Ports

| Service       | Port        |
| ------------- | ----------- |
| Web           | 3000        |
| Postgres      | 5434        |
| LiteLLM       | 4000        |
| Kafka / UI    | 9092 / 9080 |
| Temporal / UI | 7233 / 8088 |
| Nango         | 3003        |

## Troubleshooting

| Issue                     | Fix                                                        |
| ------------------------- | ---------------------------------------------------------- |
| localhost:3000 won't load | `bun run start:all:stop` then `cd apps/web && bun run dev` |
| Port 3000 in use          | `lsof -ti :3000 \| xargs kill -9`                          |
| AI returns errors         | Check `GROQ_API_KEY` in `.env`; run `bun run test:brain`   |
| Laptop hot                | `docker compose down` — full stack uses ~8GB RAM           |

## Scripts

```bash
bun run build           # all packages
bun run seed:brain      # vectors + graph seed data
bun run test:brain      # CLI brain smoke test
bun run typecheck
```
