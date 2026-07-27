-- Couple mode migration
-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- Safe to re-run.

-- Who the task belongs to: a = partner A, b = partner B, both = shared
alter table tasks
  add column if not exists assignee text not null default 'a'
    check (assignee in ('a', 'b', 'both'));

alter table tasks
  add column if not exists created_by text not null default 'a'
    check (created_by in ('a', 'b'));

alter table tasks
  add column if not exists updated_at timestamptz not null default now();

-- Shared couple settings (names) — one row, id = 1
create table if not exists couple_settings (
  id int primary key default 1 check (id = 1),
  partner_a_name text not null default 'Abhishek',
  partner_b_name text not null default 'Kusa',
  couple_label text not null default 'August Execution',
  updated_at timestamptz not null default now()
);

insert into couple_settings (id, partner_a_name, partner_b_name, couple_label)
values (1, 'Abhishek', 'Kusa', 'August Execution')
on conflict (id) do nothing;

alter table couple_settings enable row level security;
drop policy if exists "allow all for anon" on couple_settings;
create policy "allow all for anon" on couple_settings
  for all using (true) with check (true);
grant select, insert, update, delete on couple_settings to anon, authenticated;

-- Keep updated_at fresh on task changes
create or replace function set_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_tasks_updated_at();

-- Realtime: both phones see each other's edits live
-- (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table tasks;
exception
  when duplicate_object then null;
end $$;
