# Cortex Brain — LLM Architecture

## Flow

```
User query
    → Reasoning agent (decompose sub-questions)
    → Hybrid retrieval (pgvector + knowledge graph)
    → Action agent (HITL approval for writes)
    → Response agent (cited answer)
```

## LLM routing

| Env                                  | Path                                |
| ------------------------------------ | ----------------------------------- |
| `LITELLM_URL` set                    | All Groq calls → LiteLLM gateway    |
| `LLM_PROVIDER=groq` + `GROQ_API_KEY` | Direct Groq API                     |
| `LLM_PROVIDER=ollama`                | Local Ollama (`LOCAL_LLM_ENDPOINT`) |

Entity extraction & monitoring use `llmClient.completeLocal()` (Ollama, low cost).

## Packages

- `@cortex/shared` — `llmClient`, `BRAIN_PROMPTS`, embeddings
- `@cortex/agent-core` — `runBrain()`, `hybridRetrieveContext()`
- `@cortex/graph-core` — vectors + `GraphClient`

## Seed the brain

```bash
docker compose up -d postgres
bun run db:init
bun run seed:brain
```

## API

- `POST /api/executive-ask` — `{ question }` → brain pipeline
- `POST /api/client-reply` — `{ emailContent }` → draft + approval id
