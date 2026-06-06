# Cortex Platform

**The Single Brain for Your Entire Business** — AI-native company OS with hybrid RAG, 700+ connectors, and role-based desks.

## Documentation

All docs live in **[`docs/`](./docs/README.md)**:

- [Getting started](./docs/getting-started.md) — install & run
- [Demo guide](./docs/demo-guide.md) — CEO / Client demo flows
- [Project status](./docs/status.md) — ~95% demo-ready
- [Architecture](./docs/architecture.md) — full tech-stack map
- [Brain pipeline](./docs/BRAIN.md) — LLM + RAG

## Quick start

```bash
cp .env.example .env    # set GROQ_API_KEY
bun install
bun run demo            # first time
bun run start:all       # full stack
```

Open http://localhost:3000 → **Sign in as CEO** or **Sign in as Client**

## Stop (save resources)

```bash
bun run start:all:stop
docker compose down
```

## Stack

Next.js 16 · Bun/Turborepo · Postgres/pgvector · Kafka · Temporal · LiteLLM/Groq · NextAuth demo RBAC
