# Project Status

**Last updated:** June 2026 · **Overall: ~95% demo-ready**

## Summary

Cortex is a working demo platform: hybrid RAG brain, role-based desks, 700+ connector catalogue, Kafka/Temporal/LiteLLM infra, and minimal B&W UI. Suitable for team demos. Not production-hardened.

## Completed

| Area                       | Status | Notes                                                         |
| -------------------------- | ------ | ------------------------------------------------------------- |
| Monorepo (Bun + Turborepo) | ✅     | 12 packages build green                                       |
| Web UI                     | ✅     | Landing, login, Executive/Clients/Admin/Brain desks           |
| Demo auth + RBAC           | ✅     | One-click CEO / Client / Admin; project-scoped retrieval      |
| Hybrid RAG brain           | ✅     | Vectors + graph depth-2, Groq via LiteLLM                     |
| Knowledge graph seed       | ✅     | Acme, Global Dynamics, BetaCorp subgraphs                     |
| Connectors                 | ✅     | 706 catalogue + 5 core (Slack, Gmail, GitHub, Linear, Notion) |
| Docker infra               | ✅     | Kafka, Postgres, Temporal, LiteLLM, Nango, ES, Neo4j, Redis   |
| Event pipeline             | ✅     | `raw.events` → graph + vectors → `entity.extracted`           |
| Temporal approvals         | ✅     | HandleClientReply workflow + Clients Desk loop                |
| Admin dashboard            | ✅     | Stats, connections, logs, improvements                        |
| Monitoring stub            | ✅     | QA sweep → improvement_suggestions                            |

## Not production-ready

| Gap                                                          | Priority           |
| ------------------------------------------------------------ | ------------------ |
| 706 adapted connectors not individually runnable/typechecked | Low for demo       |
| Real Nango OAuth apps                                        | Medium             |
| Production auth (SSO, not demo buttons)                      | High for prod      |
| EKS Terraform skeleton only                                  | Post-demo          |
| Permit.io live API                                           | Post-demo          |
| Ollama/local LLM disabled (Groq only)                        | By design for demo |

## Demo acceptance checklist

- [x] Login as CEO / Client with different data scope
- [x] Executive Desk cites graph + vector sources
- [x] Clients Desk approval flow
- [x] Admin stats page
- [x] `bun run test:brain` passes with Groq key
- [x] Kafka UI connects (dual listener fix)
- [ ] End-to-end Temporal + Gmail send with real token (simulated OK)

## When you're ready to run again

```bash
bun run start:all
# or lightweight:
docker compose up -d postgres
cd apps/web && bun run dev
```

## Recent changes

- Groq-only LLM (Ollama removed from demo path)
- Login: role buttons instead of credential form
- Kafka UI broker fix (`kafka:29092` internal listener)
- Docs consolidated under `docs/`
