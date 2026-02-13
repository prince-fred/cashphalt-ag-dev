-- Add min_duration_hours to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS min_duration_hours INTEGER DEFAULT 1;

-- Ensure max_booking_duration_hours is not null (optional, but good practice if we rely on it)
UPDATE properties SET max_booking_duration_hours = 24 WHERE max_booking_duration_hours IS NULL;
ALTER TABLE properties ALTER COLUMN max_booking_duration_hours SET DEFAULT 24;
