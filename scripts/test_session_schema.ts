import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debug() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: session } = await supabase.from('sessions').select('*').limit(1).single()
    
    console.log(Object.keys(session!))
}

debug().catch(console.error)
