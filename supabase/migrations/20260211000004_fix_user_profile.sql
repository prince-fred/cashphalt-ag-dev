-- This script attempts to fix the current user's profile to allow them to manage the organization.
-- It assumes the user is already authenticated and their ID is available via auth.uid() when running in context,
-- BUT since migrations run as superuser/postgres, we can't key off auth.uid().
-- Instead, we will fetch the MOST RECENTLY CREATED USER from auth.users (likely the dev user)
-- and verify/insert their profile.

DO $$
DECLARE
    target_user_id UUID;
    target_org_id UUID;
BEGIN
    -- 1. Find the target user (most recent signup)
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users. Please sign up first.';
        RETURN;
    END IF;

    -- 2. Find the target organization (Acme Parking or the first one)
    SELECT id INTO target_org_id FROM public.organizations LIMIT 1;

    IF target_org_id IS NULL THEN
        RAISE NOTICE 'No organizations found. Something is wrong with seeding.';
        RETURN;
    END IF;

    -- 3. Upsert Profile
    INSERT INTO public.profiles (id, email, role, organization_id, full_name, created_at, updated_at)
    SELECT 
        target_user_id,
        (SELECT email FROM auth.users WHERE id = target_user_id),
        'admin', -- Grant ADMIN role
        target_org_id,
        'Dev User',
        NOW(),
        NOW()
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'admin',
        organization_id = target_org_id,
        updated_at = NOW();
        
    RAISE NOTICE 'Updated profile for user % to Admin of Org %', target_user_id, target_org_id;
END $$;
