import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'

async function debug() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, start_time, end_time_initial, end_time_current, created_at, total_price_cents')
        .eq('property_id', PROPERTY_ID)
        .order('created_at', { ascending: false })
        .limit(5)
    
    if (error) {
        console.error(error)
        return
    }

    sessions.forEach(s => {
        const start = new Date(s.start_time).getTime()
        const end = new Date(s.end_time_current).getTime()
        const diffHours = (end - start) / (1000 * 60 * 60)
        console.log(`Session ${s.id.slice(0, 8)} | ${new Date(s.created_at).toLocaleString()} | Diff: ${diffHours} hrs | End Time: ${new Date(s.end_time_current).toLocaleString()}`)
    })
}

debug().catch(console.error)
