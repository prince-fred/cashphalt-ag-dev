
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS for this check

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
    console.log('Checking organizations...')
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*')
    if (orgError) console.error('Org Error:', orgError)
    else console.table(orgs)

    console.log('\nChecking properties...')
    const { data: props, error: propError } = await supabase.from('properties').select('*')
    if (propError) console.error('Prop Error:', propError)
    else console.table(props)
}

checkData()
