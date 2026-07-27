# August Execution Tracker

Couple execution tracker for clearing tasks together before **Sep 1, 2026**. Both partners are full admins — add, edit, reassign, and monitor in realtime.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres) via `@supabase/supabase-js` — shared table, no login accounts

## Setup

### 1. Supabase schema

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/schema.sql`](./supabase/schema.sql) (fresh install), **or** if you already had the old single-user table, run [`supabase/migrate-couple.sql`](./supabase/migrate-couple.sql).

**RLS:** Both scripts include a permissive `"allow all for anon"` policy. Without it, the app fails silently.

### 2. Env

Copy `.env.local.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart `npm run dev` after changing env. Share the same project URL + anon key with your partner.

### 3. Run

```bash
npm install
npm run dev
```

On first open, each person picks who they are on that device.

## Couple features

- **Both admins** — either person can add, edit status, reassign, push weeks
- **Assigned to** — you / partner / both (shared)
- **Filters** — All · Mine · each person · Shared
- **Dual progress** on the dashboard
- **Live sync** — green “Live” dot means realtime updates across devices
- **Settings** — set both names (synced in Supabase)

## Weeks

| Week | Dates |
|------|--------|
| 1 | Jul 28 – Aug 3 |
| 2 | Aug 4 – Aug 10 |
| 3 | Aug 11 – Aug 17 |
| 4 | Aug 18 – Aug 24 |
| 5 | Aug 25 – Aug 31 |

Deadline: **Sep 1, 2026**.
