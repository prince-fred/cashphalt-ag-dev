import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { isPast } from 'date-fns'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
    const now = new Date().toISOString()
    console.log("Current time (ISO):", now)

    const { data, error } = await supabase
        .from('sessions')
        .select('id, status, end_time_current, vehicle_plate')
        .eq('status', 'ACTIVE')
        .gt('end_time_current', now)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log(`Found ${data.length} sessions matching ACTIVE and gt(${now})`)
    data.forEach(s => {
        const isActuallyExpired = isPast(new Date(s.end_time_current))
        console.log(`- ${s.vehicle_plate}: end_time=${s.end_time_current}, isPast=${isActuallyExpired}`)
    })
}
check()
