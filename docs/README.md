# Cortex Platform Documentation

Documentation for the Cortex monorepo — AI-native company brain with hybrid RAG, connectors, and role-based desks.

## Contents

| Document                                | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| [Getting started](./getting-started.md) | Install, env, first run                      |
| [Demo guide](./demo-guide.md)           | Role-based demo flows (CEO / Client / Admin) |
| [Project status](./status.md)           | What's done, what's left (~95% demo-ready)   |
| [Architecture](./architecture.md)       | Full tech-stack map (layers, data flows)     |
| [Brain pipeline](./BRAIN.md)            | LLM routing, RAG, API endpoints              |

## Quick start

```bash
cp .env.example .env          # add GROQ_API_KEY
bun install
bun run demo                  # first time only
bun run start:all             # Docker + services + web
```

Open http://localhost:3000/auth/login → **Sign in as CEO** or **Sign in as Client**.

## Stop everything (save laptop battery)

```bash
bun run start:all:stop
docker compose down
```

## Repo layout

```text
apps/web/           Next.js desks + API
packages/           agent-core, graph-core, integration-core, ui, auth, shared
services/           event-consumer, temporal-worker, integration-service, …
docs/               This folder
scripts/            demo.sh, start-all.sh, seed-graph.ts
infra/              LiteLLM config, Terraform skeleton
```
