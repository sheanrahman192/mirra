-- Mirra user settings: profile-tab preferences.
-- The app reads and writes these through the backend, while RLS keeps the table
-- safe if it is exposed through Supabase's Data API.

create table public.user_settings (
  user_id                       uuid        primary key references auth.users (id) on delete cascade,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  notifications_enabled         boolean     not null default true,
  weekly_summary_day            text        not null default 'sunday'
    check (weekly_summary_day in ('sunday', 'monday', 'friday')),
  weekly_summary_time           text        not null default 'evening'
    check (weekly_summary_time in ('morning', 'afternoon', 'evening')),
  reflection_reminders          boolean     not null default false,
  product_updates               boolean     not null default true,
  save_transcripts              boolean     not null default true,
  include_transcript_in_reflect boolean     not null default false,
  coaching_tone                 text        not null default 'warm_reflective'
    check (coaching_tone in ('warm_reflective', 'direct_practical', 'curious_gentle')),
  coaching_depth                text        not null default 'balanced'
    check (coaching_depth in ('quick', 'balanced', 'deep'))
);

comment on table public.user_settings is
  'Per-user preferences for notifications, voice/privacy, and coaching style.';

alter table public.user_settings enable row level security;

create policy "Users can read their own settings"
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own settings"
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own settings"
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
