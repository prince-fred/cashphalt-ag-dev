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

    // 2. Find Property by location_code
    // Case-insensitive search just in case, though it should be numeric
    const { data: property, error: propError } = await (supabase
        .from('properties') as any)
        .select('id, name')
        .ilike('location_code', body)
        .single()

    if (property) {
        // Found a Property (Zone)
        console.log(`[Twilio] Found property: ${property.name} (${property.id})`)
        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dev.axisparking.io'}/pay/${property.id}`
        twiml.message(`Welcome to ${property.name}! Click here to pay for parking: ${link}`)
    } else {
        // 3. If Property not found, search Parking Units by location_code
        const { data: unit, error: unitError } = await (supabase
            .from('parking_units') as any)
            .select('id, property_id, name')
            .ilike('location_code', body)
            .single()

        if (unit) {
            // Found a Parking Unit (Spot)
            // Fetch the property to get the name for the welcome message
            const { data: unitProp } = await (supabase
                .from('properties') as any)
                .select('name')
                .eq('id', unit.property_id)
                .single()

            const propName = unitProp?.name || 'our parking location'
            console.log(`[Twilio] Found unit: ${unit.name} at ${propName} (${unit.id})`)
            const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dev.axisparking.io'}/pay/${unit.property_id}?unit=${unit.id}`
            twiml.message(`Welcome to ${propName}! Click here to pay for ${unit.name}: ${link}`)
        } else {
            // Not found in either
            console.log(`[Twilio] No location found for code: ${body}`)
            twiml.message(`Sorry, we couldn't find a zone or property with that code. Please check the signage and try again.`)
        }
    }

    return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
    })
}
