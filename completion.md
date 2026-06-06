# Cortex Platform — Completion Status

**Last updated:** Demo — Groq only, Kafka UI fixed

## Done

| Area                                                    | Status |
| ------------------------------------------------------- | ------ |
| Full infra (Kafka, Temporal, LiteLLM, Nango, etc.)      | ✅     |
| **Groq-only LLM** (Ollama disabled/commented out)       | ✅     |
| Kafka UI fixed (dual listeners: `kafka:29092` internal) | ✅     |
| Demo auth + RBAC + new UI                               | ✅     |

## Start everything

```bash
bun run demo           # first time: infra + db + seed + build
bun run start:all      # Docker + services + web (Groq only, no Ollama)
```

Stop: `bun run start:all:stop`

## URLs

| Service     | URL                              |
| ----------- | -------------------------------- |
| Web         | http://localhost:3000            |
| Login       | http://localhost:3000/auth/login |
| LiteLLM     | http://localhost:4000            |
| Kafka UI    | http://localhost:9080            |
| Temporal UI | http://localhost:8088            |

**Requires:** `GROQ_API_KEY` in `.env`

## Demo credentials

| Email             | Password | Sees                   |
| ----------------- | -------- | ---------------------- |
| admin@cortex.anc  | password | All projects           |
| ceo@cortex.anc    | password | Acme + Global Dynamics |
| client@cortex.anc | password | BetaCorp only          |

## Demo flows

1. Client → _"What is the status of my project?"_ → BetaCorp only
2. CEO → same → Acme + Global Dynamics
3. Admin → `/admin` + `/brain` (Groq debug chat)
