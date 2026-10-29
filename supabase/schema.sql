-- Maya's Collection — database schema (run in Supabase SQL editor).
-- All tables have RLS enabled with NO policies: the anon key can read nothing.
-- The app only talks to the database from the server using the service-role key.
-- Prices are whole PKR. buy_price is never selected by public pages.

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  logo_url text,
  active boolean not null default true,
  in_stock boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  subtitle text not null default '',
  link text,
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  description text not null default '',
  images text[] not null default '{}',
  buy_price int not null check (buy_price >= 0),   -- our cost, profit only
  sell_price int not null check (sell_price >= 0), -- shown on the site
  weight_g int not null default 1000,
  kind text not null default 'stitched' check (kind in ('stitched','unstitched','other')),
  sizes text[] not null default '{}',   -- empty = no size choice (e.g. unstitched)
  colors text[] not null default '{}',  -- empty = no colour choice
  in_stock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_brand_idx on products(brand_id);

create table if not exists shipping_rates (
  id uuid primary key default gen_random_uuid(),
  courier text not null check (courier in ('pakpost','tcs','leopard')),
  zone text not null check (zone in ('lahore','pakistan','international')),
  up_to_g int not null,          -- weight slab upper bound
  price int not null,            -- PKR, courier charge only
  eta_min_days int not null,
  eta_max_days int not null,
  active boolean not null default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  status text not null default 'pending'
    check (status in ('pending','paid','packed','shipped','delivered','cancelled','returned')),
  customer_name text not null,
  email text not null,
  phone text not null,
  country text not null,
  city text not null,
  address text not null,
  postal_code text,
  courier text not null,
  tracking_no text,
  payment_method text not null,           -- cod | card | jazzcash | easypaisa | hbl
  payment_status text not null default 'unpaid',
  subtotal int not null,
  shipping_fee int not null,              -- what the customer was charged
  shipping_cost int,                      -- what we actually paid the courier
  gateway_fee int not null default 0,
  cod_fee int not null default 0,
  total int not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists orders_email_idx on orders(lower(email));

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  size text,
  color text,
  qty int not null check (qty > 0),
  sell_price int not null,  -- snapshot at order time
  buy_price int not null    -- snapshot at order time, for profit
);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reason text not null,
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','received','refunded','call_scheduled')),
  admin_note text,
  created_at timestamptz not null default now()
);

alter table settings enable row level security;
alter table brands enable row level security;
alter table banners enable row level security;
alter table products enable row level security;
alter table shipping_rates enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table returns enable row level security;

-- Placeholders. Change from the admin portal later.
insert into settings (key, value) values
  ('owner_email', '"ghazanfar899@gmail.com"'),
  ('owner_whatsapp', '"+923313111353"'),
  ('ntn', '""'),
  ('return_address', '""'),
  ('cod_fee', '300'),
  ('lahore_handling', '100'),
  ('other_city_handling', '200'),
  ('gateway_fee_pct', '0')
on conflict (key) do nothing;
