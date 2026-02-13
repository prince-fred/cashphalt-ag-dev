
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' }); // Try .env.local first
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- Checking Organizations (Service Role) ---');
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
    if (orgError) console.error('Error fetching orgs:', orgError);
    else {
        console.log(`Found ${orgs.length} organizations.`);
        orgs.forEach(o => console.log(` - ${o.name} (${o.id})`));
    }

    console.log('\n--- Checking RLS Policies on organizations table ---');
    const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'organizations')
        .eq('schemaname', 'public');

    if (policyError) {
        // Fallback if pg_policies is not accessible via API (it might not be)
        // We can try rpc if available, or just assume.
        console.error('Error fetching policies (might be restricted):', policyError);
    } else {
        console.log(`Found ${policies.length} policies on 'organizations':`);
        policies.forEach(p => console.log(` - ${p.policyname} (Permissive: ${p.permissive}, Roles: ${p.roles})`));
    }

    console.log('\n--- Checking RLS Enabled Status ---');
    const { data: tables, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'organizations')
        .eq('schemaname', 'public');
    // pg_tables doesn't show RLS status directly usually.
    // query pg_class? 
    // Simplified: Just try to query with ANON key.

    console.log('\n--- Checking Organizations (Anon Client) ---');
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: anonOrgs, error: anonError } = await anonClient.from('organizations').select('*');
    if (anonError) console.error('Error fetching orgs (Anon):', anonError);
    else {
        console.log(`Found ${anonOrgs.length} organizations (Anon users).`);
    }

}

main();
