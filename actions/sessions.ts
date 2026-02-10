'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/db-types'

type SessionWithProperty = Database['public']['Tables']['sessions']['Row'] & {
    properties: Pick<Database['public']['Tables']['properties']['Row'], 'name' | 'slug'> | null
}

export async function getSessions() {
    const supabase = await createClient()

    // Fetch sessions with property details
    // We use a join here assuming foreign key is set up correctly
    const { data, error } = await (supabase.from('sessions') as any)
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
    return (data || []) as SessionWithProperty[]
}

export async function getSessionByPaymentIntent(paymentIntentId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('sessions') as any)
        .select(`
            *,
            properties (
                name,
                slug,
                allocation_mode
            )
        `)
        .eq('payment_intent_id', paymentIntentId)
        .single()

    if (error) {
        // PGRST116: JSON object requested, multiple (or no) rows returned
        if (error.code === 'PGRST116') {
            console.warn('Session not found for Intent:', paymentIntentId)
            return null
        }
        console.error('Error fetching session by Intent:', error)
        return null
    }

    if (!data) {
        return null
    }

    return data
}
