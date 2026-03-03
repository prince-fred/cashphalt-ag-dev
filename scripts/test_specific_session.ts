import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debug() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: session, error } = await supabase.from('sessions').select('*').eq('id', '4dcefdd3-62ef-4f1f-a604-c91a6ee81b10').single()
    if (error) console.error(error)
    console.log("Session:", session)
}

debug().catch(console.error)
