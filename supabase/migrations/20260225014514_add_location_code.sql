-- Create a sequence for location codes starting at 1000
CREATE SEQUENCE IF NOT EXISTS location_code_seq START WITH 1000;

-- Add location_code to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_code VARCHAR DEFAULT nextval('location_code_seq')::VARCHAR;

-- Add location_code to parking_units
ALTER TABLE parking_units ADD COLUMN IF NOT EXISTS location_code VARCHAR DEFAULT nextval('location_code_seq')::VARCHAR;

-- Backfill existing properties
UPDATE properties SET location_code = nextval('location_code_seq')::VARCHAR WHERE location_code IS NULL;

-- Backfill existing parking_units
UPDATE parking_units SET location_code = nextval('location_code_seq')::VARCHAR WHERE location_code IS NULL;

-- Add unique constraints
ALTER TABLE properties ADD CONSTRAINT properties_location_code_key UNIQUE (location_code);
ALTER TABLE parking_units ADD CONSTRAINT parking_units_location_code_key UNIQUE (location_code);
