import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
    const { data: cols, error } = await supabase.rpc('get_columns_for_table', { table_name: 'spots' })
    console.log("SPOTS RPC COLUMNS:", cols, error?.message)
    
    // Fallback: try to insert a dummy record and see the error to glean columns
    const { error: insertError } = await supabase.from('spots').insert({ dummy_col: 'test' })
    console.log("INSERT ERROR HINT (often shows columns):", insertError?.message, insertError?.details, insertError?.hint)
}

check()
