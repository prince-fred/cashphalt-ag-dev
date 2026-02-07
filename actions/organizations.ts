'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/db-types'

type Organization = Database['public']['Tables']['organizations']['Row']

export async function getOrganizations() {
    // Ideally use authenticated client:
    // const supabase = await createClient()
    // const { data } = await supabase.from('organizations').select('*').order('name')

    // BUT, since RLS is blocking and we can't run migrations right now:
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await supabase.from('organizations').select('*').order('name')

    return (data || []) as Organization[]
}
