import { calculatePrice } from './lib/parking/pricing'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function test() {
    // Try to trigger the "Could not fetch pricing rules" error
    // The error usually happens when timezone is provided, so it goes to the second block
    try {
        await calculatePrice('d290f1ee-6c54-4b01-90e6-d701748f0851', new Date(), 2, undefined, 'America/New_York', false, undefined)
        console.log("Success")
    } catch (e: any) {
        console.error("Failed:", e)
    }
}
test()
