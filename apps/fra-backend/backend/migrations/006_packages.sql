create table if not exists public.packages (
  id text primary key,
  name text not null,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'gbp',
  keypass_allowance integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed the three product tiers
insert into public.packages (id, name, description, price_cents, currency, keypass_allowance, features, sort_order)
values
  ('pkg_basic', 'Basic', 'Self-service fraud risk assessment', 0, 'gbp', 1, '["Single assessment", "Basic risk report", "PDF export"]'::jsonb, 1),
  ('pkg_training', 'Training', 'Assessment with staff training key-passes', 4900, 'gbp', 10, '["Everything in Basic", "10 employee key-passes", "Training modules", "Compliance certificate"]'::jsonb, 2),
  ('pkg_full', 'Full', 'Complete fraud risk management suite', 14900, 'gbp', 50, '["Everything in Training", "50 employee key-passes", "Priority support", "Custom action plan", "Annual review"]'::jsonb, 3)
on conflict (id) do nothing;
