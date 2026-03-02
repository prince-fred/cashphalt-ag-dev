import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    // search sessions for exactly 1300 cents
    const { data: sessions } = await supabase
        .from('sessions')
        .select('*, properties(*)')
        .eq('total_price_cents', 1300)
        .order('created_at', { ascending: false })
        .limit(10)

    if (sessions && sessions.length > 0) {
        console.log(`Found ${sessions.length} sessions for $13:`)
        for (const s of sessions) {
            console.log(`- Session ID: ${s.id}, created_at: ${s.created_at}, status: ${s.status}`)
            console.log(`  stripe_session_id: ${s.stripe_checkout_session_id}`)
            console.log(`  payment_intent_id: ${s.payment_intent_id}`)
        }
    } else {
        console.log("No sessions found for 1300 cents.")
    }

    // search session_transactions for exactly 1300 cents
    const { data: txs } = await supabase
        .from('session_transactions')
        .select('*')
        .eq('amount_cents', 1300)
        .order('created_at', { ascending: false })
        .limit(10)

    if (txs && txs.length > 0) {
        console.log(`Found ${txs.length} session_transactions for $13:`)
        for (const t of txs) {
            console.log(`- Tx ID: ${t.id}, session_id: ${t.session_id}, created_at: ${t.created_at}`)
            console.log(`  payment_intent_id: ${t.payment_intent_id}`)
        }
    } else {
        console.log("No transactions found for 1300 cents.")
    }
}
run()
