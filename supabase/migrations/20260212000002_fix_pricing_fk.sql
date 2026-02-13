-- Fix foreign key constraint to allow deleting pricing rules
-- This changes the behavior from RESTRICT to SET NULL for historical snapshots

ALTER TABLE session_pricing_snapshots
DROP CONSTRAINT IF EXISTS session_pricing_snapshots_pricing_rule_id_fkey;

ALTER TABLE session_pricing_snapshots
ADD CONSTRAINT session_pricing_snapshots_pricing_rule_id_fkey
FOREIGN KEY (pricing_rule_id)
REFERENCES pricing_rules(id)
ON DELETE SET NULL;
