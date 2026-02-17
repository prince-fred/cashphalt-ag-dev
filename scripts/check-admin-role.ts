
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser(email: string) {
    console.log(`Checking user: ${email}`)

    // 1. Get User ID from Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error('User not found in Auth')
        return
    }

    console.log(`User ID: ${user.id}`)

    // 2. Get Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError)
    } else {
        console.log('Profile:', profile)
    }

    // 3. Check properties count (as admin service role)
    const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true })
    console.log(`Total properties in DB: ${count}`)
}

checkUser('prince@aifred.io')
