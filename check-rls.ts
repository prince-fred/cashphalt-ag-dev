import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    let data, error;
    try {
        const res = await supabase.rpc('get_policies', { table_name: 'pricing_rules' });
        data = res.data;
        error = res.error;
    } catch (e) {
        data = null;
        error = null;
    }
    if (!data) {
        // Fallback to querying pg_policies
        const { data: dbData, error: dbError } = await supabase.from('pg_policies' as any).select('*').eq('tablename', 'pricing_rules');
        console.log("Policies:", JSON.stringify(dbData, null, 2));
    }
}

run()
