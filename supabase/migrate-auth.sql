-- Tandem Auth : workspace membership (Clerk user ↔ partner seat)
-- Run in Supabase SQL Editor after migrate-workspaces.sql

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  clerk_user_id text not null,
  partner_id text not null check (partner_id in ('a', 'b')),
  display_name text,
  created_at timestamptz not null default now(),
  constraint workspace_members_user_uidx unique (clerk_user_id),
  constraint workspace_members_seat_uidx unique (workspace_id, partner_id)
);

create index if not exists workspace_members_workspace_idx
  on workspace_members (workspace_id);

alter table workspace_members enable row level security;
drop policy if exists "allow all for anon" on workspace_members;
create policy "allow all for anon" on workspace_members
  for all using (true) with check (true);
grant select, insert, update, delete on workspace_members to anon, authenticated;
