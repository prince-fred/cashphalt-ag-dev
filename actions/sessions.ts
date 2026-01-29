'use server'

import { createClient } from '@/utils/supabase/server'

export async function getSessions() {
    const supabase = await createClient()

    // Fetch sessions with property details
    // We use a join here assuming foreign key is set up correctly
    const { data, error } = await supabase
        .from('sessions')
        .select(`
            *,
            properties (
                name,
                slug
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sessions:', error)
        return []
    }

    // Flatten/map data if necessary, or return as is
    return data
}
