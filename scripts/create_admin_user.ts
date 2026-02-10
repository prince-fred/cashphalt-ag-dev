import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
    console.error('Usage: npx tsx scripts/create_admin_user.ts <email> <password>')
    process.exit(1)
}

async function createAdmin() {
    console.log(`Creating admin user: ${email}`)

    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' }
    })

    if (error) {
        console.error('Error creating user:', error.message)
        return
    }

    console.log('User created:', user.user.id)

    // Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: user.user.id,
            email: email,
            role: 'admin',
            full_name: 'Admin User'
        })

    if (profileError) {
        console.error('Error creating profile:', profileError.message)
    } else {
        console.log('Profile created successfully with ADMIN role.')
    }
}

createAdmin()
