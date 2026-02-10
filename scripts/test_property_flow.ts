import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

// Service role client to bypass RLS for setup/verification
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPropertyFlow() {
    console.log('--- Testing Property Creation & Fetching ---')

    // 1. Get Organization
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1)
    if (!orgs || orgs.length === 0) {
        console.error('❌ No organizations found. Cannot create property.')
        return
    }
    const orgId = orgs[0].id
    console.log(`Using Organization ID: ${orgId}`)

    // 2. Create Property
    const propertyData = {
        organization_id: orgId,
        name: `Test Property ${Date.now()}`,
        slug: `test-prop-${Date.now()}`,
        timezone: 'America/New_York',
        allocation_mode: 'ZONE',
        max_booking_duration_hours: 24,
        price_hourly_cents: 500,
        address: '123 Test St'
    }

    console.log('Attempting to create property:', propertyData)

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

    if (insertError) {
        console.error('❌ Failed to create property:', insertError.message)
    } else {
        console.log('✅ Property created successfully:', inserted.id)
    }

    // 3. Fetch Properties (As Admin)
    // We want to simulate the RLS check if possible, but we don't have the user's JWT easily here.
    // However, if the page uses `getProperties` server action, let's see how that works.
    // The server action uses `createClient()` which uses cookies.
    // Here we can check if the record exists via Admin first.

    const { data: allProps, error: fetchError } = await supabaseAdmin
        .from('properties')
        .select('*')

    if (fetchError) {
        console.error('❌ Admin Fetch Error:', fetchError.message)
    } else {
        console.log(`Admin sees ${allProps.length} properties.`)
        if (allProps.length > 0) {
            console.log('Sample:', allProps[0].name)
        }
    }

    // 4. Check RLS Policies
    // We can't programmatically check enabled policies easily, but we can verify if RLS is enabled.
    // (This requires SQL or dashboard, but we can infer from behavior).
}

testPropertyFlow()
