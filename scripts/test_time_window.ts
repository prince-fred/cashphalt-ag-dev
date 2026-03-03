import { parse, isBefore, isAfter, set } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

const now = new Date() // 2026-03-02T08:21:15-05:00
const timezone = 'America/New_York'
const zonedDate = toZonedTime(now, timezone)

console.log('Now (UTC):', now.toISOString())
console.log('Zoned Date:', formatInTimeZone(now, timezone, 'yyyy-MM-dd HH:mm:ssXXX'))

const ruleStart = parse('16:00:00', 'HH:mm:ss', zonedDate)
const ruleEnd = parse('12:00:00', 'HH:mm:ss', zonedDate)

console.log('Rule Start (Today):', ruleStart.toString())
console.log('Rule End (Today):', ruleEnd.toString())

console.log('Is Overnight Window?', isBefore(ruleEnd, ruleStart))

if (isBefore(ruleEnd, ruleStart)) {
    // Overnight window
    console.log('Is Zoned Date before Start?', isBefore(zonedDate, ruleStart))
    console.log('Is Zoned Date after End?', isAfter(zonedDate, ruleEnd))
    
    if (isBefore(zonedDate, ruleStart) && isAfter(zonedDate, ruleEnd)) {
        console.log('RESULT: FALSE (Not in window)')
    } else {
        console.log('RESULT: TRUE (In window)')
    }
}
