
-- Enable RLS (already done, but safe to repeat)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access to properties
create policy "Allow public read access"
  on properties
  for select
  to anon
  using (true);

-- Also allow public read access for pricing rules (needed for the payment page later)
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

create policy "Allow public read access"
  on pricing_rules
  for select
  to anon
  using (true);
