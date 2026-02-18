-- Enable public read access for properties
create policy "Public can view properties"
  on properties
  for select
  using ( true );

-- Enable public read access for parking_units
create policy "Public can view parking units"
  on parking_units
  for select
  using ( true );

-- Enable public read access for pricing_rules
create policy "Public can view pricing rules"
  on pricing_rules
  for select
  using ( true );
