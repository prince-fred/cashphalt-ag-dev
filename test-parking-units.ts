import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
    const { data: cols, error } = await supabase.from('parking_units').select('*').limit(1)
    console.log("PARKING UNITS COLUMNS:", cols && cols.length > 0 ? Object.keys(cols[0]) : "Empty or error", error?.message)
}

check()
