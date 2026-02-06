
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInsert() {
    console.log('Testing insertion into session_transactions...')

    // 1. Get a valid session (any session)
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1)
        .single()

    if (sessionError || !session) {
        console.error('Cannot find a session to link transaction to.', sessionError)
        return
    }

    console.log('Found session:', session.id)

    // 2. Try Insert
    const { data, error } = await supabase
        .from('session_transactions')
        .insert({
            session_id: session.id,
            payment_intent_id: 'test_intent_' + Date.now(),
            amount_cents: 100,
            status: 'succeeded',
            type: 'TEST'
        })
        .select()

    if (error) {
        console.error('INSERT FAILED:', error)
    } else {
        console.log('INSERT SUCCESS:', data)
    }
}

testInsert()
