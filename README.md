# Tandem

Couples co-execution tracker: shared tasks, calendar, lists, and a weekly rhythm.

Each partner signs in with their own account (Clerk), then creates or joins one shared space with a Supabase invite code. Both seats edit the same board.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Clerk** for authentication
- **Supabase** for Postgres + Realtime
- **Groq** for optional AI helpers (propose only; you confirm)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run in order:
   - `supabase/schema.sql`
   - `supabase/migrate-workspaces.sql`
   - `supabase/migrate-slice2.sql` through `migrate-slice6.sql`
   - `supabase/migrate-auth.sql`

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GROQ_API_KEY=
```

Restart the dev server after changing env.

### 3. Run

```bash
npm install
npm run dev
```

Open the app → **Sign up** → **Create a space** (or **Join with a code**).

## Product

| Area | What it does |
|------|----------------|
| **Auth** | Clerk accounts; sticky partner seats (a / b) |
| **Spaces** | Invite code joins one couple board |
| **Add** | Natural-language capture + optional Ask AI |
| **Home** | Today, digests, Mine / Yours / Together, pings |
| **Tasks** | Board with snooze, pin, block, comments, undo |
| **Calendar** | Shared plans and recurring events |
| **Lists** | Shared checklists (e.g. groceries) |
| **Review** | Weekly co-pilot with soft focus suggestions |
| **AI** | Capture, digest, fairness tip, unblock coach. Always confirm before save. |

## Notes

- AI never edits without confirmation.
- New spaces start empty (no demo seed data).
- Keep `CLERK_SECRET_KEY`, `GROQ_API_KEY`, and service-role keys server-only (never `NEXT_PUBLIC_`).
