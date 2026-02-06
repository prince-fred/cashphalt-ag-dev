import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import twilio from 'twilio'

// POST /api/webhooks/twilio
// Twilio sends a POST request with application/x-www-form-urlencoded body
export async function POST(req: Request) {
    const formData = await req.formData()
    const body = formData.get('Body')?.toString().trim()
    const from = formData.get('From')?.toString()

    console.log(`[Twilio] Received SMS from ${from}: ${body}`)

    if (!body) {
        return new Response('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        })
    }

    const MessagingResponse = twilio.twiml.MessagingResponse
    const twiml = new MessagingResponse()

    // 1. Setup Supabase
    const supabase = await createClient()

    // 2. Find Property by Slug (which we treat as the "Code")
    // Case-insensitive search on slug
    const { data: property, error } = await supabase
        .from('properties')
        .select('id, name, slug')
        .ilike('slug', body)
        .single()

    if (error || !property) {
        // Not found
        console.log(`[Twilio] Property not found for code: ${body}`)
        twiml.message(`Sorry, we couldn't find a parking location with code "${body}". Please check the signage and try again.`)
    } else {
        // Found
        console.log(`[Twilio] Found property: ${property.name} (${property.id})`)
        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cashphalt.com'}/pay/${property.id}`
        twiml.message(`Welcome to ${property.name}! Click here to pay for parking: ${link}`)
    }

    return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
    })
}
