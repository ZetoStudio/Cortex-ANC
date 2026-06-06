# Cortex Platform

**Cortex** is the Single Brain for Your Entire Business — an AI-native company platform that connects every tool a business runs on into one intelligent system.

Demo-ready: minimal UI, NextAuth RBAC, hybrid RAG brain, 700+ connectors, full Docker stack + Ollama fallback.

## Stack

| Layer           | Technology                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | Next.js 16.2, React 19, Tailwind v4, minimal B&W UI, `@cortex/ui` |
| Monorepo        | Bun workspaces + Turborepo                                        |
| Auth            | NextAuth credentials (demo), `@cortex/auth` RBAC                  |
| Brain           | `@cortex/agent-core` — `runBrain`, project-scoped hybrid RAG      |
| Graph + vectors | `@cortex/graph-core` — pgvector + Postgres knowledge graph        |
| LLM gateway     | LiteLLM → Groq (70B) / Ollama (8B)                                |
| Integrations    | `@cortex/integration-core` — 706 adapted + 5 core connectors      |
| Events          | Kafka (`raw.events` → `entity.extracted`)                         |
| Workflows       | Temporal (`HandleClientReply` approval loop)                      |

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://docker.com)
- [Ollama](https://ollama.com) — local LLM + embeddings fallback
- Groq API key (primary LLM)

## One command — start everything

```bash
cd cortex-platform
cp .env.example .env   # set GROQ_API_KEY
bun install
bun run demo           # first time: infra + db + seed + build
bun run start:all      # Ollama + Docker + all services + web (background)
```

**Stop background processes:** `bun run start:all:stop`  
**Docker down:** `docker compose down`

### What `start:all` starts

| Process                                               | URL / port             |
| ----------------------------------------------------- | ---------------------- |
| Ollama (`ollama serve`)                               | http://localhost:11434 |
| Docker (Kafka, Temporal, LiteLLM, Nango, Postgres, …) | see ports below        |
| integration-service                                   | :3010                  |
| event-consumer                                        | Kafka consumer         |
| temporal-worker                                       | Temporal queue         |
| Next.js web                                           | http://localhost:3000  |

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
3. **Admin** → `/admin` stats → `/brain` → toggle **Ollama** for local fallback demo

## Manual start (step by step)

```bash
ollama serve &                    # if not already running
ollama pull llama3:8b
ollama pull nomic-embed-text

bun run infra:up
bun run db:init
bun run seed:brain
bun run services:dev &            # integration + event-consumer + temporal-worker
bun run dev                       # web on :3000
```

## Ports

| Service     | Port  |
| ----------- | ----- |
| Web         | 3000  |
| Ollama      | 11434 |
| LiteLLM     | 4000  |
| Postgres    | 5434  |
| Kafka       | 9092  |
| Kafka UI    | 9080  |
| Nango       | 3003  |
| Temporal    | 7233  |
| Temporal UI | 8088  |
| Redis       | 6380  |

## Environment

```bash
GROQ_API_KEY=...
LITELLM_URL=http://localhost:4000
DATABASE_URL=postgresql://cortex:cortex@localhost:5434/cortex
NEXTAUTH_SECRET=cortex-demo-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000
LOCAL_LLM_ENDPOINT=http://localhost:11434
LOCAL_LLM_MODEL=llama3:8b
```

## Scripts

```bash
bun run demo            # first-time bootstrap (infra + seed + build)
bun run start:all       # start Ollama + Docker + all services + web (bg)
bun run start:all:stop  # stop background processes
bun run test:brain      # smoke test brain CLI
bun run test:ollama     # probe Groq + Ollama via /api/brain/health
bun run build
bun run seed:brain
```

See `completion.md` for detailed status.
