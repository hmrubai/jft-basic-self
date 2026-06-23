# Attempts duplicate-submission cleanup & fix (2026-06-23)

## Problem

Students produced multiple `attempts` rows for a single exam sitting ("submission
storms"). Example: student *Moriom* had 8 near-identical rows inserted within ~1s;
*Afride Hasan Tanvir* had ~26 rows for one sitting spanning a full hour.

### Root cause

`apps/student/src/pages/resultPage.js` builds the attempt payload with a
non-deterministic `ended_at`:

```js
ended_at: state.testEndAt ? new Date(state.testEndAt).toISOString() : new Date().toISOString(),
```

The de-dup / save key (`getAttemptDedupKey` in `attemptHelpers.js`) **included
`ended_at`**. When `state.testEndAt` was falsy, every render computed a fresh
`ended_at`, so the key changed on each render. That defeated both client guards:

1. **In-flight guard** (`pendingAttemptSaveKey === saveKey`) never matched → a new
   concurrent `insert` fired on each render.
2. **Success-commit guard** (`isCurrentSaveAttempt(saveKey)`) rebuilt the payload,
   got a newer `ended_at`, mismatched the captured key → `state.attemptSaved = true`
   was skipped → the result page kept re-saving forever until the tab closed.

The `attempts` table had **no uniqueness constraint** (only the `id` pkey), so the
database accepted every duplicate insert.

Table-wide impact at time of fix: 52 storm groups, 235 redundant rows
(grouped by `student_id, test_session_id, started_at`).

### Which row is the real one

Within each storm group the **earliest row (`min(created_at)`) is the genuine
completed attempt**. Later rows are degraded stale re-saves submitted hours/days
later (scores drop, `total` sometimes collapses to 0/partial because a different
question set reloaded). Genuine retakes have a **different `started_at`** and form a
separate group, so they are never touched.

## Backup

Before any deletion a same-database snapshot was taken:

```sql
create table attempts_backup_20260623 as select * from attempts;  -- 23,770 rows
```

### Restore commands

Re-insert any rows that were deleted from `attempts` (matches by `id`):

```sql
insert into attempts
select * from attempts_backup_20260623
where id not in (select id from attempts);
```

Full restore (wipe + reload — use only if `attempts` is badly corrupted):

```sql
-- DANGER: removes ALL current attempts, then restores the snapshot exactly.
begin;
delete from attempts;
insert into attempts select * from attempts_backup_20260623;
commit;
```

Verify after restore:

```sql
select count(*) from attempts;                 -- expect ~23,770 (+ any new sittings)
select count(*) from attempts_backup_20260623; -- 23,770
```

Drop the backup once confident:

```sql
drop table attempts_backup_20260623;
```

> Broader safety net: Supabase Dashboard → Database → Backups (PITR if on a paid
> plan) can restore the whole project to a point in time.

## Fixes applied

1. **Cleanup** — removed 235 redundant storm rows, keeping `min(created_at)` per
   `(student_id, test_session_id, started_at)` group. See
   `supabase/sql/phase39_attempts_dedup_unique_index.sql`.
2. **DB backstop** — partial unique index
   `attempts_session_dedup_uidx` on `(student_id, test_session_id, started_at)`
   `where test_session_id is not null`. Blocks future storms even from
   multi-tab / network-layer replay. Same migration file.
3. **Client fix** — `apps/student/src`:
   - `lib/attemptHelpers.js`: `getAttemptDedupKey` no longer includes `ended_at`
     (keys on session/version/`started_at`/answers — stable per sitting).
   - `pages/resultPage.js`: `state.testEndAt` is frozen on first payload build so
     `ended_at` is deterministic; a Postgres unique-violation (`23505`) on insert
     is treated as success (`attemptSaved = true`).
