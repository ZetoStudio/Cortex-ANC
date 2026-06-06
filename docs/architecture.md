# Cortex Platform — Learning Guide (Tech Stack)

A detailed map of **what was built and how the pieces connect**, organized by technology layer — not by product feature.

---

## 1. Monorepo & Build System

### Bun workspaces + Turborepo

- **Root:** `cortex-platform/package.json` — workspaces: `apps/*`, `packages/*`, `services/*`
- **Task runner:** Turborepo (`turbo.json`) — `build`, `dev`, `lint`, `typecheck` with dependency graph (`dependsOn: ["^build"]`)
- **Package manager:** Bun 1.3+ (`bun install`, `bun run`)
- **Lint/format:** ESLint, Prettier, Husky pre-commit, commitlint

### Packages (libraries)

| Package                    | Role                                                                             |
| -------------------------- | -------------------------------------------------------------------------------- |
| `@cortex/shared`           | HTTP client, LLM client, embeddings, Kafka helpers, Temporal client, Pino logger |
| `@cortex/graph-core`       | Postgres pgvector store + knowledge graph (nodes/edges)                          |
| `@cortex/agent-core`       | Brain orchestration, hybrid RAG, client reply, write actions                     |
| `@cortex/integration-core` | Connector factory, 5 core + 706 generated registry entries                       |
| `@cortex/auth`             | NextAuth demo personas + RBAC (`admin`, `ceo`, `client`)                         |
| `@cortex/ui`               | Chat/panel components (light + dark variants)                                    |

### Apps

| App           | Role                                               |
| ------------- | -------------------------------------------------- |
| `@cortex/web` | Next.js 16.2 App Router — desks, admin, API routes |

### Services (long-running processes)

| Service                       | Role                                      |
| ----------------------------- | ----------------------------------------- |
| `@cortex/event-consumer`      | Kafka consumer → ingest → graph + vectors |
| `@cortex/integration-service` | Nango proxy + connector status REST       |
| `@cortex/temporal-worker`     | Temporal worker for approval workflows    |
| `@cortex/monitoring-agent`    | Daily QA sweep → improvement suggestions  |
| `@cortex/ingestion-service`   | Slack spoke (optional live ingest)        |

---

## 2. Frontend Layer

### Next.js 16.2 (App Router)

- **Location:** `apps/web/`
- **Rendering:** React 19, Server Components + client islands for interactive desks
- **Styling:** Tailwind CSS v4, custom Galvanite theme (dark glass, gradient accents)
- **UI primitives:** shadcn/ui v4, `@base-ui/react`, `lucide-react`

### Pages (routes)

```
/                    Landing
/executive-desk      Leadership Q&A chat
/clients-desk        Client email reply + HITL
/chat                Simple brain chat
/approvals           Pending write-action queue
/admin               Dashboard
/admin/connections   Connector catalogue + Nango status
/admin/logs          Event activity feed
/admin/improvements  AI monitoring suggestions
/connectors          Connector explorer (scaffold)
/graph               Graph explorer (scaffold)
/sign-in, /sign-up   Clerk auth pages
```

### API routes (BFF)

All under `apps/web/app/api/`:

- `executive-ask` — calls `runBrain`, logs to `qa_logs`
- `client-reply` — drafts reply, creates approval, starts Temporal workflow
- `approvals` — GET pending / POST approve|deny (signals Temporal or direct execute)
- `connectors`, `admin/*` — stats, logs, improvements, Nango status

### Auth middleware

- **File:** `apps/web/middleware.ts`
- **Auth:** NextAuth credentials — one-click role buttons at `/auth/login` (CEO / Client / Admin)

---

## 3. Data Layer

### PostgreSQL + pgvector

- **Image:** `pgvector/pgvector:pg16`
- **Host port:** 5434 (avoids local Postgres conflicts)
- **Connection:** `DATABASE_URL=postgresql://cortex:cortex@localhost:5434/cortex`
- **Init script:** `scripts/init-db.sh`

### Tables

| Table                       | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `cortex_documents`          | Vector embeddings (pgvector) + metadata JSON        |
| `cortex_nodes`              | Knowledge graph nodes (id, label, type, properties) |
| `cortex_edges`              | Graph edges (from_id, to_id, type, properties)      |
| `cortex_approvals`          | HITL write-action queue (pending/approved/denied)   |
| `cortex_agent_interactions` | Agent run history                                   |
| `qa_logs`                   | Executive desk Q&A for monitoring eval              |
| `improvement_suggestions`   | Monitoring agent output                             |

### Graph client

- **Package:** `@cortex/graph-core`
- **Class:** `GraphClient` — `upsertNode`, `upsertEdge`, `findNodesByLabel`, `traverse(fromId, depth=2)` via recursive CTE
- **Vector search:** `searchSimilar`, `indexDocument` — cosine similarity on pgvector, in-memory fallback when no DB

