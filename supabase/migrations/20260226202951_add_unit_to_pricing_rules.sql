alter table pricing_rules 
add column unit_id uuid references parking_units(id) on delete cascade;
