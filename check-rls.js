require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test with Anon key (which the server action uses when it calls `createClient` from `@/utils/supabase/server`)
// Wait, `actions/checkout.ts` uses `createClient` from `@/utils/supabase/server`.
// Let's check how that client is configured.
const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We need to test the query exactly as it is in checkout.ts, but from the perspective of an anonymous user 
// or whatever context `createClient()` has in `actions/checkout.ts`.
// Usually, checkout is public (no user logged in).
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
    console.log("Testing with Service Role (Admin):");
    const { data: propAdmin, error: errAdmin } = await supabaseService
        .from('properties')
        .select('*, organizations(*)')
        .eq('id', '013f3b3d-6182-41fc-a89d-faa5ff20f631')
        .single();

    console.log("Admin Org returned:", propAdmin ? propAdmin.organizations : errAdmin);

    console.log("\nTesting with Anon Role (Public Checkout):");
    const { data: propAnon, error: errAnon } = await supabaseAnon
        .from('properties')
        .select('*, organizations(*)')
        .eq('id', '013f3b3d-6182-41fc-a89d-faa5ff20f631')
        .single();

    // errAnon is likely to be null if RLS allows reading properties
    // but what about organizations?
    console.log("Anon Org returned:", propAnon ? propAnon.organizations : errAnon);
}

testQuery();
