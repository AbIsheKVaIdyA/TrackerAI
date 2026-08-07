-- Slice 5 : task comments (partner thread)
-- Run after migrate-slice4.sql

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  author text not null check (author in ('a', 'b')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_idx on task_comments (task_id, created_at);
create index if not exists task_comments_workspace_idx on task_comments (workspace_id);

alter table task_comments enable row level security;
drop policy if exists "allow all for anon" on task_comments;
create policy "allow all for anon" on task_comments
  for all using (true) with check (true);
grant select, insert, update, delete on task_comments to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table task_comments;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
