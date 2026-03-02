require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_PROD_SECRET_KEY);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestProdSession() {
    console.log("Fetching the latest session for Wyndham Garden Duluth...");

    // 1. Get Property ID
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .ilike('name', '%wyndham%')
        .single();

    if (propError || !property) {
        console.error("Property not found or error:", propError);
        return;
    }
    console.log(`Found Property: ${property.name} (${property.id})`);

    // 2. Get the *very latest* session
    const { data: sessions, error: sessionError } = await supabase
        .from('sessions')
        .select('id, start_time, total_price_cents, payment_intent_id, status, vehicle_plate')
        .eq('property_id', property.id)
        .order('start_time', { ascending: false })
        .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
        console.error("Session Error or no sessions found:", sessionError);
        return;
    }

    const session = sessions[0];
    console.log(`\n--- Latest Session ---`);
    console.log(`Session ID: ${session.id}`);
    console.log(`Vehicle Plate: ${session.vehicle_plate}`);
    console.log(`Start Time: ${session.start_time}`);
    console.log(`Payment Intent ID: ${session.payment_intent_id}`);
    console.log(`Status: ${session.status}`);

    if (!session.payment_intent_id) {
        console.log("No Payment Intent ID found for this session.");
        return;
    }

    // 3. Query Stripe Production API
    console.log("\n--- Querying Stripe Production API ---");
    try {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent_id);
        console.log(`Stripe Amount: ${pi.amount}`);
        console.log(`Stripe Status: ${pi.status}`);

        console.log(`Application Fee Amount: ${pi.application_fee_amount !== null ? pi.application_fee_amount : 'FAILED (null)'}`);
        console.log(`Transfer Data Destination: ${pi.transfer_data ? pi.transfer_data.destination : 'FAILED (null)'}`);

        if (pi.latest_charge) {
            const charge = await stripe.charges.retrieve(pi.latest_charge);
            console.log(`Charge ID: ${charge.id}`);
            console.log(`Transfer ID (from charge): ${charge.transfer || 'None'}`);
        } else {
            console.log("No latest charge found on the payment intent.");
        }

    } catch (e) {
        console.error(`Error fetching PI from Stripe: ${e.message}`);
    }
}

checkLatestProdSession();
