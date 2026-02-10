
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS warning_sent boolean DEFAULT false;
`

async function run() {
    console.log('Applying migration...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }) // Try RPC first if enabled

    // If RPC exec_sql doesn't exist (common), we might need another way.
    // But standard supabase js client doesn't support raw SQL execution directly unless there is a function.
    // Check if there's a function 'exec_sql' or similar?

    if (error) {
        console.log("RPC exec_sql failed, trying direct SQL via pg (not available in client).")
        console.log("Error:", error)

        // Fallback: Use the 'postgres' library if available? No, not installed.
        // Fallback 2: Check if there is a way to run sql via rest? No.

        // Check if 'apply_policies.sql' file exists in root, maybe user has a pattern?
        // 'check-db.ts' exists. Let's see how it connects.
    } else {
        console.log('Migration applied via RPC!')
    }
}

// Actually, best way without direct SQL access is to trust the user to apply migrations OR use a dashboard.
// But wait, the user gave me "SUPABASE_SERVICE_ROLE_KEY".
// I can try to use the REST API to call a function?
// Or I can just continue with the code changes and notify the user to run the SQL.
// BUT I see `check-db.ts`. Let's check it.

run()
