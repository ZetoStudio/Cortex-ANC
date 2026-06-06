# Client guide

For **external customers** using Cortex — if you're BetaCorp, start here.

## Welcome

You're signing in as a client of the company that runs Cortex. You see **your projects only** — not their internal work, not other clients.

In the demo, you are **Maria's team at BetaCorp**.

## Sign in

1. Open http://localhost:3000/auth/login
2. Enter your credentials:

| Field    | Value               |
| -------- | ------------------- |
| Email    | `client@cortex.anc` |
| Password | `password`          |

3. Click **Sign in**

You'll land on **Executive Desk** — your project intelligence home.

## Your company: BetaCorp

Cortex knows about one active project for you:

|                  |                            |
| ---------------- | -------------------------- |
| **Project**      | BetaCorp Dashboard Refresh |
| **Ticket**       | BETA-101                   |
| **Status**       | In UAT — on track          |
| **Due date**     | June 18, 2026              |
| **Your contact** | Maria Santos               |

You won't see Acme Corp or Global Dynamics. Those are your vendor's internal projects — not yours.

## Executive Desk — ask about your project

This is where you get answers without emailing your account manager and waiting.

### Try these questions

| Ask                                 | You'll get                                   |
| ----------------------------------- | -------------------------------------------- |
| _What is the status of my project?_ | BETA-101 progress, UAT status, delivery date |
| _Are there any open issues?_        | CSV export bug Maria reported, fix ETA       |
| _When is the dashboard due?_        | June 18 target, current on-track status      |

Every answer includes **sources** — the email, ticket, or message Cortex pulled from. You can verify anything.

### What you can't do here

- See other companies' projects
- Access Admin or platform settings
- Open Brain debug (operator tool — not for clients)

If you need something outside your project scope, contact your account team directly.

## Clients Desk — your email inbox

Go to **Clients Desk** to handle communication with your vendor.

### Typical flow

1. **Read** — see inbound emails (e.g. Maria's status inquiry before a board meeting)
2. **Reply with AI** — Cortex drafts a response using your project context
3. **Review** — edit the draft if needed
4. **Approve & Send** — nothing sends until you confirm

You're always in control. AI suggests; you decide.

## Your first session (2 minutes)

1. Sign in with `client@cortex.anc`
2. **Executive Desk** → ask: _"What is the status of my project?"_
3. Read the answer — note it only mentions BetaCorp
4. **Clients Desk** → open Maria's email → **Reply with AI** → review → **Approve & Send**

That's the full client experience.

## Privacy & scope

Cortex enforces boundaries automatically:

- Your login is tied to **BetaCorp** (`betacorp` project)
- Search, chat, and email drafts only use BetaCorp data
- No configuration needed — it's built in

## Need help?

- Product overview → [The Brain](./brain.md)
- How the system works → [How Cortex works](./architecture.md)
- Demo credentials for other roles → [README](../README.md#demo-accounts)
