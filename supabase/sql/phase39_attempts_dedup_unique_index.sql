-- phase39: de-duplicate attempt submission storms + prevent future ones.
--
-- Context & restore steps: docs/attempts-duplicate-cleanup.md
--
-- A non-deterministic ended_at in the student app's save key (now fixed in
-- apps/student/src) let the result page re-insert the same sitting many times.
-- The attempts table had no uniqueness backstop, so every duplicate persisted.
--
-- 1) Delete redundant rows, keeping the earliest (genuine) attempt per
--    (student_id, test_session_id, started_at) group. Genuine retakes have a
--    different started_at and are untouched. Rows without a test_session_id
--    (imported / daily-test attempts) are left alone.
-- 2) Add a partial unique index so a single sitting can never be stored twice
--    again, even from multi-tab or network-layer replay.
--
-- A snapshot table attempts_backup_20260623 was created before running this.

begin;

delete from attempts a
using (
  select id,
         row_number() over (
           partition by student_id, test_session_id, started_at
           order by created_at asc, id asc
         ) as rn
  from attempts
  where test_session_id is not null
) ranked
where a.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists attempts_session_dedup_uidx
  on attempts (student_id, test_session_id, started_at)
  where test_session_id is not null;

commit;
