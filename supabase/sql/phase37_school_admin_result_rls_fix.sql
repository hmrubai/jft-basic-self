-- Phase 37: fix school-admin result access under RLS
-- - Restores school-admin read access to legacy/public test content when that
--   version is already tied to the admin's school through sessions or attempts.
-- - Adds the missing attempts UPDATE policy required by score refresh flows.
-- - Tightens score recalculation RPCs so school admins can only run them within
--   their own school scope.

begin;

create or replace function public.can_access_school_legacy_test_version(
  p_test_version text,
  p_school_id uuid default public.effective_school_scope_id()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_school_id is not null
    and (
      public.can_access_legacy_set_version(p_test_version, p_school_id)
      or exists (
        select 1
        from public.test_sessions ts
        where ts.problem_set_id = p_test_version
          and ts.school_id = p_school_id
      )
      or exists (
        select 1
        from public.attempts a
        where a.test_version = p_test_version
          and a.school_id = p_school_id
      )
    )
$$;

drop policy if exists "tests select" on public.tests;
create policy "tests select"
on public.tests for select
using (
  public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() = 'admin'
    and (
      public.can_access_school(school_id)
      or public.can_access_school_legacy_test_version(version, public.effective_school_scope_id())
    )
  )
  or (
    public.current_user_role() = 'student'
    and (
      public.can_access_school(school_id)
      or (
        is_public = true
        and exists (
          select 1
          from public.test_sessions ts
          where ts.problem_set_id = tests.version
            and ts.school_id = public.current_user_school_id()
            and ts.is_published = true
        )
        and public.can_access_legacy_set_version(version, public.current_user_school_id())
      )
    )
  )
);

drop policy if exists "questions select" on public.questions;
create policy "questions select"
on public.questions for select
using (
  public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() = 'admin'
    and (
      public.can_access_school(school_id)
      or public.can_access_school_legacy_test_version(test_version, public.effective_school_scope_id())
    )
  )
  or (
    public.current_user_role() = 'student'
    and (
      public.can_access_school(school_id)
      or (
        exists (
          select 1
          from public.test_sessions ts
          where ts.problem_set_id = questions.test_version
            and ts.school_id = public.current_user_school_id()
            and ts.is_published = true
        )
        and public.can_access_legacy_set_version(test_version, public.current_user_school_id())
      )
    )
  )
);

drop policy if exists "choices select" on public.choices;
create policy "choices select"
on public.choices for select
using (
  exists (
    select 1
    from public.questions q
    where q.id = choices.question_id
      and (
        public.current_user_role() = 'super_admin'
        or (
          public.current_user_role() = 'admin'
          and (
            public.can_access_school(q.school_id)
            or public.can_access_school_legacy_test_version(q.test_version, public.effective_school_scope_id())
          )
        )
        or (
          public.current_user_role() = 'student'
          and (
            public.can_access_school(q.school_id)
            or (
              exists (
                select 1
                from public.test_sessions ts
                where ts.problem_set_id = q.test_version
                  and ts.school_id = public.current_user_school_id()
                  and ts.is_published = true
              )
              and public.can_access_legacy_set_version(q.test_version, public.current_user_school_id())
            )
          )
        )
      )
  )
);

drop policy if exists "test assets select" on public.test_assets;
create policy "test assets select"
on public.test_assets for select
using (
  public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() = 'admin'
    and (
      public.can_access_school(school_id)
      or public.can_access_school_legacy_test_version(test_version, public.effective_school_scope_id())
    )
  )
);

drop policy if exists "attempts admin update" on public.attempts;
create policy "attempts admin update"
on public.attempts for update
using (
  public.current_user_role() in ('super_admin', 'admin')
  and public.can_access_school(school_id)
)
with check (
  public.current_user_role() in ('super_admin', 'admin')
  and public.can_access_school(school_id)
);

