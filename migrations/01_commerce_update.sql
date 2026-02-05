-- 1. Updates to Pricing Rules (Support DAILY rates)
-- We need to drop the existing check constraint and add a new one.
-- Note: We are assuming the default constraint name 'pricing_rules_rate_type_check'.
-- If it fails, we might need to find the name dynamically, but for this env 'pricing_rules_rate_type_check' is standard.

DO $$ BEGIN
    ALTER TABLE pricing_rules DROP CONSTRAINT IF EXISTS pricing_rules_rate_type_check;
    ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_rate_type_check CHECK (rate_type IN ('FLAT', 'HOURLY', 'DAILY'));
EXCEPTION
    WHEN undefined_object THEN
        -- If constraint name differs, just try adding the new check (it might duplicate but works)
        ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_rate_type_check_v2 CHECK (rate_type IN ('FLAT', 'HOURLY', 'DAILY'));
END $$;

-- 2. Create Discounts Table
create table if not exists discounts (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) not null,
  code text not null,
  type text check (type in ('PERCENTAGE', 'FIXED_AMOUNT')) not null,
  amount int not null, -- 15 = 15% or $0.15 depending on type. For PERCENTAGE 100=100%, for FIXED_AMOUNT in cents.
  usage_limit int, -- null = unlimited
  usage_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(property_id, code)
);

-- 3. Create Session Transactions Table (For extensions)
create table if not exists session_transactions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) not null,
  payment_intent_id text unique,
  amount_cents int not null,
  status text not null, -- 'succeeded', 'pending', 'failed'
  type text not null default 'INITIAL', -- 'INITIAL', 'EXTENSION'
  created_at timestamptz default now()
);

-- 4. Update Properties
alter table properties add column if not exists extensions_enabled boolean default true;

-- 5. Update Sessions to track discounts
alter table sessions 
  add column if not exists discount_id uuid references discounts(id),
  add column if not exists discount_amount_cents int default 0;
