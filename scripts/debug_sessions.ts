
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecentSessions() {
    console.log('Fetching last 5 sessions...')
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching sessions:', error)
        return
    }

    if (!sessions || sessions.length === 0) {
        console.log('No sessions found.')
        return
    }

    console.log(`Found ${sessions.length} sessions. Inspecting the most recent ones:`)
    sessions.forEach((session, i) => {
        console.log(`\n[${i}] Session ID: ${session.id}`)
        console.log(`    Created: ${session.created_at}`)
        console.log(`    Status: ${session.status}`)
        console.log(`    Email: ${session.customer_email || '(MISSING)'}`)
        console.log(`    Phone: ${session.customer_phone || '(MISSING)'}`)
        console.log(`    Plate: ${session.vehicle_plate}`)
        console.log(`    PaymentIntent: ${session.payment_intent_id}`)
    })
}

checkRecentSessions()
