-- Specifically fix the profile for 'prince@aifred.io' to ensure they have access to the default property.
-- Default Property ID: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (from seed.sql)

DO $$
DECLARE
    target_email TEXT := 'prince@aifred.io';
    target_user_id UUID;
    target_property_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    target_org_id UUID;
BEGIN
    -- 1. Get the User ID for the specific email
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', target_email;
    END IF;

    -- 2. Get the Organization ID for the target property
    SELECT organization_id INTO target_org_id FROM public.properties WHERE id = target_property_id;
    
    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'Property % not found or has no organization', target_property_id;
    END IF;

    -- 3. Upsert the profile with correct Organization and Role
    INSERT INTO public.profiles (id, email, full_name, role, organization_id, created_at, updated_at)
    VALUES (
        target_user_id,
        target_email,
        'Prince (Admin)',
        'admin',
        target_org_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'admin',
        organization_id = target_org_id,
        updated_at = NOW();

    RAISE NOTICE 'FIXED: User % (%) assigned to Org %', target_email, target_user_id, target_org_id;
END $$;
