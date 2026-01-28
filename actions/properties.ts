'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'
import { Database } from '@/database.types'

type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export async function getProperties() {
    const supabase = await createClient()
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    return data || []
}

export async function getProperty(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('properties').select('*').eq('id', id).single()
    return data
}

export async function upsertProperty(data: PropertyInsert | PropertyUpdate) {
    const supabase = await createClient()
    // For MVP, hardcoding organization_id if creating new, 
    // normally you'd get this from the logged in user's context.
    // Fetching the first org for now if org_id is missing.
    if (!data.organization_id) {
        const { data: org } = await supabase.from('organizations').select('id').single()
        if (org) data.organization_id = org.id
        else throw new Error("No organization found")
    }

    const { error } = await supabase.from('properties').upsert(data)

    if (error) {
        console.error('Upsert Property Error:', error)
        throw new Error('Failed to save property')
    }

    revalidatePath('/admin/properties')
    return { success: true }
}

export async function generateQrCode(url: string) {
    try {
        const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 })
        return dataUrl
    } catch (err) {
        console.error(err)
        return null
    }
}
