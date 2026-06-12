# Cortex Platform — Tech Stack & Architecture (personal notes)

> **Private file** — not committed to git. Your cheat sheet for what everything is and where it lives.

---

## The whole thing, explained like you're five

Imagine your company is a **big messy bedroom**.

- **Slack, Gmail, GitHub, Linear, Notion** = toys scattered everywhere (messages, tickets, emails, docs).
- **Cortex** = a **smart helper** who reads all the toys, remembers where everything is, and answers when you ask _"Where's the red block?"_ or _"Why is Acme stuck?"_
- The **Brain** = the helper's **thinking head** — it looks things up, connects dots, and writes answers with **stickers that say where it found the info** (citations).
- **The website** = the **door and control panel** — landing page outside, desks and chat inside after you sign in.
- **Postgres** = a **giant notebook + filing cabinet** — stores text memories (vectors) and who-is-connected-to-who (graph).
- **Kafka** = a **conveyor belt** — when something happens in a tool, a note rides the belt so Cortex can process it later.
- **Temporal** = a **patient babysitter** — for things that need _"wait for a human to say yes before sending that email."_
- **Groq + LiteLLM** = the **voice box** — the AI that actually writes sentences (Llama 3.3 70B in the demo).
- **Docker** = **boxes that run all the heavy machines** on your laptop without installing each one by hand.

**Flow in one breath:** Tools → (connectors / events) → memory + graph → you ask a question → Brain retrieves + thinks → answer on a Desk → optional human approval before sending.

---

## Big picture diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         YOU (browser)                                    │
│   Landing / Login / Executive Desk / Clients Desk / Brain / Admin       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  apps/web          Next.js 16 + React 19 + NextAuth                      │
│  API routes        /api/brain/chat, /api/executive-ask, etc.           │
└───────┬─────────────────┬──────────────────────┬────────────────────────┘
        │                 │                      │
        ▼                 ▼                      ▼
┌───────────────┐ ┌───────────────┐    ┌────────────────────┐
│ @cortex/      │ │ @cortex/      │    │ @cortex/graph-core │
│ agent-core    │ │ integration-  │    │ vectors + graph    │
│ Brain, RAG    │ │ core          │    │ in Postgres        │
└───────┬───────┘ └───────────────┘    └─────────┬──────────┘
        │                                        │
        ▼                                        ▼
┌───────────────┐                      ┌────────────────────┐
│ @cortex/      │                      │ Postgres + pgvector│
│ shared        │──LLM calls──────────▶│ (port 5434)        │
│ LLM, Kafka,   │                      └────────────────────┘
│ Temporal, log │
└───────┬───────┘
        │
        ├──────────▶ LiteLLM (4000) ──▶ Groq API (Llama 3.3 70B)
        │
        ├──────────▶ Kafka (9092) ◀── integration-service, event-consumer
        │
        └──────────▶ Temporal (7233) ◀── temporal-worker (approvals)

