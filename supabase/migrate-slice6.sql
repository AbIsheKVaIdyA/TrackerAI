-- Slice 6 : pinned tasks
-- Run after migrate-slice5.sql

alter table tasks add column if not exists pinned boolean not null default false;

create index if not exists tasks_pinned_idx on tasks (workspace_id, pinned)
  where pinned = true;

notify pgrst, 'reload schema';
