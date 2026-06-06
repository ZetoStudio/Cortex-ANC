# Cortex Platform — Completion Status

**Last updated:** Demo running (~95%)

## Done

| Area                                                | Status |
| --------------------------------------------------- | ------ |
| Full infra (Kafka, Temporal, LiteLLM, Nango, etc.)  | ✅     |
| **Ollama** in background via `start:all`            | ✅     |
| 706 connectors + hybrid RAG brain                   | ✅     |
| Demo auth (NextAuth, 3 roles) + RBAC                | ✅     |
| New UI (minimal B&W + teal accents)                 | ✅     |
| Landing, login, role-aware desks, admin, brain chat | ✅     |
| Temporal approvals + monitoring stub                | ✅     |

## Start everything (demo morning)

```bash
bun run demo           # first time only: infra + db + seed + build
bun run start:all      # Ollama + Docker + services + web (background)
```

Stop: `bun run start:all:stop`

## Running now

| Service     | URL                              |
| ----------- | -------------------------------- |
| Web         | http://localhost:3000            |
| Login       | http://localhost:3000/auth/login |
| Ollama      | http://localhost:11434           |
| LiteLLM     | http://localhost:4000            |
| Temporal UI | http://localhost:8088            |
| Kafka UI    | http://localhost:9080            |

Logs: `.cortex-logs/` · PIDs: `.cortex-pids/`

## Demo credentials

| Email             | Password | Role   | Sees                   |
| ----------------- | -------- | ------ | ---------------------- |
| admin@cortex.anc  | password | admin  | All + admin + brain    |
| ceo@cortex.anc    | password | ceo    | Acme + Global Dynamics |
| client@cortex.anc | password | client | BetaCorp only          |

## Demo script

1. **Client** → Executive Desk → _"What is the status of my project?"_
2. **CEO** → same → Acme + Global Dynamics
3. **Admin** → `/admin` + `/brain` (Ollama toggle)

```bash
bun run test:ollama   # verify Groq + Ollama fallback
```

## Remaining for production

- Real OAuth (Nango apps)
- 706 connector typecheck/fixes
- Permit.io live API
- EKS deploy
