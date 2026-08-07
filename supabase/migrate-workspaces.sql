-- Tandem Slice 1 : Workspaces + invite codes
-- Run entire script in Supabase SQL Editor, then hard-refresh the app.
-- Safe-ish to re-run.

-- 1) Workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Tandem',
  invite_code text not null,
  partner_a_name text not null default 'Partner A',
  partner_b_name text not null default 'Partner B',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspaces_invite_code_uidx
  on workspaces (upper(invite_code));

alter table workspaces enable row level security;
drop policy if exists "allow all for anon" on workspaces;
create policy "allow all for anon" on workspaces
  for all using (true) with check (true);
grant select, insert, update, delete on workspaces to anon, authenticated;

create or replace function set_workspaces_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function set_workspaces_updated_at();

-- 2) workspace_id on tasks / events
alter table tasks add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table events add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

-- 3) Legacy workspace for existing rows
do $$
declare
  legacy_id uuid;
  code text;
begin
  select id into legacy_id
  from workspaces
  where name = 'Legacy'
  order by created_at asc
  limit 1;

  if legacy_id is null then
    -- 8-char code from uuid fragment
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into workspaces (name, invite_code, partner_a_name, partner_b_name)
    values (
      'Legacy',
      code,
      coalesce(
        (select partner_a_name from couple_settings where id = 1),
        'Partner A'
      ),
      coalesce(
        (select partner_b_name from couple_settings where id = 1),
        'Partner B'
      )
    )
    returning id into legacy_id;
  end if;

  update tasks set workspace_id = legacy_id where workspace_id is null;
  update events set workspace_id = legacy_id where workspace_id is null;
end $$;

-- 4) Require workspace_id going forward (only if no nulls remain)
do $$
begin
  if not exists (select 1 from tasks where workspace_id is null)
     and not exists (select 1 from events where workspace_id is null) then
    alter table tasks alter column workspace_id set not null;
    alter table events alter column workspace_id set not null;
  end if;
exception
  when others then null;
end $$;

create index if not exists tasks_workspace_id_idx on tasks (workspace_id);
create index if not exists events_workspace_id_idx on events (workspace_id);

notify pgrst, 'reload schema';

-- Verify
select 'workspaces' as item, count(*)::text as value from workspaces
union all
select 'tasks with workspace', count(*)::text from tasks where workspace_id is not null
union all
select 'events with workspace', count(*)::text from events where workspace_id is not null;
