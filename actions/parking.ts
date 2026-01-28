'use server'

import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

export const getPropertyBySlugOrId = cache(async (identifier: string) => {
    const supabase = await createClient()

    // Try ID first (UUID regex)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    let query = supabase.from('properties').select('*')

    if (isUuid) {
        query = query.eq('id', identifier)
    } else {
        query = query.eq('slug', identifier)
    }

    const { data, error } = await query.single()

    if (error) {
        return null
    }

    return data
})
