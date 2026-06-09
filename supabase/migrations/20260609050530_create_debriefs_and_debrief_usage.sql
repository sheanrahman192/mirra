-- Mirra core schema: debriefs + monthly usage counters.
-- Users are managed by Supabase Auth (auth.users); both tables reference it.
-- Writes go through the backend service role (which bypasses RLS).
-- Clients (the `authenticated` role) get read-only access to their own rows.

-- ---------------------------------------------------------------------------
-- debriefs: one row per completed conversation debrief
-- ---------------------------------------------------------------------------
create table public.debriefs (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now(),
  session_id        text        not null,
  observation       text        not null,
  pattern_to_reduce text        not null,
  thing_to_try_next text        not null,
  stats             jsonb       not null,
  transcript        text
);

comment on table public.debriefs is
  'Conversation debrief cards. Inserted by the backend service role; read-only to clients.';

-- List a user's debriefs newest-first.
create index debriefs_user_id_created_at_idx
  on public.debriefs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- debrief_usage: monthly usage counter, one row per user per month
-- ---------------------------------------------------------------------------
create table public.debrief_usage (
  user_id   uuid    not null references auth.users (id) on delete cascade,
  month_key text    not null,                 -- 'YYYY-MM'
  count     integer not null default 0 check (count >= 0),
  primary key (user_id, month_key)
);

comment on table public.debrief_usage is
  'Per-user, per-month debrief counter for the free-tier cap. Mutated by the backend service role.';

-- ---------------------------------------------------------------------------
-- Row Level Security
--   Enable RLS on both tables and add read-only ("select") policies scoped to
--   the authenticated user. No insert/update/delete policies are defined, so
--   the only path that can write is the backend service role (bypasses RLS).
-- ---------------------------------------------------------------------------
alter table public.debriefs      enable row level security;
alter table public.debrief_usage enable row level security;

create policy "Users can read their own debriefs"
  on public.debriefs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own usage"
  on public.debrief_usage
  for select
  to authenticated
  using (auth.uid() = user_id);
