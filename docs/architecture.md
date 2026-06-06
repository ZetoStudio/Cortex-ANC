# How Cortex works

This is the product architecture — how Cortex is meant to behave, not how the code is organized.

## The hub-and-spoke model

```
                    ┌─────────────┐
                    │   Cortex    │
                    │    Brain    │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌──────────┐    ┌─────────┐
      │  Slack  │    │  Linear  │    │  Gmail  │
      └─────────┘    └──────────┘    └─────────┘
           │               │               │
           ▼               ▼               ▼
      ┌─────────┐    ┌──────────┐    ┌─────────┐
      │ GitHub  │    │  Notion  │    │ 700+ more│
      └─────────┘    └──────────┘    └─────────┘
```

**Spokes** are your tools — Slack channels, Linear tickets, GitHub PRs, client emails.

**The hub** is Cortex. It ingests events from spokes, builds a knowledge graph, and indexes searchable memory. When someone asks a question, the Brain pulls from both:

- **Vector memory** — semantic search over documents and messages ("find things about API keys")
- **Knowledge graph** — structured relationships ("Acme launch → blocked by → missing API keys → owned by → Jane")

Together this is **hybrid RAG**: retrieval plus reasoning, always scoped to what you're allowed to see.

## Data boundaries by role

Every piece of data belongs to a **project**. Your role determines which projects you can access.

| Role       | Projects visible       | Intended user                              |
| ---------- | ---------------------- | ------------------------------------------ |
| **Client** | BetaCorp only          | External customer (e.g. Maria at BetaCorp) |
| **CEO**    | Acme + Global Dynamics | Company leadership — internal work only    |
| **Admin**  | All three              | Platform operator                          |

A client asking _"What's the status of my project?"_ gets BetaCorp's BETA-101 dashboard refresh.

A CEO asking the same question gets Acme and Global Dynamics — never client deliverables they shouldn't manage day-to-day.

## What lives in the graph

For each project, Cortex tracks:

- **Projects & milestones** — status, due dates, blockers
- **Tickets & PRs** — linked to people and repos
- **People** — owners, assignees, stakeholders
- **Risks & deals** — revenue impact, severity
- **Sources** — which Slack channel or tool mentioned it

### Demo seed snapshot

**Acme Corp** — Mobile launch, blocked on Stripe API keys. Tickets PROJ-101/102/103. Jane (Platform), Alex (Backend), Sam (PM). PRs on `acme/mobile-app`.

**Global Dynamics** — Enterprise rollout, blocked on SSO IdP credentials. Ticket GD-301. $450K deal at risk.

**BetaCorp** — Dashboard refresh, on track for June 18. Ticket BETA-101 in UAT. Maria Santos is the client contact.

## Client reply flow

When a client email arrives, Cortex doesn't send automatically:

1. Email appears in **Clients Desk**
2. You click **Reply with AI** — Cortex drafts a response using project context
3. You review and edit
4. You **Approve & Send** — human-in-the-loop before anything goes out

This keeps client communication accurate and on-brand.

## Connectors

Cortex ships with a catalogue of 700+ integrations (Slack, Gmail, GitHub, Linear, Notion, and more). In the demo, five core connectors are hand-built; the rest are catalogued for exploration in Admin.

Live OAuth connections (via Nango) are a production step — the demo runs on seeded data.

## Where to go next

- **Leadership** → [Executive guide](./executive-guide.md)
- **Client user** → [Client guide](./client-guide.md)
- **Back to overview** → [The Brain](./brain.md)
