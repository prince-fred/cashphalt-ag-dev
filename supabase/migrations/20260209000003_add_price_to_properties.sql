-- Add price_hourly_cents column to properties table
alter table properties add column if not exists price_hourly_cents int;
