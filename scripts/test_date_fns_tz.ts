import { toZonedTime } from 'date-fns-tz'
import { parse } from 'date-fns'

const nowUtc = new Date('2026-03-02T12:00:00Z') // 12 PM UTC = 7 AM EST
const timezone = 'America/New_York'
const zonedNow = toZonedTime(nowUtc, timezone)

console.log("Original Date UTC:", nowUtc.toISOString())
console.log("Zoned Date UTC representation:", zonedNow.toISOString())
console.log("Original getTime():", nowUtc.getTime())
console.log("Zoned getTime():", zonedNow.getTime())
console.log("Difference in hours:", (nowUtc.getTime() - zonedNow.getTime()) / (1000 * 60 * 60))

const targetTime = parse('15:00:00', 'HH:mm:ss', zonedNow)
console.log("\nTarget Time UTC representation:", targetTime.toISOString())

const diffMs = targetTime.getTime() - zonedNow.getTime()
console.log("Diff Hours (calculated):", diffMs / (1000 * 60 * 60))

// Now compare to what we ACTUALLY want: difference between 15:00 EST and 07:00 EST = 8 hours.
// zoned getTime diff = 8 hours? Let's see.

// Add this duration to original nowUtc to simulate browser Date.now()
const finalBrowserTime = new Date(nowUtc.getTime() + diffMs)
console.log("\nFinal Browser Time UTC:", finalBrowserTime.toISOString())
