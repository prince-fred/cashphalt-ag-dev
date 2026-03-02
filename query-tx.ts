import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Fetching tables...")
    const { data: tables, error } = await supabase.rpc('get_tables')
    if (tables) console.log('Tables via RPC:', tables)

    // Check known tables
    const common = ['sessions', 'payments', 'stripe_sessions', 'charges', 'orders', 'bookings', 'transactions', 'stripe_events']
    for (const t of common) {
        const { data, error } = await supabase.from(t).select('*').limit(1)
        if (!error && data) {
            console.log(`Table exists: ${t}`)
            // Now search for the ID
            const { data: records, error: err2 } = await supabase.from(t).select('*')
            if (records) {
                const found = records.filter(r => JSON.stringify(r).includes('1T4XfwBdHekq8DeNXGJ9rcHs'))
                if (found.length) {
                    console.log(`\n=== FOUND IN TABLE ${t} ===\n`, JSON.stringify(found, null, 2))
                }
            }
        }
    }
    console.log("Done checking common tables.")
}
run()