Docker also runs: Redis, Elasticsearch, Neo4j, Nango, Loki, Kafka UI, Temporal UI
(most are wired for production-shaped demo; demo Q&A runs mainly on seeded Postgres + Groq)
```

---

## Repo shape (monorepo)

| Folder               | What it is                                            |
| -------------------- | ----------------------------------------------------- |
| `apps/web/`          | The main website + API (Next.js)                      |
| `packages/*/`        | Shared libraries imported by web & services           |
| `services/*/`        | Background workers (Bun HTTP / Kafka / Temporal)      |
| `scripts/`           | Seed, start-all, demo, DB init                        |
| `infra/`             | LiteLLM config, other infra bits                      |
| `docs/`              | Product docs (brain, architecture, guides, seed data) |
| `docker-compose.yml` | All local infrastructure containers                   |

**Orchestration:** Turborepo (`turbo.json`) runs build/lint/typecheck across workspaces.  
**Runtime:** Bun 1.3.3 (`packageManager` in root `package.json`).  
**Language:** TypeScript everywhere.

---

## Every technology — what it is & where we use it

### Runtime & monorepo

| Tech               | What it does                         | Where                                               |
| ------------------ | ------------------------------------ | --------------------------------------------------- |
| **Bun**            | Fast JS/TS runtime + package manager | Root scripts, all `services/*`, `bun run dev/build` |
| **Turborepo**      | Caches & runs tasks across packages  | `turbo.json`, `bun run build`                       |
| **TypeScript**     | Typed JavaScript                     | All `apps/`, `packages/`, `services/`               |
| **npm workspaces** | Links `@cortex/*` packages together  | Root `package.json` `workspaces`                    |

### Frontend (website)

| Tech                                          | What it does                                 | Where                                                         |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| **Next.js 16**                                | React framework, App Router, API routes, SSR | `apps/web/`                                                   |
| **Turbopack**                                 | Fast dev bundler                             | `apps/web` script `next dev --turbopack`                      |
| **React 19**                                  | UI library                                   | All pages & components in `apps/web/`                         |
| **Tailwind CSS 4**                            | Utility CSS                                  | `apps/web/app/globals.css`, `@tailwindcss/postcss`            |
| **shadcn / Base UI**                          | Component primitives                         | `apps/web/components/ui/`, `@base-ui/react`, `shadcn` CLI dep |
| **Framer Motion**                             | Animations (floating hero icons)             | `apps/web/components/ui/floating-icons-hero-section.tsx`      |
| **Lucide React**                              | Icons                                        | `apps/web/`, `@cortex/ui`                                     |
| **Instrument Serif + Inter + JetBrains Mono** | Display, body, mono fonts                    | `apps/web/app/layout.tsx` (Google fonts)                      |
| **Recharts**                                  | Charts (admin stats)                         | `apps/web` admin pages                                        |
| **clsx + tailwind-merge + CVA**               | Class name helpers                           | `apps/web/lib/utils.ts`, UI components                        |
| **tw-animate-css**                            | Animation utilities                          | `globals.css` imports                                         |

**Key pages (`apps/web/app/`):**

| Route             | Purpose                        |
| ----------------- | ------------------------------ |
| `/`               | Landing page                   |
| `/auth/login`     | NextAuth credentials login     |
| `/executive-desk` | CEO chat — internal projects   |
| `/clients-desk`   | Client email + AI reply flow   |
| `/brain`          | Full Brain chat (admin/CEO)    |
| `/admin/*`        | Connectors, logs, improvements |
| `/graph`          | Knowledge graph viewer         |
| `/connectors`     | Connector catalogue UI         |
| `/approvals`      | Human-in-the-loop approvals    |

**Key components:**

| Path                             | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `components/landing/`            | Landing page sections                            |
| `components/ui/liquid-glass.tsx` | Glassmorphism CTA buttons                        |
| `components/app-shell.tsx`       | Dark app chrome after login                      |
| `packages/ui/`                   | Shared chat UI (ChatWindow, ChatInput, Markdown) |

### Auth & security

| Tech                       | What it does                                                             | Where                                          |
| -------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| **NextAuth v4**            | Session + JWT auth                                                       | `apps/web/app/api/auth/[...nextauth]/route.ts` |
| **Credentials provider**   | Email/password demo login                                                | `apps/web/lib/auth-options.ts`                 |
| **@cortex/auth**           | Demo user definitions (CEO, Client, Admin)                               | `packages/auth/src/demo-users.ts`              |
| **Middleware**             | Protect routes, role-based redirects                                     | `apps/web/middleware.ts`                       |
| **Clerk (@clerk/backend)** | Legacy dep in auth package; **not used** in web after NextAuth migration | `packages/auth/` only                          |

**Roles & project scope:** Stored in JWT — `ceo` → acme + global-dynamics, `client` → betacorp, `admin` → all.

### AI / LLM stack

| Tech                          | What it does                                  | Where                                                                  |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| **Groq**                      | Hosted fast LLM API (Llama 3.3 70B)           | `.env` `GROQ_API_KEY`, called via LiteLLM                              |
| **LiteLLM**                   | LLM gateway / proxy (one URL for many models) | Docker `litellm:4000`, `infra/litellm/config.yaml`                     |
| **Llama 3.3 70B Versatile**   | Default chat model                            | `GROQ_MODEL`, LiteLLM model `cortex-groq`                              |
| **@cortex/shared llmClient**  | Calls LiteLLM chat completions                | `packages/shared/src/llm/client.ts`                                    |
| **Agent role prompts**        | Reasoning vs response system prompts          | `packages/shared/src/llm/prompts.ts`                                   |
| **Hash embeddings (768-dim)** | Demo vector search without embed API          | `packages/shared/src/llm/embeddings.ts`                                |
| **pgvector**                  | Stores & searches vectors in Postgres         | `packages/graph-core/src/pg-store.ts`, Docker `pgvector/pgvector:pg16` |

**Brain pipeline (`@cortex/agent-core`):**

| Step             | File                         | What happens                                       |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| Orchestrator     | `src/orchestrator.ts`        | Entry point → delegates to Brain                   |
| Brain            | `src/brain/index.ts`         | Plan → retrieve → action gate → answer + citations |
| Hybrid retrieval | `src/hybrid-retrieval.ts`    | Vector search + graph hints + reranking            |
| Retrieval        | `src/retrieval.ts`           | Seed docs, citation formatting                     |
| Query cache      | `src/brain/query-cache.ts`   | In-memory repeat-question cache                    |
| Write actions    | `src/tools/write-actions.ts` | Approval-gated send/post actions                   |
| Client reply     | `src/client-reply.ts`        | Draft client email replies                         |

**API routes that call the Brain:**

| Route                                     | Used by        |
| ----------------------------------------- | -------------- |
| `apps/web/app/api/brain/chat/route.ts`    | Brain page     |
| `apps/web/app/api/executive-ask/route.ts` | Executive Desk |
| `apps/web/app/api/client-reply/route.ts`  | Clients Desk   |
| `apps/web/app/api/chat/route.ts`          | Generic chat   |

### Memory & knowledge graph

| Tech                   | What it does                                       | Where                                           |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------- |
| **PostgreSQL 16**      | Primary database                                   | Docker `postgres`, port **5434** (host)         |
| **pgvector**           | Vector similarity search                           | `cortex_documents.embedding vector(768)`        |
| **Graph tables**       | Nodes & edges in Postgres (not Neo4j in demo path) | `packages/graph-core/src/graph-client.ts`       |
| **@cortex/graph-core** | Index docs, search, graph CRUD                     | Used by agent-core, event-consumer, seed script |
| **MOCK_DOCUMENTS**     | 18 demo docs (Acme, BetaCorp, Global Dynamics)     | `packages/graph-core/src/mock-data.ts`          |
| **seed-graph.ts**      | Loads vectors + graph for demo                     | `scripts/seed-graph.ts` (`bun run seed:brain`)  |

**Neo4j** is in Docker for future/alternate graph reads — demo Brain uses **Postgres graph tables**.

**Elasticsearch** is in Docker — wired in `.env` for search expansion; demo path leans on pgvector.

### Connectors & integrations

| Tech                               | What it does                                            | Where                                       |
| ---------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| **@cortex/integration-core**       | Connector framework + 5 live connectors + 706 catalogue | `packages/integration-core/src/connectors/` |
| **Slack (@slack/web-api)**         | Slack connector                                         | `connectors/slack/`                         |
| **Google APIs (googleapis)**       | Gmail connector                                         | `connectors/gmail/`                         |
| **@linear/sdk**                    | Linear connector                                        | `connectors/linear/`                        |
| **@notionhq/client**               | Notion connector                                        | `connectors/notion/`                        |
| **GitHub**                         | GitHub connector                                        | `connectors/github/`                        |
| **registry.generated.ts**          | 706+ catalogue entries (registry only in demo)          | `connectors/registry.generated.ts`          |
| **Zod**                            | Validation in connector framework                       | integration-core                            |
| **axios + axios-retry**            | HTTP client for connectors                              | integration-core `common/lib/http/`         |
| **Activepieces-derived framework** | Piece/action/trigger patterns                           | `integration-core/src/framework/`           |
| **adapt-connectors.ts**            | Script to generate adapted connectors                   | `scripts/adapt-connectors.ts`               |

| Tech                    | What it does                               | Where                                       |
| ----------------------- | ------------------------------------------ | ------------------------------------------- |
| **Nango**               | OAuth connection manager (production path) | Docker `nango:3003`, `integration-service`  |
| **@nangohq/node**       | Nango SDK                                  | `services/integration-service/src/index.ts` |
| **integration-service** | Webhooks + sync → publishes Kafka events   | Bun server port **3010**                    |

### Event streaming & async workers

| Tech                  | What it does                                           | Where                                        |
| --------------------- | ------------------------------------------------------ | -------------------------------------------- |
| **Apache Kafka**      | Event bus                                              | Docker `kafka:9092`, `@cortex/shared/kafka`  |
| **KafkaJS**           | Node Kafka client                                      | `packages/shared/src/kafka/`, event-consumer |
| **Kafka UI**          | Debug topics in browser                                | Docker port **9080**                         |
| **event-consumer**    | Consumes `raw.events`, indexes docs, extracts entities | `services/event-consumer/src/consumer.ts`    |
| **ingestion-service** | Spoke ingest helpers (e.g. Slack)                      | `services/ingestion-service/`                |
| **monitoring-agent**  | Watches events / DB (ops)                              | `services/monitoring-agent/`                 |

**Topics:** Defined in `@cortex/shared` — e.g. `raw.events`, entity extraction events.

### Workflows & approvals

| Tech                           | What it does                                | Where                                       |
| ------------------------------ | ------------------------------------------- | ------------------------------------------- |
| **Temporal**                   | Durable workflows (wait for human approval) | Docker `temporal:7233`                      |
| **Temporal UI**                | Workflow debugger                           | Docker port **8088**                        |
| **@temporalio/worker**         | Runs workflow workers                       | `services/temporal-worker/`                 |
| **@temporalio/client**         | Starts workflows from app                   | `packages/shared/src/temporal/client.ts`    |
| **handleClientReply workflow** | Waits for approve/deny signal before send   | `services/temporal-worker/src/workflows.ts` |
| **Approvals API**              | UI backend for pending approvals            | `apps/web/app/api/approvals/route.ts`       |

### Caching & supporting infra

| Tech                   | What it does             | Where                                                                   |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------- |
| **Redis 7**            | Cache layer (configured) | Docker port **6380**, `REDIS_URL`, `packages/shared/src/redis-cache.ts` |
| **Loki**               | Log aggregation          | Docker port **3100**, `LOKI_URL`                                        |
| **Pino**               | Structured logging       | `packages/shared/src/logger.ts`, all services                           |
| **pg (node-postgres)** | Postgres driver          | web, graph-core, agent-core, monitoring-agent                           |

### DevOps & quality

| Tech                    | What it does         | Where                         |
| ----------------------- | -------------------- | ----------------------------- |
| **Docker Compose**      | Local full stack     | `docker-compose.yml`          |
| **GitHub Actions**      | CI on push/PR        | `.github/workflows/ci.yml`    |
| **ESLint**              | Linting              | Root + per-package            |
| **Prettier**            | Formatting           | Root `format` script          |
| **Husky + lint-staged** | Pre-commit hooks     | Root `prepare`, `lint-staged` |
| **Commitlint**          | Conventional commits | `@commitlint/*` devDeps       |

### Scripts you'll actually run

| Command                  | What it does                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `bun run demo`           | First-time setup helper                                                   |
| `bun run start:all`      | Docker + integration-service + event-consumer + temporal-worker + Next.js |
| `bun run start:all:stop` | Stop background processes                                                 |
| `bun run seed:brain`     | Seed Postgres vectors + graph                                             |
| `bun run db:up`          | Postgres only                                                             |
| `bun run infra:up`       | Full Docker stack                                                         |
| `bun run build`          | Build everything (CI uses this)                                           |

Logs go to `.cortex-logs/` (gitignored). PIDs to `.cortex-pids/`.

---

## Package-by-package map

### `apps/web` (@cortex/web)

The product surface. Next.js app: landing, auth, desks, admin, all `/api/*` routes. Imports `@cortex/agent-core`, `@cortex/auth`, `@cortex/ui`, `@cortex/shared`.

### `packages/agent-core` (@cortex/agent-core)

The Brain. Hybrid RAG, orchestration, client reply logic, write-action gates. No UI.

### `packages/graph-core` (@cortex/graph-core)

Memory layer. pgvector document store, Postgres knowledge graph, mock seed data, `GraphClient`.

### `packages/integration-core` (@cortex/integration-core)

706+ connector catalogue + 5 runnable connectors (Slack, GitHub, Gmail, Linear, Notion). Adapted from Activepieces-style pieces.

### `packages/shared` (@cortex/shared)

Cross-cutting utilities: LLM client, embeddings, Kafka, Temporal client, HTTP client, logger, event types, Redis cache.

### `packages/auth` (@cortex/auth)

Demo users only (`ceo@cortex.anc`, `client@cortex.anc`, `admin@cortex.anc`). Used by NextAuth `authorize()`.

### `packages/ui` (@cortex/ui)

Shared React components: chat window, messages, input, markdown, logo, spinner. Dark variant for internal app.

### `services/integration-service`

Bun HTTP server. Nango webhooks → Kafka. Port 3010.

### `services/event-consumer`

Kafka consumer. Indexes incoming events into graph-core, optional LLM entity extraction.

### `services/temporal-worker`

Temporal worker on queue `cortex-approvals`. Client reply approval workflow.

### `services/ingestion-service`

Pull-based ingest from spokes (Slack etc.) into the graph.

### `services/monitoring-agent`

Operational monitoring over Kafka/Postgres.

---

## Environment variables (`.env`)

| Variable                           | Points to                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| `GROQ_API_KEY`                     | Groq cloud (required for AI)                                       |
| `LITELLM_URL`                      | http://localhost:4000                                              |
| `DATABASE_URL`                     | Postgres on 5434                                                   |
| `KAFKA_BROKERS`                    | localhost:9092                                                     |
| `REDIS_URL`                        | localhost:6380                                                     |
| `TEMPORAL_ADDRESS`                 | localhost:7233                                                     |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Auth sessions                                                      |
| `NANGO_*`                          | OAuth (production connectors)                                      |
| Connector tokens                   | `SLACK_BOT_TOKEN`, `GITHUB_TOKEN`, etc. (optional live connectors) |

Copy from `.env.example`.

---

## Demo vs production-shaped pieces

**What actually powers the demo today:**

- Seeded Postgres (vectors + graph) via `seed:brain`
- Groq via LiteLLM for all chat
- NextAuth demo users for RBAC
- Hand-tuned hybrid retrieval in agent-core

**What's running but lightly used in demo:**

- Kafka pipeline (works when infra up; graceful fallback if not)
- Temporal (client reply approval path)
- Nango (needs keys for real OAuth)
- Elasticsearch, Neo4j, Redis, Loki
- 701 catalogue connectors (browse only; 5 are code-complete)

---

## Mental model for interviews / pitches

1. **Ingest** — connectors pull or receive events from tools
2. **Remember** — vectors (fuzzy search) + graph (relationships) in Postgres
3. **Reason** — Brain plans, retrieves, cites, optionally gates writes
4. **Act** — Temporal + approvals for anything that leaves the building
5. **Learn** — event-consumer + nightly improvement loop (product story; monitoring-agent / admin improvements UI)

---

## Quick file index (when you're lost)

| I need to change… | Go to…                                                            |
| ----------------- | ----------------------------------------------------------------- |
| Landing page      | `apps/web/components/landing/landing-page.tsx`                    |
| Login / users     | `apps/web/lib/auth-options.ts`, `packages/auth/src/demo-users.ts` |
| Brain answers     | `packages/agent-core/src/brain/index.ts`                          |
| Retrieval quality | `packages/agent-core/src/hybrid-retrieval.ts`                     |
| Demo data         | `packages/graph-core/src/mock-data.ts`, `scripts/seed-graph.ts`   |
| Connector list    | `packages/integration-core/src/connectors/registry*.ts`           |
| Start everything  | `scripts/start-all.sh`                                            |
| Docker services   | `docker-compose.yml`                                              |
| LLM model         | `infra/litellm/config.yaml`, `.env`                               |
| Product docs      | `docs/`                                                           |

---

_Last updated: personal local notes — keep in sync manually when stack changes._