### Seed data

- **Script:** `scripts/seed-graph.ts` (`bun run seed:brain`)
- **Content:** Acme project subgraph — milestones, meetings, 3 tickets, 3 PRs, 2 deals, assignees (Jane, Alex, Sam), blocking edges, 12 vector documents

### Neo4j (optional)

- **Container:** `neo4j:5-community` on 7474/7687
- **Status:** Running in compose; primary graph is Postgres. Neo4j available for future read replica / visualization.

---

## 4. AI / LLM Layer

### LiteLLM gateway

- **Container:** `ghcr.io/berriai/litellm:main-latest` on port 4000
- **Config:** `infra/litellm/config.yaml`
  - `cortex-groq` → Groq `llama-3.3-70b-versatile`
  - `cortex-ollama` → Ollama `llama3:8b` at `host.docker.internal:11434`
- **Master key:** `cortex-local-dev` (env: `LITELLM_MASTER_KEY`)

### LLM client (`@cortex/shared`)

- **File:** `packages/shared/src/llm/client.ts`
- **Default:** All Groq calls route through LiteLLM when `LITELLM_URL` is set (default `http://localhost:4000`)
- **Providers:** Groq (primary), Ollama (local fallback)
- **Features:** Retries (3x), agent role system prompts (`BRAIN_PROMPTS`), `completeLocal` for cheap tasks via LiteLLM→Ollama

### Embeddings

- **File:** `packages/shared/src/llm/embeddings.ts`
- **Flow:** LiteLLM `/v1/embeddings` first → direct Ollama `nomic-embed-text` fallback
- **Storage:** 768-dim vectors in `cortex_documents`

### Brain pipeline (`@cortex/agent-core`)

```
runBrain(question)
  → reasoning step (LLM)
  → hybridRetrieveContext (vectors + graph)
  → response step (LLM with citations)
```

- **Hybrid retrieval:** `packages/agent-core/src/hybrid-retrieval.ts`
  - Regex entity hints (Acme, PROJ-101, ticket IDs)
  - Graph traverse depth 2 from matched nodes
  - Vector top-K from pgvector
  - Dedupe by entity ID, merge into structured context + `SourceCitation[]`

---

## 5. Event Streaming (Kafka)

### Infrastructure

- **Broker:** Confluent `cp-kafka:7.7.1` on 9092 (KRaft mode, single node)
- **UI:** Kafka UI on 9080
- **Client:** `kafkajs` in `@cortex/shared/kafka`

### Topics

| Topic              | Producer                                   | Consumer             |
| ------------------ | ------------------------------------------ | -------------------- |
| `raw.events`       | Ingestion scripts, `publish-test-event.ts` | `event-consumer`     |
| `entity.extracted` | `event-consumer`                           | (future subscribers) |

### Event consumer flow

**File:** `services/event-consumer/src/consumer.ts`

1. Consume `raw.events` JSON → `CortexEvent`
2. Index text into pgvector via `indexDocument`
3. Extract entities (regex + optional Ollama LLM via `USE_LLM_ENTITY_EXTRACTION`)
4. Upsert graph nodes/edges (`source:X` → `mentioned_in` → entity)
5. Publish `entity.extracted`

### Test

```bash
bun run test:event   # scripts/publish-test-event.ts
```

---

## 6. Workflow Engine (Temporal)

### Infrastructure

- **Server:** `temporalio/auto-setup:1.25.1` on 7233 (Postgres backend, `DB=postgres12`)
- **UI:** Temporal UI on 8088

### Workflow: HandleClientReply

**Worker:** `services/temporal-worker/`

```
client-reply API
  → requestWriteAction (Postgres cortex_approvals)
  → startHandleClientReplyWorkflow (Temporal)
  → workflow waits on approvalDecision signal
  → /api/approvals POST approved
  → signalClientReplyApproval
  → executeApprovedActionActivity (Gmail send or simulated)
```

**Files:**

- `packages/shared/src/temporal/client.ts` — start workflow, signal approval
- `services/temporal-worker/src/workflows.ts` — `handleClientReply`
- `services/temporal-worker/src/activities.ts` — `executeApprovedAction`

**Task queue:** `cortex-approvals`

---

## 7. Integration Layer (Connectors + Nango)

### Nango

- **Container:** `nangohq/nango-server:latest` on 3003
- **DB:** Shares Postgres (`NANGO_DATABASE_URL`)
- **Service:** `services/integration-service` — REST proxy, `GET /api/connectors/status`

### Connector architecture

- **Factory:** `createConnector` in `@cortex/integration-core`
- **Core (hand-adapted):** Slack, Gmail, GitHub, Linear, Notion — full actions
- **Generated:** 706 pieces from Activepieces via `scripts/adapt-connectors.ts`
  - Output: `packages/integration-core/src/connectors-adapted/` (gitignored)
  - Registry: `registry.generated.ts` (committed, catalog only)
  - Typecheck excludes adapted folder (thousands of TS errors in raw adapt)

