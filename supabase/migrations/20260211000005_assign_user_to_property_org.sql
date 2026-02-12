-- Fix RLS by assigning the most recent user to the organization that owns the specific property.
-- Property ID provided by user: 2535ea6b-7759-4879-ad07-e79815d74002

DO $$
DECLARE
    target_user_id UUID;
    target_property_id UUID := '2535ea6b-7759-4879-ad07-e79815d74002';
    target_org_id UUID;
BEGIN
    -- 1. Find the most recent user (Development User)
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users.';
        RETURN;
    END IF;

    -- 2. Find the organization that owns the target property
    SELECT organization_id INTO target_org_id 
    FROM public.properties 
    WHERE id = target_property_id;

    IF target_org_id IS NULL THEN
        RAISE NOTICE 'Property % not found or has no organization.', target_property_id;
        -- Fallback: Just pick the first org again if property lookup fails (maybe ID is wrong?)
        -- But user copied ID from URL presumably.
        RETURN;
    END IF;

    -- 3. Update the user's profile to match this organization
    UPDATE public.profiles
    SET 
        organization_id = target_org_id,
        role = 'admin',
        updated_at = NOW()
    WHERE id = target_user_id;
        
    RAISE NOTICE 'SUCCESS: User % assigned to Organization % (Owner of Property %)', target_user_id, target_org_id, target_property_id;
END $$;
