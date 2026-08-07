-- Slice 3 : recurring tasks
-- Run after migrate-slice2.sql

alter table tasks add column if not exists recur text
  check (recur is null or recur in ('daily', 'weekly'));
alter table tasks add column if not exists recur_until date;

notify pgrst, 'reload schema';
