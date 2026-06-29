# Demo seed reference

Everything the Brain knows in the demo comes from **seed scripts**, not live connector sync. Use this doc before asking questions in Executive Desk or Brain Chat — if it's not listed here, the demo Brain won't know it.

## How seeding works

```
bun run demo          # first-time bootstrap (includes seed)
bun run seed:brain    # re-seed vectors + graph only
```

**Prerequisites:** Postgres running (`docker compose up -d postgres`), then `bun run db:init` on first setup.

### What runs

| Step         | Script                  | What it does                                                        |
| ------------ | ----------------------- | ------------------------------------------------------------------- |
| DB schema    | `scripts/init-db.sh`    | Creates Postgres tables (vectors, graph nodes/edges, qa_logs, etc.) |
| Brain seed   | `scripts/seed-graph.ts` | Indexes 18 mock documents + builds knowledge graph                  |
| Vectors only | `scripts/seed-data.ts`  | Same 18 documents, no graph (legacy / partial re-seed)              |

**Use `seed:brain`** — it does both vector store and knowledge graph.

### Two layers of memory

1. **Vector store** (`MOCK_DOCUMENTS` in `packages/graph-core/src/mock-data.ts`)  
   Text snippets from Linear, Slack, GitHub, Gmail, Notion. Semantic search finds these when you ask questions.

2. **Knowledge graph** (`scripts/seed-graph.ts`)  
   Structured nodes (projects, tickets, people, PRs, deals, risks) and edges (blocked_by, assigned_to, has_ticket). Graph traversal adds relationship context.

Every document gets a **`project_id`** for RBAC:

| `project_id`      | Assigned when metadata says…                          |
| ----------------- | ----------------------------------------------------- |
| `acme`            | Acme, Feature X, Platform, Company (default fallback) |
| `global-dynamics` | Global Dynamics                                       |
| `betacorp`        | BetaCorp                                              |

### Role → what you can retrieve

| Role   | Email               | `project_id` access       |
| ------ | ------------------- | ------------------------- |
| CEO    | `ceo@cortex.anc`    | `acme`, `global-dynamics` |
| Client | `client@cortex.anc` | `betacorp` only           |
| Admin  | `admin@cortex.anc`  | all three                 |

---

## Company 1: Acme Corp

**Project ID:** `acme`  
**Type:** Internal — your company's mobile launch  
**Status:** Blocked  
**Blocker:** Missing Stripe production API keys  
**Graph node:** `project:acme` — "Acme Mobile Launch"

### Story in one line

Acme mobile app is feature-complete except billing; launch is blocked until Stripe live keys are provisioned. $120K ARR at risk if pilot slips past June 20.

### People

| ID            | Name | Role          |
| ------------- | ---- | ------------- |
| `person:jane` | Jane | Platform Lead |
| `person:alex` | Alex | Backend       |
| `person:sam`  | Sam  | PM            |

### Tickets (graph)

| ID                | Label                             | Status      | Assignee |
| ----------------- | --------------------------------- | ----------- | -------- |
| `ticket:proj-101` | PROJ-101 Payment key provisioning | blocked     | Jane     |
| `ticket:proj-102` | PROJ-102 Billing UI QA            | in_progress | Alex     |
| `ticket:proj-103` | PROJ-103 Pilot rollout checklist  | todo        | Sam      |

### Pull requests

| ID           | Label                           | Status | Repo            |
| ------------ | ------------------------------- | ------ | --------------- |
| `pr:acme-88` | PR #88 checkout + webhooks      | merged | acme/mobile-app |
| `pr:acme-91` | PR #91 billing retries          | open   | acme/mobile-app |
| `pr:acme-95` | PR #95 onboarding email updates | open   | acme/mobile-app |

### Deals

| ID                     | Label                      | ARR      | Stage         |
| ---------------------- | -------------------------- | -------- | ------------- |
| `deal:acme-enterprise` | Acme Enterprise Deal       | $120,000 | pilot         |
| `deal:acme-expansion`  | Acme Expansion Opportunity | $90,000  | qualification |

### Other graph nodes

- **Milestone:** `milestone:acme-pilot` — Acme Pilot Launch, due 2026-06-20, at_risk
- **Meeting:** `meeting:acme-weekly-1` — June 3 sync, "Launch blocked by API keys"
- **Risk:** `risk:api-keys` — Missing production API keys, high severity, 3-day ETA once keys arrive
- **Source:** Slack `#acme-launch` linked via `mentioned_in`

