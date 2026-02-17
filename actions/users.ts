'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper to get admin client (service role)
function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
    }
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export type UserRole = 'admin' | 'property_owner' | 'staff'

export interface InviteUserParams {
    email: string
    role: UserRole
    organizationId?: string
    propertyIds?: string[] // For staff/property_owner specific assignments
    password?: string // Optional: for manual creation without email invite
}

export async function inviteUser(params: InviteUserParams) {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    // 1. Check current user permissions
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
        return { error: 'Not authenticated' }
    }

    // Determine if current user can invite this role
    // Fetch current user profile to check role
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

    if (!currentProfile) {
        return { error: 'Profile not found' }
    }

    // Logic: Only Admins can invite Admins. Owners can invite Staff/Owners to their org.
    if (params.role === 'admin' && currentProfile.role !== 'admin') {
        return { error: 'Only admins can invite other admins' }
    }

    if (currentProfile.role === 'property_owner' && params.organizationId !== currentProfile.organization_id) {
        // Force organizationId to be the owner's org
        params.organizationId = currentProfile.organization_id || undefined
    }

    // 2. Create User (Invite or Manual)
    let newUserId: string

    if (params.password) {
        // Manual creation - strictly skips sending email if email_confirm is true
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email: params.email,
            password: params.password,
            email_confirm: true // Auto-confirm
        })

        if (createError) {
            return { error: `Failed to create user: ${createError.message}` }
        }
        newUserId = userData.user.id
    } else {
        // Standard Invite via Supabase Auth
        // This sends an email if the user doesn't exist.
        const { data: authData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(params.email)

        if (inviteError) {
            console.error('Invite error:', inviteError)
            return { error: `Failed to invite user: ${inviteError.message}` }
        }
        newUserId = authData.user.id
    }

    // 3. Create/Update Profile
    // We use adminClient for profile update to bypass RLS if needed (or just to be safe)
    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            id: newUserId,
            email: params.email,
            role: params.role,
            organization_id: params.organizationId || null,
            updated_at: new Date().toISOString()
        })

    if (profileError) {
        return { error: `Failed to create profile: ${profileError.message}` }
    }

    // 4. Assign Properties (Only for Staff)
    // Property Owners have access via organization_id and don't need property_members entries (which are restricted to staff/manager/enforcement)
    if (params.role === 'staff' && params.propertyIds && params.propertyIds.length > 0) {
        const propertyMembers = params.propertyIds.map(propId => ({
            user_id: newUserId,
            property_id: propId,
            role: 'staff' // Explicitly set to 'staff' to satisfy check constraint
        }))

        // Delete existing? Or just upsert?
        // unique(user_id, property_id) constraint handles duplicates but if we want to *replace* assignments we should delete others?
        // For now, let's just insert.
        const { error: propError } = await adminClient
            .from('property_members')
            .upsert(propertyMembers, { onConflict: 'user_id, property_id' })

        if (propError) {
            return { error: `Failed to assign properties: ${propError.message}` }
        }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function getUsers() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            organization:organizations(id, name),
            property_members(
                property:properties(id, name)
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    return data
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    // 1. Verify permissions
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Not authenticated' }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

    if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'property_owner')) {
        return { error: 'Unauthorized' }
    }

    // 2. Fetch target user to verify
    const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!targetProfile) return { error: 'User not found' }

    if (currentProfile.role === 'property_owner') {
        if (targetProfile.organization_id !== currentProfile.organization_id) {
            return { error: 'Unauthorized to delete this user' }
        }
    }

    // 3. Delete from Auth (cascades to public.profiles usually if set up, but we use admin deleteUser)
    // Note: Standard Supabase Auth deleteUser does NOT automatically delete purely custom tables like 'profiles' unless FK cascade is set.
    // We verified 'on delete cascade' in the property_members migration, usually profiles is linked to auth.users with cascade too.
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
        return { error: `Failed to delete user: ${error.message}` }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUser(userId: string, params: { role?: UserRole, propertyIds?: string[] }) {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    // 1. Verify permissions
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Not authenticated' }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

    if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'property_owner')) {
        return { error: 'Unauthorized' }
    }

    // 2. Update Profile Role
    if (params.role) {
        const { error: roleError } = await adminClient
            .from('profiles')
            .update({ role: params.role })
            .eq('id', userId)

        if (roleError) return { error: `Failed to update role: ${roleError.message}` }
    }

    // 3. Update Properties (Replace existing)
    if (params.propertyIds !== undefined) {
        // Delete existing
        await adminClient.from('property_members').delete().eq('user_id', userId)

        // Insert new
        if (params.propertyIds.length > 0) {
            const newMembers = params.propertyIds.map(pid => ({
                user_id: userId,
                property_id: pid,
                role: params.role || 'staff' // Fallback, but strictly should be current role if possible.
                // ideally we should fetch current user role if not passed, but let's assume UI passes it or we fetch it.
                // optimization: just pass role in params always from UI.
            }))

            const { error: propError } = await adminClient
                .from('property_members')
                .insert(newMembers)

            if (propError) return { error: `Failed to update properties: ${propError.message}` }
        }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function resendInvite(email: string) {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    // 1. Verify permissions
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Not authenticated' }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

    if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'property_owner')) {
        return { error: 'Unauthorized' }
    }

    // 2. Resend invite
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email)

    if (error) {
        return { error: `Failed to resend invite: ${error.message}` }
    }

    return { success: true }
}

export async function sendPasswordReset(email: string) {
    const supabase = await createClient()
    const adminClient = getAdminClient()

    // 1. Verify permissions
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Not authenticated' }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

    if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'property_owner')) {
        return { error: 'Unauthorized' }
    }

    // 2. Send Reset Email
    const { error } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`
    })

    if (error) {
        return { error: `Failed to send reset email: ${error.message}` }
    }

    return { success: true }
}
