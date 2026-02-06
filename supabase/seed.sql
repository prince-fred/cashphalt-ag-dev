-- Insert a test organization
INSERT INTO organizations (id, name, slug)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Parking Co.', 'acme-parking')
ON CONFLICT (slug) DO NOTHING;

-- Insert a test property (Garage)
INSERT INTO properties (id, organization_id, name, slug, timezone, allocation_mode, max_booking_duration_hours)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Downtown Garage 1', 
    'downtown-garage-1', 
    'America/New_York', 
    'ZONE', 
    24
)
ON CONFLICT (slug) DO NOTHING;

-- Insert a test pricing rule ($5.00 Flat Rate)
INSERT INTO pricing_rules (property_id, priority, name, rate_type, amount_cents)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    1, 
    'Standard Daily Rate', 
    'HOURLY', 
    500
);
