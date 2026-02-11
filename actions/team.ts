'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMember(email: string, role: 'property_owner' | 'staff', organizationId: string) {
    // 1. Check permissions (Must be owner or admin of the org)
    // For MVP transparency, let's assume the UI enforces this via RLS on the page level,
    // but good to check here.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Verify inviter is part of the org and has authority
    const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!inviterProfile || inviterProfile.organization_id !== organizationId) {
        throw new Error('You do not have permission to invite to this organization')
    }

    if (!['admin', 'property_owner'].includes(inviterProfile.role)) {
        throw new Error('Only owners can invite members')
    }

    // 2. Use Admin Client to Invite
    const adminSupabase = createAdminClient()

    // Check if user already exists? 
    // inviteUserByEmail will handle this mostly, but if they exist in another org that's complex.
    // For MVP: assume email = unique user.

    const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
            organization_id: organizationId,
            role: role, // Metadata for trigger to pick up?
            full_name: '' // Can't set name yet
        }
    })

    if (error) {
        console.error('Invite Error:', error)
        throw new Error(error.message)
    }

    // 3. Manually create/update profile if trigger doesn't coverage it?
    // Our trigger `handle_new_user` only runs on `INSERT` to auth.users.
    // `inviteUserByEmail` DOES create a user row, so trigger should fire.
    // However, we need to ensure the trigger sets the `organization_id` correctly from metadata.

    // Let's ensure the profile is set correctly just in case.
    if (data.user) {
        // Upsert profile
        await adminSupabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            organization_id: organizationId,
            role: role,
            updated_at: new Date().toISOString()
        })
    }

    revalidatePath('/admin/settings/team')
    return { success: true }
}

export async function removeTeamMember(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify permission
    const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!inviterProfile || !['admin', 'property_owner'].includes(inviterProfile.role)) {
        throw new Error('Unauthorized')
    }

    // Target user must belong to same org
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single()

    if (!targetProfile || targetProfile.organization_id !== inviterProfile.organization_id) {
        throw new Error('Target user not in your organization')
    }

    // Prevent removing self?
    if (userId === user.id) {
        throw new Error('Cannot remove yourself')
    }

    // Use Admin to delete user
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.auth.admin.deleteUser(userId)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/settings/team')
    return { success: true }
}
