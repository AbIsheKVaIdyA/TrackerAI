-- Full schema (fresh installs). Existing projects: run migrate-couple.sql instead.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in (
    'career_applications', 'certifications_learning', 'startup_business',
    'admin_finance', 'personal_social', 'other'
  )),
  priority text not null check (priority in ('critical', 'normal')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  week_assigned smallint check (week_assigned between 1 and 5),
  notes text,
  assignee text not null default 'a' check (assignee in ('a', 'b', 'both')),
  created_by text not null default 'a' check (created_by in ('a', 'b')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

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

alter table tasks enable row level security;
drop policy if exists "allow all for anon" on tasks;
create policy "allow all for anon" on tasks
  for all using (true) with check (true);
grant select, insert, update, delete on tasks to anon, authenticated;

alter table couple_settings enable row level security;
drop policy if exists "allow all for anon" on couple_settings;
create policy "allow all for anon" on couple_settings
  for all using (true) with check (true);
grant select, insert, update, delete on couple_settings to anon, authenticated;

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

do $$
begin
  alter publication supabase_realtime add table tasks;
exception
  when duplicate_object then null;
end $$;
