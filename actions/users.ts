'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function fixUserForProperty(propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const adminClient = createAdminClient()

    // 1. Get Property's Organization
    const { data: property, error: propError } = await adminClient
        .from('properties')
        .select('organization_id')
        .eq('id', propertyId)
        .single()

    if (propError || !property) {
        throw new Error('Property not found')
    }

    // 2. Set User's Profile to match Organization
    const { error: updateError } = await adminClient
        .from('profiles')
        .upsert({
            id: user.id,
            organization_id: property.organization_id,
            role: 'admin',
            email: user.email!,
            updated_at: new Date().toISOString()
        })

    if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    revalidatePath('/admin')
    return { success: true, organizationId: property.organization_id }
}

export async function inspectUserAndProperty(propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const adminClient = createAdminClient()

    // 1. Get User Profile
    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Get Property
    const { data: property, error: propError } = await adminClient
        .from('properties')
        .select('id, organization_id, name')
        .eq('id', propertyId)
        .single()

    if (propError || !property) {
        throw new Error('Property not found')
    }

    const match = profile?.organization_id === property.organization_id && (profile?.role === 'admin' || profile?.role === 'property_owner')

    return {
        user: {
            id: user.id,
            email: user.email,
            organization_id: profile?.organization_id,
            role: profile?.role
        },
        property: {
            id: property.id,
            organization_id: property.organization_id,
            name: property.name
        },
        match
    }
}
