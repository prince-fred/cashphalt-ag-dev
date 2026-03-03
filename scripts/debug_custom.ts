import { getCustomProducts } from '../actions/parking'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debugCustomProducts() {
    console.log(`Fetching custom products for ${PROPERTY_ID} unit ${UNIT_ID}...`)
    const products = await getCustomProducts(PROPERTY_ID, UNIT_ID)
    console.log(`Found ${products?.length || 0} products.`)
    console.dir(products, { depth: null })
}

debugCustomProducts().catch(console.error)