### Adapt script

```bash
bun run adapt:connectors          # 5 core
bun run adapt:connectors --all    # 706 from ../activepieces-main
```

### Write actions

- **File:** `packages/agent-core/src/tools/write-actions.ts`
- **Flow:** Insert `cortex_approvals` → on approve → `getConnector('gmail').actions.send_email` or simulated

---

## 8. Observability & Self-Improvement

### Logging

- **Library:** Pino (`createLogger` in `@cortex/shared`)
- **Optional:** Sentry DSN

### Loki

- **Container:** Grafana Loki 3.0 on 3100
- **Env:** `LOKI_URL` for future log shipping

### Monitoring agent

- **Service:** `services/monitoring-agent/src/index.ts`
- **Flow:** Read last 100 from `cortex_agent_interactions` / `qa_logs` → local LLM pass/fail eval → insert `improvement_suggestions`
- **UI:** `/admin/improvements` — list, apply, dismiss

### Elasticsearch

- **Container:** ES 8.15 on 9200
- **Use:** Admin logs feed (`/api/admin/logs`), future full-text event search

---

## 9. Caching & Supporting Infra

### Redis

- **Container:** `redis:7-alpine` on host port **6380** (6379 often taken locally)
- **Env:** `REDIS_URL=redis://localhost:6380`
- **Status:** Running; wired for future session/cache use

---

## 10. Docker Compose Topology

```
                    ┌─────────────┐
                    │  Next.js    │ :3000
                    │  (host)     │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────┐  ┌──────────────────┐  ┌─────────────┐
│ Postgres│  │ LiteLLM :4000    │  │ Temporal    │
│ :5434   │  │ → Groq / Ollama  │  │ :7233       │
└────┬────┘  └──────────────────┘  └─────────────┘
     │
     ├── Nango :3003
     ├── pgvector + graph tables
     │
┌────┴────┐  ┌─────────┐  ┌─────────┐  ┌──────┐
│ Kafka   │  │ Redis   │  │ Neo4j   │  │ ES   │
│ :9092   │  │ :6380   │  │ :7474   │  │ :9200│
└─────────┘  └─────────┘  └─────────┘  └──────┘
     │
     ▼
 event-consumer (host process)
 temporal-worker (host process)
 integration-service (host process)
```

**Network:** Single bridge `cortex`. Host processes connect via `localhost:*` mapped ports.

---

## 11. CI / IaC (skeleton)

- **CI:** `.github/workflows/` — build, typecheck, lint on push
- **Terraform:** `infra/terraform/` — EKS skeleton (not applied)

---

## 12. Key Scripts Reference

| Script           | Command                          | What it does                                   |
| ---------------- | -------------------------------- | ---------------------------------------------- |
| Infra up         | `bun run infra:up`               | `docker compose up -d` all services            |
| DB init          | `bun run db:init`                | Create tables, extensions                      |
| Seed brain       | `bun run seed:brain`             | Vectors + Acme graph + improvement seed        |
| Test brain       | `bun run test:brain`             | CLI smoke test `runBrain`                      |
| Test event       | `bun run test:event`             | Publish to Kafka `raw.events`                  |
| Adapt connectors | `bun run adapt:connectors --all` | Generate 706 connector registry                |
| Services         | `bun run services:dev`           | integration + event-consumer + temporal-worker |
| Dev web          | `bun run dev`                    | Next.js + package watch                        |

---

## 13. Data Flow Summary

### Ask a question (Executive Desk)

```
Browser → POST /api/executive-ask
       → runBrain()
       → hybridRetrieveContext() [pgvector + GraphClient.traverse]
       → llmClient.complete() [LiteLLM → Groq]
       → INSERT qa_logs
       → JSON { answer, sources[] }
```

### Approve client reply (Clients Desk)

```
Browser → POST /api/client-reply
       → draftClientReply() + requestWriteAction()
       → startHandleClientReplyWorkflow() [Temporal]
Browser → POST /api/approvals { approved }
       → signalClientReplyApproval()
       → executeApprovedAction() [Gmail or simulated]
```

### Ingest external event

```
Slack/webhook/script → Kafka raw.events
                    → event-consumer
                    → indexDocument + graph upsert
                    → Kafka entity.extracted
```

---

## 14. What Is NOT Production-Ready Yet

- 706 adapted connectors are catalog entries only (not individually typechecked/runnable)
- Nango OAuth apps need real credentials in Nango dashboard
- Permit.io is a static role map
- Neo4j is optional/unused in hot path
- LangSmith / eval suite not wired
- EKS Terraform skeleton only

---

_This document is for learning/reference. Not committed to the repo._
