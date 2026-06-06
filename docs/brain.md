# The Brain

Cortex is one shared intelligence layer for your company. Instead of searching Slack, Linear, Gmail, and Notion separately, you ask Cortex — and it answers from everything it already knows, with citations.

## What the Brain does

When you ask a question, Cortex:

1. **Understands** what you're asking (and breaks complex questions into parts if needed)
2. **Retrieves** relevant facts from your connected sources — tickets, emails, messages, docs
3. **Reasons** across relationships — who owns what, what's blocked, what's at risk
4. **Responds** in plain language, with links back to the original sources

You never get a black-box answer. Every response shows where the information came from.

## Desks — where you work

Cortex is organized into **desks**. Each desk is a focused workspace for a job:

| Desk               | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| **Executive Desk** | Ask anything about your projects — status, blockers, timelines, people |
| **Clients Desk**   | Read client emails, draft replies with AI, approve before sending      |
| **Admin**          | Platform overview — stats, connected tools, activity logs              |
| **Brain Chat**     | Deep debug view for operators (leadership and admin only)              |

Most people live in **Executive Desk**. Client-facing teams use **Clients Desk** when handling inbound email.

## Role-based answers

The same question gets different answers depending on who asks.

- A **client** sees only their company's data
- **Leadership** sees internal projects across the organization
- **Platform admin** sees everything

Cortex enforces this automatically. You don't switch filters — your login defines your scope.

## Demo companies

The demo is seeded with three companies:

| Company             | Type             | Story                                         |
| ------------------- | ---------------- | --------------------------------------------- |
| **Acme Corp**       | Internal project | Mobile launch blocked on Stripe API keys      |
| **Global Dynamics** | Internal project | Enterprise rollout blocked on SSO integration |
| **BetaCorp**        | External client  | Dashboard refresh on track, in UAT            |

→ [How Cortex works](./architecture.md) explains how data flows between them.

→ [Executive guide](./executive-guide.md) — if you're leadership.

→ [Client guide](./client-guide.md) — if you're a BetaCorp user signing in for the first time.
