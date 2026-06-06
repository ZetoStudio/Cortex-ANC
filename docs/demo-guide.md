# Demo Guide

## Sign-in (no password form)

The login page uses **role picker buttons** instead of email/password fields. This was intentional for live demos — one click, no credentials on screen.

| Button                | Who you are        | Data you see                                            |
| --------------------- | ------------------ | ------------------------------------------------------- |
| **Sign in as CEO**    | Company leadership | **Acme Corp** + **Global Dynamics** (internal projects) |
| **Sign in as Client** | External customer  | **BetaCorp only** (one client company)                  |
| **Platform admin →**  | Operator           | All projects + admin dashboard + brain debug            |

### Companies in the demo seed data

| Company             | Type                        | Example data                                    |
| ------------------- | --------------------------- | ----------------------------------------------- |
| **Acme Corp**       | Internal launch project     | PROJ-101, API key blocker, Jane/Alex assignees  |
| **Global Dynamics** | Internal enterprise rollout | GD-301 SSO blocker, $450K deal                  |
| **BetaCorp**        | **Single client company**   | BETA-101 dashboard refresh, Maria Santos emails |

The **client** role represents one customer (BetaCorp). CEO sees your company's projects, not client data.

## Demo script (5 minutes)

### 1. Client view

1. Sign in as **Client**
2. Executive Desk → ask: _"What is the status of my project?"_
3. Expect: **BetaCorp dashboard** only (BETA-101, UAT feedback)
4. Clients Desk → Maria's email → Reply with AI → Approve & Send

### 2. CEO view

1. Sign out → Sign in as **CEO**
2. Same question → expect **Acme + Global Dynamics** with graph citations
3. `/admin` → stats dashboard

### 3. Admin (optional)

1. **Platform admin →**
2. `/brain` — debug chat with raw citations
3. `/admin/connections` — connector catalogue

## What needs to be running

Minimum for AI answers:

- Postgres (`docker compose up -d postgres` or full `start:all`)
- `GROQ_API_KEY` in `.env`
- Web on :3000

Full demo (approvals, Kafka, Temporal):

```bash
bun run start:all
```

## Battery-saving mode

For UI-only walkthrough without Docker:

```bash
cd apps/web && bun run dev
```

AI answers will be limited without DB seed + Groq.
