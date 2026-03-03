import { parse, addDays, isBefore } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const timezone = 'America/New_York'
const startTime = new Date()

// Simulate backend calculation
const zonedNow = toZonedTime(startTime, timezone)
const ruleEndTime = '15:00:00' // 3 PM
const targetTime = parse(ruleEndTime, 'HH:mm:ss', zonedNow)

let targetEnd = targetTime
if (isBefore(targetEnd, zonedNow)) {
    targetEnd = addDays(targetEnd, 1)
}

const diffMs = targetEnd.getTime() - zonedNow.getTime()
const effectiveDurationHours = diffMs / (1000 * 60 * 60)

console.log("Zoned Now:", zonedNow.toString())
console.log("Target End:", targetEnd.toString())
console.log("Effective Duration Hours:", effectiveDurationHours)
console.log("Effective Duration Minutes:", effectiveDurationHours * 60)

// Simulate frontend display
const durationMinutes = effectiveDurationHours * 60
const displayDate = new Date(Date.now() + durationMinutes * 60 * 1000)
console.log("Browser Start Date (Now):", new Date().toString())
console.log("Browser Display Date:", displayDate.toString())

