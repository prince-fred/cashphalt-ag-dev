require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_PROD_SECRET_KEY); // Using the newly added PROD key

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSessionsAndStripe() {
    console.log("Fetching recent sessions for Wyndham Garden Duluth...");

    const { data: property } = await supabase
        .from('properties')
        .select('id, name')
        .ilike('name', '%wyndham%')
        .single();

    if (!property) {
        console.log("Property not found");
        return;
    }
    console.log(`Found Property: ${property.name} (${property.id})`);

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, start_time, total_price_cents, payment_intent_id, status, vehicle_plate')
        .eq('property_id', property.id)
        .order('start_time', { ascending: false })
        .limit(3);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log(`Found ${sessions.length} recent sessions.`);

    for (const session of sessions) {
        console.log(`\n--- Session ${session.id} (Plate: ${session.vehicle_plate}) ---`);
        console.log(`Start Time: ${session.start_time}`);
        console.log(`Payment Intent ID: ${session.payment_intent_id}`);
        console.log(`Status: ${session.status}`);

        if (!session.payment_intent_id) {
            console.log("No Payment Intent ID for this session.");
            continue;
        }

        try {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent_id);
            console.log(`Stripe Amount: ${pi.amount}`);
            console.log(`Stripe Status: ${pi.status}`);
            console.log(`Application Fee Amount: ${pi.application_fee_amount}`);
            console.log(`Transfer Data: ${JSON.stringify(pi.transfer_data)}`);
            console.log(`On Behalf Of: ${pi.on_behalf_of}`);
            console.log(`Transfer Group: ${pi.transfer_group}`);
            if (pi.latest_charge) {
                const charge = await stripe.charges.retrieve(pi.latest_charge);
                console.log(`Charge ID: ${charge.id}`);
                console.log(`Transfer from Charge: ${charge.transfer}`);
            }
        } catch (e) {
            console.error(`Error fetching PI from Stripe: ${e.message}`);
        }
    }
}

checkSessionsAndStripe();
