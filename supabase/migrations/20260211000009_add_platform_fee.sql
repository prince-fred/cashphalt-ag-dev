-- Add platform_fee_percent column to organizations table
ALTER TABLE organizations
ADD COLUMN platform_fee_percent NUMERIC NOT NULL DEFAULT 10; -- Assuming 10% default

COMMENT ON COLUMN organizations.platform_fee_percent IS 'Percentage of transaction (after service fee) taken by platform';
