
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.STRIPE_SECRET_KEY) {
    console.error("Missing environment variables")
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-12-15.clover',
})

async function checkOrgStatus(orgId: string) {
    console.log(`Checking organization: ${orgId}`)

    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

    if (error || !org) {
        console.error("Organization not found/error:", error)
        return
    }

    console.log(`Found Org: ${org.name} (Slug: ${org.slug})`)
    console.log(`Stored Stripe Connect ID: ${org.stripe_connect_id}`)

    if (!org.stripe_connect_id) {
        console.log("No Stripe Connect ID stored.")
        return
    }

    try {
        const account = await stripe.accounts.retrieve(org.stripe_connect_id)
        console.log("\n--- STRIPE ACCOUNT DETAILS ---")
        console.log(`ID: ${account.id}`)
        console.log(`Type: ${account.type}`)
        console.log(`Email: ${account.email}`)
        console.log(`Charges Enabled: ${account.charges_enabled}`)
        console.log(`Payouts Enabled: ${account.payouts_enabled}`)
        console.log(`Details Submitted: ${account.details_submitted}`)
        console.log(`Requirements:`, JSON.stringify(account.requirements, null, 2))
    } catch (err: any) {
        console.error("Error fetching Stripe account:", err.message)
    }
}

const targetOrgId = process.argv[2] || 'a2b3d865-66f6-4d0c-9816-18d713b9ba3a'
checkOrgStatus(targetOrgId)
