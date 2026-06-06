# Cortex Brain — LLM Architecture

## Flow

```
User query
    → Reasoning agent (decompose sub-questions)
    → Hybrid retrieval (pgvector + knowledge graph, RBAC-filtered)
    → Action agent (HITL approval for writes)
    → Response agent (cited answer)
```

## LLM routing (demo: Groq only)

| Path            | When                                             |
| --------------- | ------------------------------------------------ |
| LiteLLM → Groq  | Default when `LITELLM_URL=http://localhost:4000` |
| Direct Groq API | Fallback if LiteLLM down                         |
| Ollama          | **Disabled** for demo (commented in config)      |

Embeddings use deterministic hash fallback (no Ollama `nomic-embed-text` in demo mode).

## RBAC in retrieval

API routes pass `projectIds` from the signed-in user:

- **CEO:** `acme`, `global-dynamics`
- **Client:** `betacorp` only
- **Admin:** all projects

## Packages

- `@cortex/shared` — `llmClient`, embeddings, Kafka, Temporal client
- `@cortex/agent-core` — `runBrain()`, `hybridRetrieveContext()`
- `@cortex/graph-core` — pgvector + `GraphClient`

## Seed the brain

```bash
docker compose up -d postgres
bun run db:init
bun run seed:brain
```

## API

| Route                     | Body               | Auth                    |
| ------------------------- | ------------------ | ----------------------- |
| `POST /api/executive-ask` | `{ question }`     | desk:write              |
| `POST /api/client-reply`  | `{ emailContent }` | desk:write              |
| `POST /api/brain/chat`    | `{ prompt }`       | brain:debug (admin/ceo) |
| `GET /api/brain/health`   | —                  | public                  |

See [Architecture](./architecture.md) for full data flows.
