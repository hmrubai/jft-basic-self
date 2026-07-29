-- Phase 40: shared/global question set answer edits
--
-- Two defects fixed here:
--
-- 1) Editing an answer on a globally visible question set failed with 0 matched rows.
--    Reads follow the question_sets catalog (phase8: visibility_scope = 'global' is
--    readable by every school), but writes were pinned to questions.school_id, which is
--    just the scope the uploader happened to be in. Any admin outside that school could
--    open the set, edit, and have the UPDATE match nothing.
--
-- 2) The admin console's "linked question" lookup filtered with
--    `data @> {"sourceVersion": ...}`. jsonb_contains is not leakproof, so under RLS the
--    per-row security quals run over the whole questions table before that filter,
--    blowing past the 8s statement_timeout (error 57014). A SECURITY DEFINER function
--    plus an expression index turns it into a single indexed lookup.

-- ---------------------------------------------------------------------------
-- 1. Indexable lookup of derived copies
-- ---------------------------------------------------------------------------

create index if not exists questions_data_source_version_idx
  on public.questions ((data ->> 'sourceVersion'));

create or replace function public.linked_questions_for_source_version(p_source_version text)
returns table (
  id uuid,
  test_version text,
  question_id text,
  section_key text,
  type text,
  prompt_en text,
  prompt_bn text,
  answer_index integer,
  order_index integer,
  data jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    q.id,
    q.test_version,
    q.question_id,
    q.section_key,
    q.type,
    q.prompt_en,
    q.prompt_bn,
    q.answer_index,
    q.order_index,
    q.data
  from public.questions q
  where coalesce(p_source_version, '') <> ''
    and q.data ->> 'sourceVersion' = p_source_version
    -- caller must already be allowed to see the source set itself
    and (
      public.current_user_role() = 'super_admin'
      or (
        public.current_user_role() = 'admin'
        and (
          public.can_access_school_legacy_test_version(p_source_version, public.effective_school_scope_id())
          or exists (
            select 1
            from public.questions src
            where src.test_version = p_source_version
              and public.can_access_school(src.school_id)
          )
        )
      )
    )
  order by q.test_version, q.order_index
$function$;

revoke execute on function public.linked_questions_for_source_version(text) from public;
revoke execute on function public.linked_questions_for_source_version(text) from anon;
grant execute on function public.linked_questions_for_source_version(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. UPDATE policy: mirror the read rule for shared sets
-- ---------------------------------------------------------------------------

create or replace function public.can_edit_question_row(
  p_school_id uuid,
  p_test_version text,
  p_data jsonb
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when public.current_user_role() = 'super_admin' then true
    when public.current_user_role() = 'admin' then
      -- own school's rows
      public.can_access_school(p_school_id)
      -- global / granted sets the school can already read
      or public.can_access_school_legacy_test_version(p_test_version, public.effective_school_scope_id())
      -- derived copies inside generated sessions, keyed back to a readable source set
      or (
        coalesce(p_data ->> 'sourceVersion', '') <> ''
        and public.can_access_school_legacy_test_version(
          p_data ->> 'sourceVersion',
          public.effective_school_scope_id()
        )
      )
    else false
  end
$function$;

drop policy if exists "questions admin update shared" on public.questions;
create policy "questions admin update shared" on public.questions
  for update
  using (public.can_edit_question_row(school_id, test_version, data))
  with check (public.can_edit_question_row(school_id, test_version, data));

-- ---------------------------------------------------------------------------
-- 3. Ownership guard
-- ---------------------------------------------------------------------------
-- The widened UPDATE policy must not become a way to re-stamp a shared row onto the
-- editing admin's own school, or move it into a different set. Service-role callers
-- (edge functions, migrations) are exempt.

create or replace function public.questions_freeze_ownership()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or public.current_user_role() = 'super_admin' then
    return new;
  end if;

  if new.school_id is distinct from old.school_id then
    raise exception 'questions.school_id cannot be changed by a school admin'
      using errcode = '42501';
  end if;

  if new.test_version is distinct from old.test_version then
    raise exception 'questions.test_version cannot be changed by a school admin'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists questions_freeze_ownership_trg on public.questions;
create trigger questions_freeze_ownership_trg
  before update on public.questions
  for each row execute function public.questions_freeze_ownership();
