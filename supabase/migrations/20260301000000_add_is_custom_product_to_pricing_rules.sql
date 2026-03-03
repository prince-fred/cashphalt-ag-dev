alter table pricing_rules 
add column is_custom_product boolean not null default false;
