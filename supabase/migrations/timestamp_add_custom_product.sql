-- Add custom product fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS custom_product_name text,
ADD COLUMN IF NOT EXISTS custom_product_end_time time, -- using time type for HH:MM:SS
ADD COLUMN IF NOT EXISTS custom_product_price_cents integer,
ADD COLUMN IF NOT EXISTS custom_product_enabled boolean DEFAULT false;