create or replace function public.recalculate_question_set_scores(
  p_question_set_id uuid
)
returns table (
  affected_attempts_count int,
  updated_attempts_count int,
  min_score_rate numeric,
  max_score_rate numeric,
  avg_score_rate numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count int;
begin
  if public.current_user_role() not in ('super_admin', 'admin') then
    raise exception 'only super_admin and admin can recalculate scores';
  end if;

  if not exists (
    select 1
    from public.question_sets
    where id = p_question_set_id
  ) then
    raise exception 'question set not found: %', p_question_set_id;
  end if;

  if public.current_user_role() = 'admin'
     and not public.can_access_question_set(p_question_set_id, public.effective_school_scope_id()) then
    raise exception 'school admins can only recalculate scores for question sets available to their school';
  end if;

  with calculated_scores as (
    select
      a.id,
      a.correct as old_correct,
      a.score_rate as old_score_rate,
      coalesce(
        (
          select count(*)::int
          from public.question_set_questions qsq
          where qsq.question_set_id = p_question_set_id
            and jsonb_typeof(a.answers_json -> qsq.id::text) = 'number'
            and (a.answers_json ->> (qsq.id::text))::int = (qsq.correct_answer::int)
        ),
        0
      ) as new_correct,
      (
        select count(*)::int
        from public.question_set_questions
        where question_set_id = p_question_set_id
      ) as total_questions
    from public.attempts a
    where a.question_set_id = p_question_set_id
      and (
        public.current_user_role() = 'super_admin'
        or public.can_access_school(a.school_id)
      )
  ),
  with_score_rate as (
    select
      id,
      old_correct,
      old_score_rate,
      new_correct,
      total_questions,
      case
        when total_questions > 0
        then (new_correct::numeric / total_questions * 100)::numeric(5, 2)
        else 0
      end as new_score_rate
    from calculated_scores
  )
  update public.attempts
  set
    correct = wsr.new_correct,
    score_rate = wsr.new_score_rate,
    updated_at = now()
  from with_score_rate wsr
  where attempts.id = wsr.id
    and (attempts.correct != wsr.new_correct or attempts.score_rate != wsr.new_score_rate);

  get diagnostics v_updated_count = row_count;

  return query
  select
    (
      select count(*)::int
      from public.attempts a
      where a.question_set_id = p_question_set_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    ) as affected_attempts_count,
    v_updated_count as updated_attempts_count,
    (
      select min(a.score_rate)
      from public.attempts a
      where a.question_set_id = p_question_set_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric as min_score_rate,
    (
      select max(a.score_rate)
      from public.attempts a
      where a.question_set_id = p_question_set_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric as max_score_rate,
    (
      select avg(a.score_rate)
      from public.attempts a
      where a.question_set_id = p_question_set_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric(5, 2) as avg_score_rate;
end;
$$;

create or replace function public.recalculate_test_instance_scores(
  p_test_instance_id uuid
)
returns table (
  affected_attempts_count int,
  updated_attempts_count int,
  min_score_rate numeric,
  max_score_rate numeric,
  avg_score_rate numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_set_id uuid;
  v_school_id uuid;
  v_updated_count int;
begin
  if public.current_user_role() not in ('super_admin', 'admin') then
    raise exception 'only super_admin and admin can recalculate scores';
  end if;

  select ti.question_set_id, ti.school_id
  into v_question_set_id, v_school_id
  from public.test_instances ti
  where ti.id = p_test_instance_id;

  if v_question_set_id is null then
    raise exception 'test instance not found or no associated question set: %', p_test_instance_id;
  end if;

  if public.current_user_role() = 'admin'
     and not public.can_access_school(v_school_id) then
    raise exception 'school admins can only recalculate scores for test instances in their own school';
  end if;

  with calculated_scores as (
    select
      a.id,
      a.correct as old_correct,
      a.score_rate as old_score_rate,
      coalesce(
        (
          select count(*)::int
          from public.question_set_questions qsq
          where qsq.question_set_id = v_question_set_id
            and jsonb_typeof(a.answers_json -> qsq.id::text) = 'number'
            and (a.answers_json ->> (qsq.id::text))::int = (qsq.correct_answer::int)
        ),
        0
      ) as new_correct,
      (
        select count(*)::int
        from public.question_set_questions
        where question_set_id = v_question_set_id
      ) as total_questions
    from public.attempts a
    where a.test_instance_id = p_test_instance_id
      and (
        public.current_user_role() = 'super_admin'
        or public.can_access_school(a.school_id)
      )
  ),
  with_score_rate as (
    select
      id,
      old_correct,
      old_score_rate,
      new_correct,
      total_questions,
      case
        when total_questions > 0
        then (new_correct::numeric / total_questions * 100)::numeric(5, 2)
        else 0
      end as new_score_rate
    from calculated_scores
  )
  update public.attempts
  set
    correct = wsr.new_correct,
    score_rate = wsr.new_score_rate,
    updated_at = now()
  from with_score_rate wsr
  where attempts.id = wsr.id
    and (attempts.correct != wsr.new_correct or attempts.score_rate != wsr.new_score_rate);

  get diagnostics v_updated_count = row_count;

  return query
  select
    (
      select count(*)::int
      from public.attempts a
      where a.test_instance_id = p_test_instance_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    ) as affected_attempts_count,
    v_updated_count as updated_attempts_count,
    (
      select min(a.score_rate)
      from public.attempts a
      where a.test_instance_id = p_test_instance_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric as min_score_rate,
    (
      select max(a.score_rate)
      from public.attempts a
      where a.test_instance_id = p_test_instance_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric as max_score_rate,
    (
      select avg(a.score_rate)
      from public.attempts a
      where a.test_instance_id = p_test_instance_id
        and (
          public.current_user_role() = 'super_admin'
          or public.can_access_school(a.school_id)
        )
    )::numeric(5, 2) as avg_score_rate;
end;
$$;

grant execute on function public.recalculate_question_set_scores(uuid) to authenticated;
grant execute on function public.recalculate_test_instance_scores(uuid) to authenticated;

commit;
