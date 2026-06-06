# Executive guide

For **CEO, leadership, and internal operators** — how Cortex is intended to be used day to day.

## Your login

Sign in at http://localhost:3000/auth/login

| Field    | Value            |
| -------- | ---------------- |
| Email    | `ceo@cortex.anc` |
| Password | `password`       |

(Admin operators use `admin@cortex.anc` with the same password for full cross-company access.)

Credentials are not shown on the login page — they're documented in the [README](../README.md#demo-accounts).

## What you see

As CEO, Cortex scopes you to **internal projects only**:

- **Acme Corp** — mobile launch (blocked on API keys)
- **Global Dynamics** — enterprise rollout (blocked on SSO)

You do **not** see BetaCorp client data. That's intentional — client work lives in the client role's view.

## Executive Desk — your home screen

Go to **Executive Desk** after login. This is where leadership gets answers.

### How to use it

1. Type a question in plain English
2. Cortex searches Linear, Slack, GitHub, Gmail, Notion — everything ingested for your projects
3. Read the answer with **citations** — click through to the source

### Questions that work well

| Ask this                                   | You'll learn                                   |
| ------------------------------------------ | ---------------------------------------------- |
| _What is blocking the Acme launch?_        | Stripe API keys, PROJ-101, Jane/Alex ownership |
| _What's the status of Global Dynamics?_    | GD-301 SSO blocker, $450K deal, timeline risk  |
| _Who owns the Acme pilot?_                 | Jane (Platform), linked tickets and PRs        |
| _What are our biggest risks this quarter?_ | Cross-project blockers with revenue impact     |

The Brain connects dots across tools. You don't need to know which Slack thread or Linear ticket holds the answer.

## Clients Desk

Leadership can open **Clients Desk** to see client-facing email threads within their scope. In the CEO view, internal threads dominate; BetaCorp threads are reserved for the client login.

Use this when reviewing how client communication is handled — or when demoing the approval workflow alongside a client user.

## Admin dashboard

Navigate to **Admin** (`/admin`) for the platform overview:

- **Stats** — ingestion volume, brain usage, connector health
- **Connections** — browse the 700+ connector catalogue
- **Logs** — recent event activity
- **Improvements** — AI-suggested optimizations from monitoring

CEO and admin both have access. Use it to show stakeholders that Cortex is a living system, not just a chat box.

## Brain Chat (debug)

`/brain` is the raw debug interface — same Brain, fewer UI constraints. Useful for operators validating retrieval quality during a demo.

## 5-minute leadership demo

1. Sign in as **CEO**
2. Open **Executive Desk**
3. Ask: _"What is blocking the Acme launch?"_
4. Point out citations from Linear, Slack, GitHub
5. Ask: _"What's happening with Global Dynamics?"_
6. Show **Admin** → stats and connector catalogue
7. Optional: sign out, sign in as **Client** to contrast — same question, BetaCorp-only answer

That contrast is the product story: **one Brain, role-scoped truth**.

## How leadership should use Cortex

| Use case                    | Desk                                                       |
| --------------------------- | ---------------------------------------------------------- |
| Monday standup prep         | Executive Desk — _"What's blocked across our projects?"_   |
| Board / investor update     | Executive Desk — _"Summarize Q2 risks and revenue impact"_ |
| Cross-tool investigation    | Executive Desk — no tab switching                          |
| Review client comms quality | Clients Desk                                               |
| Platform health check       | Admin                                                      |

Cortex replaces the morning ritual of checking five tools. One question, cited answer, move on.

## Next

- [How Cortex works](./architecture.md) — data model and boundaries
- [Client guide](./client-guide.md) — what your BetaCorp customer sees (useful before a joint demo)
