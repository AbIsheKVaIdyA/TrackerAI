-- Optional one-shot seed (skip if you prefer the in-app auto-seed on first load)
-- Run AFTER schema.sql. Safe to re-run only on an empty table.

insert into tasks (title, category, priority, status, week_assigned, completed_at)
select * from (values
  ('Submit scholarship requirements', 'career_applications', 'normal', 'todo', 3::smallint, null::timestamptz),
  ('Finish resume & portfolio', 'career_applications', 'normal', 'todo', 3, null),
  ('Finish application dev & start it up for a startup', 'startup_business', 'critical', 'todo', 1, null),
  ('Prajwal Joshi YouTube account — post whatever content is ready', 'startup_business', 'normal', 'done', 5, now()),
  ('Samarth — items list to bring', 'personal_social', 'normal', 'todo', 5, null),
  ('TryHackMe certification', 'certifications_learning', 'critical', 'todo', 1, null),
  ('Search & learn hash/node — get inside LeetCode soon', 'certifications_learning', 'normal', 'todo', 4, null),
  ('Finish the scholar paper & close it out', 'career_applications', 'critical', 'todo', 1, null),
  ('Track certificate from VTU, book classes, complete payment', 'admin_finance', 'normal', 'todo', 3, null),
  ('Buy insurance & finalize by dropping mail [verify: ''make it minus by dropping mail'']', 'admin_finance', 'critical', 'todo', 1, null),
  ('Finish up Instagram lists & sort what can be done soon', 'personal_social', 'critical', 'todo', 2, null),
  ('Payroll email — Chase bank delete issue', 'admin_finance', 'normal', 'todo', 5, null),
  ('Learn DJ', 'certifications_learning', 'critical', 'todo', 2, null),
  ('Send cold emails to mama — sent email IDs', 'personal_social', 'normal', 'done', 5, now()),
  ('Tesla internship — follow-up email, find someone to get in', 'career_applications', 'normal', 'todo', 4, null),
  ('Visit Chase bank — credit card connect, account payment status', 'admin_finance', 'normal', 'todo', 3, null),
  ('Drop emails for TA/RA roles', 'career_applications', 'normal', 'todo', 4, null),
  ('Company website improvements', 'startup_business', 'critical', 'todo', 4, null),
  ('Marketing & business decision — start & proceed', 'startup_business', 'critical', 'todo', 2, null),
  ('[verify] Old project — break/proceed decision', 'other', 'critical', 'todo', 2, null),
  ('[verify] Telegram bot + notifications setup', 'startup_business', 'critical', 'todo', 5, null)
) as v(title, category, priority, status, week_assigned, completed_at)
where not exists (select 1 from tasks limit 1);
