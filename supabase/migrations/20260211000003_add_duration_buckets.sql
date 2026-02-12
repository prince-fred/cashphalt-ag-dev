-- Add duration bucket columns to pricing_rules
ALTER TABLE pricing_rules
ADD COLUMN IF NOT EXISTS min_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS max_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create default buckets for all existing properties
-- We use a DO block to iterate and insert defaults if no rules exist (or just append)
-- Strategy: For every property, insert 3 default buckets if they don't have any bucket-style rules yet.
-- To be safe, we'll just insert them for all properties to ensure they have options.
-- We can check if they already have rules, but since this is a schema change, existing rules (rate_type=HOURLY) 
-- might technically remain valid but won't show up in the new UI if we filter by min/max duration.
-- So we'll update existing rules or just add new ones? 
-- The plan said "Insert default pricing rules". Let's add them.

DO $$
DECLARE
    prop RECORD;
BEGIN
    FOR prop IN SELECT id FROM properties LOOP
        -- Bucket 1: 0-2 Hours ($5.00)
        INSERT INTO pricing_rules (property_id, priority, name, description, min_duration_minutes, max_duration_minutes, rate_type, amount_cents, is_active)
        VALUES (prop.id, 10, 'Short Stay', 'Up to 2 Hours', 0, 120, 'FLAT', 500, true);

        -- Bucket 2: 2-4 Hours ($10.00)
        INSERT INTO pricing_rules (property_id, priority, name, description, min_duration_minutes, max_duration_minutes, rate_type, amount_cents, is_active)
        VALUES (prop.id, 20, 'Standard Stay', '2 to 4 Hours', 120, 240, 'FLAT', 1000, true);

        -- Bucket 3: All Day ($25.00)
        INSERT INTO pricing_rules (property_id, priority, name, description, min_duration_minutes, max_duration_minutes, rate_type, amount_cents, is_active)
        VALUES (prop.id, 30, 'All Day', 'Until Midnight', 240, 1440, 'FLAT', 2500, true);
    END LOOP;
END $$;