### Vector documents (CEO-visible)

| Doc ID                      | Source | Title / content summary                                     |
| --------------------------- | ------ | ----------------------------------------------------------- |
| `linear-acme-142`           | Linear | ACME-142 — launch blocked by API keys, 3-day eng estimate   |
| `slack-acme-standup`        | Slack  | #acme-launch standup — demo June 12, waiting on Stripe keys |
| `github-acme-pr-88`         | GitHub | PR #88 checkout + webhooks, blocked on STRIPE env vars      |
| `gmail-client-acme-inquiry` | Gmail  | Sarah Chen asks for pilot launch date for board meeting     |
| `notion-acme-runbook`       | Notion | Launch checklist — stuck on step 1 (Stripe keys in vault)   |
| `github-acme-release-2.1`   | GitHub | Release v2.1.0-rc1 — billing known limitation               |
| `linear-feature-x-201`      | Linear | FEAT-201 Feature X — mapped to `acme`                       |
| `slack-feature-x-update`    | Slack  | Feature X beta moved to June 15                             |
| `github-feature-x-issue-44` | GitHub | Staging seed failure blocks Feature X QA                    |
| `gmail-client-feature-x`    | Gmail  | BetaCo James Park asks about Feature X timeline             |
| `linear-infra-55`           | Linear | INFRA-55 token rotation — completed                         |
| `slack-executive-summary`   | Slack  | Q2 leadership — $120K ARR at risk, Feature X pilots waiting |

### Clients Desk email (CEO sees this)

| From                              | Subject                              | projectId |
| --------------------------------- | ------------------------------------ | --------- |
| Sarah Chen \<sarah@acmecorp.com\> | Acme mobile launch — pilot timeline? | `acme`    |

### Good questions to ask (CEO login)

- _What is blocking the Acme launch?_
- _Who owns PROJ-101?_
- _What's the revenue at risk if Acme slips?_
- _What's the status of PR #88?_

---

## Company 2: Global Dynamics

**Project ID:** `global-dynamics`  
**Type:** Internal — enterprise client rollout  
**Status:** Blocked  
**Blocker:** SSO IdP credentials from client  
**Graph node:** `project:global-dynamics` — "Global Dynamics Rollout"

### Story in one line

Phase 1 done. Phase 2 SSO integration blocked waiting on client IdP metadata. $450K ARR deal; go-live may slip to Q3.

### Tickets (graph)

| ID              | Label                  | Status  |
| --------------- | ---------------------- | ------- |
| `ticket:gd-301` | GD-301 SSO integration | blocked |

### Vector documents (CEO-visible)

| Doc ID            | Source | Title / content summary                                    |
| ----------------- | ------ | ---------------------------------------------------------- |
| `linear-gd-301`   | Linear | Phase 2 blocked on SSO, Security team owner, ETA July 1    |
| `slack-gd-update` | Slack  | #global-dynamics — $450K ARR, weekly status calls, Q3 risk |
| `github-gd-pr-12` | GitHub | PR #12 SAML SSO handler, waiting on client metadata XML    |

### Clients Desk email (CEO sees this)

| From                             | Subject                  | projectId         |
| -------------------------------- | ------------------------ | ----------------- |
| VP Ops \<vp@globaldynamics.com\> | SSO integration timeline | `global-dynamics` |

### Good questions to ask (CEO login)

- _What's blocking Global Dynamics?_
- _What's the deal value for Global Dynamics?_
- _When is SSO go-live expected?_

---

## Company 3: BetaCorp

**Project ID:** `betacorp`  
**Type:** External client company (the **client** login operates here)  
**Status:** On track  
**Due:** June 18, 2026  
**Graph node:** `project:betacorp` — "BetaCorp Dashboard Refresh"

### Story in one line

Dashboard v2 UI complete, in UAT. Maria Santos reported CSV export bug (fix ETA June 10). On track for June 18 delivery.

### People

| ID             | Name         | Org      |
| -------------- | ------------ | -------- |
| `person:maria` | Maria Santos | BetaCorp |

### Tickets (graph)

