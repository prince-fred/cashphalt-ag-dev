-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations (Tenants)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  stripe_connect_id text, -- For platform payouts
  created_at timestamptz default now()
);

-- 2. Properties (Lots/Garages)
create table properties (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  name text not null,
  slug text unique not null,
  timezone text not null default 'UTC',
  allocation_mode text check (allocation_mode in ('SPOT', 'ZONE')) not null default 'ZONE',
  max_booking_duration_hours int not null default 24,
  qr_enabled boolean default true,
  sms_enabled boolean default true,
  stripe_account_id text, -- If different from org level
  created_at timestamptz default now()
);

-- 3. Spots (Optional, for SPOT mode)
create table spots (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) not null,
  label text not null, -- "A1", "104"
  is_active boolean default true,
  qr_code_id text unique,
  created_at timestamptz default now(),
  unique(property_id, label)
);

-- 4. Pricing Rules
-- evaluated in order of priority (descending). First match wins.
create table pricing_rules (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) not null,
  priority int not null default 0,
  name text,
  
  -- Constraints
  days_of_week int[], -- 0=Sun, 1=Mon... null=all
  start_time time, -- null=all day
  end_time time,   -- null=all day
  is_active boolean default true,
  
  -- Price
  rate_type text check (rate_type in ('FLAT', 'HOURLY', 'DAILY')) not null,
  amount_cents int not null, -- $5.00 = 500
  
  created_at timestamptz default now()
);

-- 4b. Discounts
create table discounts (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) not null,
  code text not null,
  type text check (type in ('PERCENTAGE', 'FIXED_AMOUNT')) not null,
  amount int not null, 
  usage_limit int, 
  usage_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(property_id, code)
);

-- 5. Sessions
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) not null,
  spot_id uuid references spots(id), -- Nullable if ZONE mode
  
  -- Times
  start_time timestamptz not null,
  end_time_initial timestamptz not null,
  end_time_current timestamptz not null, -- Updated on extension
  
  -- Status
  status text check (status in ('CREATED', 'PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'EXPIRED')) not null default 'CREATED',
  
  -- Payment
  payment_intent_id text,
  total_price_cents int not null default 0,
  
  -- Discount
  discount_id uuid references discounts(id),
  discount_amount_cents int default 0,
  
  -- Customer
  customer_email text,
  customer_phone text,
  vehicle_plate text,
  
  created_at timestamptz default now()
);

-- 6. Session Snapshots (Immutable Record)
-- Stores the specific pricing logic applied at creation time
create table session_pricing_snapshots (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) not null,
  pricing_rule_id uuid references pricing_rules(id),
  applied_rate_cents int not null,
  applied_rate_type text not null,
  created_at timestamptz default now()
);

-- RLS Policies (Draft)
alter table organizations enable row level security;
alter table properties enable row level security;
alter table sessions enable row level security;
-- (Actual policies would act on auth.uid() mapping to org members)
