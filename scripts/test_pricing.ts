import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { getParkingPrice } from '../actions/parking'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug() {
    console.log("Testing 24 hours:")
    const res1 = await getParkingPrice(PROPERTY_ID, 24, undefined, undefined, UNIT_ID)
    console.log(res1)

    console.log("\nTesting 48 hours:")
    const res2 = await getParkingPrice(PROPERTY_ID, 48, undefined, undefined, UNIT_ID)
    console.log(res2)
}

debug().catch(console.error)
