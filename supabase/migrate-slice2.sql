-- Slice 2 : together features + calendar power
-- Run after migrate-workspaces.sql

-- Partner pings (in-app @partner help)
create table if not exists partner_pings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  from_partner text not null check (from_partner in ('a', 'b')),
  to_partner text not null check (to_partner in ('a', 'b')),
  message text not null default 'Needs a hand',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists partner_pings_workspace_idx on partner_pings (workspace_id);
create index if not exists partner_pings_to_idx on partner_pings (workspace_id, to_partner, read_at);

alter table partner_pings enable row level security;
drop policy if exists "allow all for anon" on partner_pings;
create policy "allow all for anon" on partner_pings
  for all using (true) with check (true);
grant select, insert, update, delete on partner_pings to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table partner_pings;
exception when duplicate_object then null;
end $$;

-- Recurrence on events (simple RRULE-ish: daily|weekly|none)
alter table events add column if not exists recur text
  check (recur is null or recur in ('daily', 'weekly'));
alter table events add column if not exists recur_until date;

-- Fairness opt-in on workspace
alter table workspaces add column if not exists show_fairness boolean not null default false;

notify pgrst, 'reload schema';
