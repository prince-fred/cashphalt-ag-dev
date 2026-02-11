
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function inspectProfile() {
    // Assuming the user is likely 'prince@aifred.io' based on previous logs, or I can list all profiles.

    console.log('Fetching profiles...')
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Profiles found:', profiles)
}

inspectProfile()
