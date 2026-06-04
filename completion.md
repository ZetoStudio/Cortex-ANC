# Cortex Platform — Completion Status

**Last updated:** Brain/LLM pass — build green

## Done (~40% overall)

| Area                                                                            | Status |
| ------------------------------------------------------------------------------- | ------ |
| Monorepo (Bun + Turborepo)                                                      | ✅     |
| 5 hand-adapted connectors (Slack, GitHub, Gmail, Linear, Notion)                | ✅     |
| Connector adapter script + catalogue registry (50+ via manifest)                | ✅     |
| Vector RAG (pgvector + memory fallback)                                         | ✅     |
| Knowledge graph (Postgres nodes/edges + optional Neo4j)                         | ✅     |
| Hybrid retrieval (vector + graph traversal)                                     | ✅     |
| Executive Desk + Clients Desk + Galvanite UI                                    | ✅     |
| Clerk auth + Permit.io stub (`@cortex/auth`)                                    | ✅     |
| Full `docker-compose` (Kafka, Redis, ES, Neo4j, Temporal, LiteLLM, Loki, Nango) | ✅     |
| Kafka event pipeline (`raw.events` → ingestion → `entity.extracted`)            | ✅     |
| Nango integration service                                                       | ✅     |
| Cortex Brain (`runBrain`: reasoning → hybrid RAG → response)                    | ✅     |
| LLM client (Groq + LiteLLM + Ollama, retries, agent prompts)                    | ✅     |
| `bun run test:brain` smoke script                                               | ✅     |
| LangGraph-style agent orchestration                                             | ✅     |
| Approvals + write actions (HITL)                                                | ✅     |
| Monitoring agent + remediation stubs                                            | ✅     |
| Admin / connectors / approvals / graph explorer pages                           | ✅     |
| CI workflow + Terraform skeleton                                                | ✅     |
| Pino logging + Sentry (optional DSN)                                            | ✅     |

## Remaining for full production

- Run `bun run adapt:connectors` once (requires `activepieces-main` sibling path)
- Wire real Nango OAuth apps in Nango dashboard
- Temporal worker deployment for durable workflows at scale
- Permit.io live API (currently static role map)
- LangSmith / full eval suite
- EKS Terraform apply (skeleton only)

## Run locally

```bash
cp .env.example .env
docker compose up -d
bun run db:init
bun install && bun run build
bun run dev
```
