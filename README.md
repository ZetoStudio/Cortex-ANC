# Cortex Platform

**Cortex** is the Single Brain for Your Entire Business — an AI-native company platform that connects every tool a business runs on into one intelligent system.

Demo-ready: minimal UI, NextAuth RBAC, hybrid RAG brain, **Groq-only LLM** (Ollama disabled).

## Stack

| Layer           | Technology                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | Next.js 16.2, React 19, Tailwind v4, minimal B&W UI, `@cortex/ui` |
| Monorepo        | Bun workspaces + Turborepo                                        |
| Auth            | NextAuth credentials (demo), `@cortex/auth` RBAC                  |
| Brain           | `@cortex/agent-core` — `runBrain`, project-scoped hybrid RAG      |
| Graph + vectors | `@cortex/graph-core` — pgvector + Postgres knowledge graph        |
| LLM gateway     | LiteLLM → Groq (70B)                                              |
| Integrations    | `@cortex/integration-core` — 706 adapted + 5 core connectors      |
| Events          | Kafka (`raw.events` → `entity.extracted`)                         |
| Workflows       | Temporal (`HandleClientReply` approval loop)                      |

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://docker.com)
- **Groq API key** (required — set in `.env`)

## One command — start everything

```bash
cd cortex-platform
cp .env.example .env   # set GROQ_API_KEY
bun install
bun run demo           # first time: infra + db + seed + build
bun run start:all      # Docker + all services + web (background, Groq only)
```

**Stop background processes:** `bun run start:all:stop`  
**Docker down:** `docker compose down`

### What `start:all` starts

| Process                                               | URL / port            |
| ----------------------------------------------------- | --------------------- |
| Docker (Kafka, Temporal, LiteLLM, Nango, Postgres, …) | see ports below       |
| integration-service                                   | :3010                 |
| event-consumer                                        | Kafka consumer        |
| temporal-worker                                       | Temporal queue        |
| Next.js web                                           | http://localhost:3000 |

Logs: `.cortex-logs/` · PIDs: `.cortex-pids/`

## Demo credentials

| Email             | Password | Role   | Sees                           |
| ----------------- | -------- | ------ | ------------------------------ |
| admin@cortex.anc  | password | admin  | All projects + admin + brain   |
| ceo@cortex.anc    | password | ceo    | Acme + Global Dynamics + admin |
| client@cortex.anc | password | client | BetaCorp only                  |

Sign in at http://localhost:3000/auth/login

## Demo flows

1. **Client** → Executive Desk → _"What is the status of my project?"_ → BetaCorp only
2. **CEO** → same question → Acme + Global Dynamics
3. **Admin** → `/admin` stats → `/brain` Groq debug chat

## Manual start

```bash
bun run infra:up
bun run db:init && bun run seed:brain
bun run services:dev &
bun run dev
```

## Ports

| Service     | Port |
| ----------- | ---- |
| Web         | 3000 |
| LiteLLM     | 4000 |
| Postgres    | 5434 |
| Kafka       | 9092 |
| Kafka UI    | 9080 |
| Nango       | 3003 |
| Temporal    | 7233 |
| Temporal UI | 8088 |
| Redis       | 6380 |

## Environment

```bash
GROQ_API_KEY=...
LITELLM_URL=http://localhost:4000
DATABASE_URL=postgresql://cortex:cortex@localhost:5434/cortex
NEXTAUTH_SECRET=cortex-demo-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000
```

## Scripts

```bash
bun run demo            # first-time bootstrap (infra + seed + build)
bun run start:all       # start Docker + all services + web (bg)
bun run start:all:stop  # stop background processes
bun run test:brain      # smoke test brain CLI
bun run build
bun run seed:brain
```

See `completion.md` for detailed status.
