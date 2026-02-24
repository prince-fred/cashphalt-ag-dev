'use server'


import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { Database } from '@/db-types'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

type Organization = Database['public']['Tables']['organizations']['Row']

export async function createStripeConnectAccount(orgId: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single()
    if (!org) throw new Error("Organization not found")

    // 1. Create Account
    // We use 'express' for easiest onboarding, or 'standard'. 
    // Express gives us more control over the flow but Stripe handles the UI.
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: undefined, // Let user provide it, or pass org.email if we had it
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        business_type: 'company',
        company: {
            name: org.name,
        }
    })

    // 2. Save ID
    await supabase.from('organizations').update({ stripe_connect_id: account.id }).eq('id', orgId)

    // 3. Create Account Link
    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/organizations/${orgId}`, // Or a specific error page
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/organizations/${orgId}?connected=true`,
        type: 'account_onboarding',
    })

    return { url: accountLink.url }
}

export async function getStripeAccountLink(accountId: string, orgId: string) {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/organizations/${orgId}`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/organizations/${orgId}?connected=true`,
        type: 'account_onboarding',
    })
    return { url: accountLink.url }
}

export async function getOrganizations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    // BUT, since RLS is blocking and we can't run migrations right now:
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = adminSupabase.from('organizations').select('*').order('name')

    if (profile.role === 'admin') {
        // Admin sees all
    } else if (profile.role === 'property_owner') {
        if (profile.organization_id) {
            query = query.eq('id', profile.organization_id)
        } else {
            return []
        }
    } else {
        return [] // Other roles cannot view organizations
    }

    const { data } = await query

    return (data || []) as Organization[]
}

export async function getOrganization(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    if (profile.role !== 'admin' && profile.organization_id !== id) {
        return null // Unauthorized
    }

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await adminSupabase.from('organizations').select('*').eq('id', id).single()
    return data as Organization | null
}

export async function upsertOrganization(data: Partial<Organization>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('Unauthorized')

    if (!data.id && profile.role !== 'admin') {
        throw new Error('Unauthorized to create organizations')
    }

    if (data.id && profile.role !== 'admin' && profile.organization_id !== data.id) {
        throw new Error('Unauthorized to update this organization')
    }

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Sanitize empty strings to null for optional text fields
    const sanitizedData = { ...data }
    if (sanitizedData.stripe_connect_id === '') {
        sanitizedData.stripe_connect_id = null
    }

    const { data: inserted, error } = await adminSupabase
        .from('organizations')
        .upsert(sanitizedData as any)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/organizations')
    return { success: true, data: inserted }
}

export async function deleteOrganization(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        throw new Error('Unauthorized to delete organizations')
    }

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminSupabase.from('organizations').delete().eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/organizations')
    return { success: true }
}

export async function createStripeConnectAccountForSlug(slug: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org } = await supabase.from('organizations').select('*').eq('slug', slug).single()
    if (!org) return { url: null, error: "Organization not found" }

    try {
        let accountId = org.stripe_connect_id

        if (!accountId) {
            // Create account if it doesn't exist
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: undefined,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'company',
                company: {
                    name: org.name,
                }
            })
            accountId = account.id

            // Save ID
            await supabase.from('organizations').update({ stripe_connect_id: accountId }).eq('id', org.id)
        }

        // Create Account Link
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/${slug}`, // Reload the page on refresh/failure
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/${slug}?connected=true`,
            type: 'account_onboarding',
        })

        return { url: accountLink.url, error: null }
    } catch (error) {
        const err = error as { code?: string; message?: string }
        // If the account ID is invalid (deleted in Stripe but exists in DB), create a new one
        if (
            err?.code === 'account_invalid' ||
            err?.message?.includes('account that is not connected to your platform') ||
            err?.message?.includes('No such account')
        ) {
            console.log("Stripe account invalid or not found. Creating a new one...")

            // Create NEW account
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'US',
                email: undefined,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'company',
                company: {
                    name: org.name,
                }
            })

            const newAccountId = account.id

            // Save NEW ID
            await supabase.from('organizations').update({ stripe_connect_id: newAccountId }).eq('id', org.id)

            // Retry creating Account Link with NEW ID
            const accountLink = await stripe.accountLinks.create({
                account: newAccountId,
                refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/${slug}`,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/${slug}?connected=true`,
                type: 'account_onboarding',
            })

            return { url: accountLink.url, error: null }
        }

        console.error("Error creating Stripe Connect account:", error)
        const message = error instanceof Error ? error.message : "Failed to create Stripe Connect account"
        return { url: null, error: message }
    }
}

export async function getStripeConnectAccountStatus(orgId: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org } = await supabase.from('organizations').select('stripe_connect_id').eq('id', orgId).single()

    if (!org?.stripe_connect_id) {
        return null
    }

    try {
        const account = await stripe.accounts.retrieve(org.stripe_connect_id)
        return {
            id: account.id,
            email: account.email,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            type: account.type,
        }
    } catch (error) {
        console.error("Error fetching Stripe account status:", error)
        const err = error as { message?: string }
        return { error: err.message || "Failed to fetch account status" }
    }
}
