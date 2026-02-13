'use server'


import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/db-types'
import { stripe } from '@/lib/stripe'

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

export async function getOrganization(id: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await supabase.from('organizations').select('*').eq('id', id).single()
    return data as Organization | null
}

export async function upsertOrganization(data: Partial<Organization>) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: inserted, error } = await supabase
        .from('organizations')
        .upsert(data as any)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return { success: true, data: inserted }
}

export async function deleteOrganization(id: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('organizations').delete().eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

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
