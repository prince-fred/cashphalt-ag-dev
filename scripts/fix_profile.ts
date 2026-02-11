
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fixProfile() {
    // 1. Get user
    const userEmail = 'prince@aifred.io'
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single()

    if (userError || !user) {
        console.error('User not found:', userError)
        return
    }

    // 2. Get Organization
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
        .single() // Assume just one org for now

    if (orgError) {
        console.error('Org error:', orgError)
        // If no org, create one
        console.log('No org found, creating one...')
        const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert({
                name: 'Default Organization',
                slug: 'default-org'
            })
            .select()
            .single()

        if (createError) {
            console.error('Failed to create org:', createError)
            return
        }

        console.log('Created Org:', newOrg.id)
        await linkUser(user.id, newOrg.id)
    } else {
        console.log('Found Org:', orgs.id)
        await linkUser(user.id, orgs.id)
    }
}

async function linkUser(userId: string, orgId: string) {
    const { error } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', userId)

    if (error) console.error('Link Error:', error)
    else console.log('Successfully linked user to org!')
}

fixProfile()
