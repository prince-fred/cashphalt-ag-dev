import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const { data } = await supabase.from('session_transactions').select('*')
    if (data) {
        const found = data.filter(r => JSON.stringify(r).includes('1T4XfwBdHekq8DeNXGJ9rcHs'))
        console.log("Found in session_transactions:", found)
    }
}
run()
