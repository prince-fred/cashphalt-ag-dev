'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'
import { Database } from '@/db-types'

type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']
type Property = Database['public']['Tables']['properties']['Row']

export async function getProperties() {
    const supabase = await createClient()
    const { data } = await (supabase.from('properties') as any).select('*').order('created_at', { ascending: false })
    return (data || []) as Property[]
}

export async function getProperty(id: string) {
    const supabase = await createClient()
    const { data } = await (supabase.from('properties') as any).select('*').eq('id', id).single()
    return data as Property
}

export async function createProperty(data: any) {
    return upsertProperty(data)
}

export async function updateProperty(id: string, data: any) {
    // data should ideally be typed, but for now we trust the client logic or validate here
    return upsertProperty({ ...data, id })
}

export async function upsertProperty(data: PropertyInsert | PropertyUpdate) {
    const supabase = await createClient()
    // For MVP, hardcoding organization_id if creating new, 
    // normally you'd get this from the logged in user's context.
    // Fetching the first org for now if org_id is missing.
    if (!data.organization_id) {
        const { data: org } = await (supabase.from('organizations') as any).select('id').single()
        if (org) data.organization_id = org.id
        else throw new Error("No organization found")
    }

    const { error } = await (supabase.from('properties') as any).upsert(data)

    if (error) {
        console.error('Upsert Property Error:', error)
        throw new Error('Failed to save property')
    }

    revalidatePath('/admin/properties')
    revalidatePath(`/admin/properties/${data.id}`)
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
