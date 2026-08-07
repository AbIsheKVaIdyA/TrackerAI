-- Slice 4 : shared lists
-- Run after migrate-slice3.sql

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  kind text not null default 'checklist'
    check (kind in ('checklist', 'groceries', 'chores', 'other')),
  created_by text not null default 'a' check (created_by in ('a', 'b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_by text not null default 'a' check (created_by in ('a', 'b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lists_workspace_idx on lists (workspace_id);
create index if not exists list_items_list_idx on list_items (list_id);
create index if not exists list_items_workspace_idx on list_items (workspace_id);

alter table lists enable row level security;
alter table list_items enable row level security;

drop policy if exists "allow all for anon" on lists;
create policy "allow all for anon" on lists
  for all using (true) with check (true);

drop policy if exists "allow all for anon" on list_items;
create policy "allow all for anon" on list_items
  for all using (true) with check (true);

grant select, insert, update, delete on lists to anon, authenticated;
grant select, insert, update, delete on list_items to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table lists;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table list_items;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
