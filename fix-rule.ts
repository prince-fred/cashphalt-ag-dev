import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: true })
        .eq('id', '6fcea3c9-9762-442a-a65b-5772adb60367')

    console.log("Updated active status:", error ? error : "Success");
}

run()
