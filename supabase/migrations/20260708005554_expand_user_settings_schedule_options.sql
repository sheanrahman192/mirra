-- Allow users to choose any weekday and a wider set of weekly summary times.

alter table public.user_settings
  drop constraint if exists user_settings_weekly_summary_day_check;

alter table public.user_settings
  add constraint user_settings_weekly_summary_day_check
  check (
    weekly_summary_day in (
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    )
  );

alter table public.user_settings
  drop constraint if exists user_settings_weekly_summary_time_check;

alter table public.user_settings
  add constraint user_settings_weekly_summary_time_check
  check (
    weekly_summary_time in (
      'early_morning',
      'morning',
      'midday',
      'afternoon',
      'evening',
      'night'
    )
  );