| ID                | Label                      | Status |
| ----------------- | -------------------------- | ------ |
| `ticket:beta-101` | BETA-101 Dashboard refresh | in_uat |

### Vector documents (Client-visible)

| Doc ID              | Source | Title / content summary                                     |
| ------------------- | ------ | ----------------------------------------------------------- |
| `linear-beta-101`   | Linear | BETA-101 UI complete, awaiting UAT, June 18 delivery        |
| `slack-beta-status` | Slack  | Maria UAT feedback — CSV export truncates rows, fix June 10 |
| `gmail-beta-client` | Gmail  | Maria asks status before board meeting Friday               |

### Clients Desk email (Client sees this)

| From                                | Subject                   | projectId  |
| ----------------------------------- | ------------------------- | ---------- |
| Maria Santos \<maria@betacorp.com\> | Dashboard project status? | `betacorp` |

### Good questions to ask (Client login)

- _What is the status of my project?_
- _Are there any open bugs?_
- _When is the dashboard due?_

---

## Other seeded data

### Improvement suggestion (Admin → Improvements)

| ID                   | Category  | Suggestion                                                                          |
| -------------------- | --------- | ----------------------------------------------------------------------------------- |
| `seed-improvement-1` | retrieval | Increase graph traversal depth for Acme risk questions; refresh Slack sync every 4h |

---

## Connectors vs seed data

**Important:** Seed data is **static mock content**. It does **not** flow from live Slack, Gmail, or Linear APIs during the demo.

### What's in the catalogue

| Tier                  | Count | Status    | Actually runnable?                                  |
| --------------------- | ----- | --------- | --------------------------------------------------- |
| **Core connectors**   | 5     | `ready`   | Yes — hand-built, wired in code                     |
| **Adapted catalogue** | 706   | `adapted` | No — registry entries only, not individually tested |

**Core five:** Slack, GitHub, Gmail, Linear, Notion  
Location: `packages/integration-core/src/connectors/`  
Loaded via `getConnector()` in `packages/integration-core/src/index.ts`

**706 adapted:** Auto-generated from Activepieces pieces via `bun run adapt:connectors --all`. Listed in `registry.generated.ts` for Admin UI catalogue. **Not** loaded at runtime. Excluded from typecheck.

### What populates the Brain today

| Source                   | Populated? | How                                    |
| ------------------------ | ---------- | -------------------------------------- |
| Mock documents           | ✅         | `seed:brain`                           |
| Knowledge graph          | ✅         | `seed:brain`                           |
| Clients Desk emails      | ✅         | Hardcoded in `clients-desk-client.tsx` |
| Live Slack sync          | ❌         | Needs Nango OAuth + event pipeline     |
| Live Gmail sync          | ❌         | Needs Nango OAuth + tokens             |
| Adapted connectors (706) | ❌         | Catalogue browse only                  |

### How to check if core connectors work

Core connectors need **Nango** (OAuth broker) configured:

```bash
# .env
NANGO_SECRET_KEY=...
NANGO_SERVER_URL=http://localhost:3003
```

1. **Start full stack:** `bun run start:all`
2. **Admin UI:** http://localhost:3000/admin/connections  
   Shows catalogue + live status from integration service
3. **API directly:**
   ```bash
   curl http://localhost:3010/api/connectors/status
   ```
   Returns health for the 5 core providers (requires Nango reachable)

Without `NANGO_SECRET_KEY`, status returns `healthy: false` with reason `NANGO_SECRET_KEY missing`. **The demo still works** — Brain answers from seed data, not live connectors.

### How to verify the Brain (not connectors)

```bash
bun run test:brain    # CLI smoke test against seeded Postgres + Groq
```

Requires: Postgres up, `GROQ_API_KEY` set, `seed:brain` already run.

---

## Re-seed

```bash
docker compose up -d postgres
bun run db:init        # only if fresh DB
bun run seed:brain
```

---

## Source files (for developers)

| File                                                | Contents                            |
| --------------------------------------------------- | ----------------------------------- |
| `packages/graph-core/src/mock-data.ts`              | 18 vector documents                 |
| `scripts/seed-graph.ts`                             | Graph nodes/edges + vector indexing |
| `apps/web/app/clients-desk/clients-desk-client.tsx` | 3 mock client emails                |
| `packages/auth/src/demo-users.ts`                   | Role → project_id mapping           |
