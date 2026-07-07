-- Wrap auth.uid() in select for RLS init-plan caching on existing tables.

drop policy if exists "Users can read their own debriefs" on public.debriefs;
create policy "Users can read their own debriefs"
  on public.debriefs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own usage" on public.debrief_usage;
create policy "Users can read their own usage"
  on public.debrief_usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
