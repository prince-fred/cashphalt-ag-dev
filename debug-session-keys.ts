
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .limit(1)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error:', error)
        return
    }

    if (sessions && sessions.length > 0) {
        console.log('Session Keys:', Object.keys(sessions[0]))
        console.log('Session Data:', sessions[0])
    } else {
        console.log('No sessions found.')
    }
}

main()
