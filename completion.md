# Cortex Platform — Completion Status

**Last updated:** Demo-ready (~95%)

## Done

| Area                                                        | Status |
| ----------------------------------------------------------- | ------ |
| Full infra (Kafka, Temporal, LiteLLM, Nango, etc.)          | ✅     |
| 706 connectors + hybrid RAG brain                           | ✅     |
| **Demo auth** (NextAuth credentials, 3 roles)               | ✅     |
| **RBAC** (project-scoped retrieval)                         | ✅     |
| **New UI** (minimal B&W + teal accents, skeuomorphic cards) | ✅     |
| Landing page + login + role-aware desks                     | ✅     |
| Admin dashboard (stats + recharts timeline)                 | ✅     |
| Brain debug chat with Groq/Ollama toggle                    | ✅     |
| Temporal approvals + monitoring stub                        | ✅     |

## Demo credentials

| Email             | Password | Role   | Sees                           |
| ----------------- | -------- | ------ | ------------------------------ |
| admin@cortex.anc  | password | admin  | All projects + admin + brain   |
| ceo@cortex.anc    | password | ceo    | Acme + Global Dynamics + admin |
| client@cortex.anc | password | client | BetaCorp only                  |

## Demo bootstrap

```bash
bun run demo          # infra + db + seed + build
bun run services:dev  # background services
bun run dev           # http://localhost:3000
```

## Demo script flows

1. **Client** → Executive Desk → _"What is the status of my project?"_ → BetaCorp only
2. **CEO** → same question → Acme + Global Dynamics
3. **Admin** → `/admin` dashboard + `/brain` with Ollama toggle

```bash
bun run test:ollama   # probe Groq + Ollama via /api/brain/health
```

## Remaining for production

- Real OAuth (Nango apps)
- 706 connector typecheck/fixes
- Permit.io live API
- EKS deploy
