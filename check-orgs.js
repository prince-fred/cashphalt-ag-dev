
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkOrgs() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.from('organizations').select('*');
    if (error) {
        console.error('Error fetching orgs:', error);
    } else {
        console.log('Organizations found:', data);
        console.log('Count:', data.length);
    }
}

checkOrgs();
