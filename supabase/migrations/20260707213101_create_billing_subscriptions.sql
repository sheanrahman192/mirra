-- Mirra billing subscriptions: maps Supabase users to Stripe customers and
-- subscription status. Payment method and card data remain in Stripe.

create table if not exists public.billing_subscriptions (
  user_id                uuid        primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text        unique,
  stripe_subscription_id text        unique,
  stripe_price_id        text,
  status                 text        not null default 'free'
    check (status in (
      'free',
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )),
  current_period_end     timestamptz,
  trial_end              timestamptz,
  cancel_at_period_end   boolean     not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.billing_subscriptions is
  'Stripe subscription state for each Mirra user. Mutated by the backend service role and Stripe webhooks.';

comment on column public.billing_subscriptions.status is
  'Mirrors Stripe subscription status. Active and trialing unlock Mirra Pro.';

alter table public.billing_subscriptions enable row level security;

drop policy if exists "Users can read their own billing subscription" on public.billing_subscriptions;
create policy "Users can read their own billing subscription"
  on public.billing_subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
