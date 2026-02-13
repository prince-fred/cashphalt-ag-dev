
import { Resend } from 'resend'
import twilio from 'twilio'

// Initialize clients
const resend = new Resend(process.env.RESEND_API_KEY || 're_build_placeholder')
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID || 'AC_build_placeholder',
    process.env.TWILIO_AUTH_TOKEN || 'auth_build_placeholder'
)

const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER
// Verified domain: p.cashphalt.com
const FROM_EMAIL = 'Cashphalt <receipts@p.cashphalt.com>'

interface SendReceiptParams {
    toEmail?: string | null
    toPhone?: string | null
    plate: string
    propertyName: string
    unitName?: string | null
    amountCents: number // e.g. 500
    endTime: Date
    link: string // e.g. /pay/extend/[sessionId]
}

export async function sendSessionReceipt({ toEmail, toPhone, plate, propertyName, unitName, amountCents, endTime, link }: SendReceiptParams) {
    const formattedPrice = `$${(amountCents / 100).toFixed(2)}`
    const timeString = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const promises = []

    // 1. Send SMS (if provided and configured)
    if (toPhone && FROM_PHONE) {
        let message = `Parking Granted: ${plate} at ${propertyName}`
        if (unitName) message += ` (Spot: ${unitName})`
        message += `.\nexpires at ${timeString}.`

        promises.push(
            twilioClient.messages.create({
                body: message,
                from: FROM_PHONE,
                to: toPhone
            }).catch(err => console.error('[Notification] SMS Failed:', err))
        )
    }

    // 2. Send Email
    if (toEmail) {
        console.log(`[Notification] Sending Email to ${toEmail}`)
        promises.push(
            resend.emails.send({
                from: FROM_EMAIL,
                to: toEmail,
                subject: `Parking Receipt: ${plate}`,
                html: `
                    <h1>Parking Confirmed</h1>
                    <p><strong>Location:</strong> ${propertyName}</p>
                    ${unitName ? `<p><strong>Spot/Zone:</strong> ${unitName}</p>` : ''}
                    <p><strong>Plate:</strong> ${plate}</p>
                    <p><strong>Total:</strong> ${formattedPrice}</p>
                    <p><strong>Expires:</strong> ${timeString}</p>
                `
            }).catch(err => console.error('[Notification] Email Failed:', err))
        )
    }

    await Promise.all(promises)
}

export async function sendExpiryWarning({ toEmail, toPhone, plate, propertyName, unitName, expireTime, link }: { toEmail?: string | null, toPhone?: string | null, plate: string, propertyName: string, unitName?: string | null, expireTime: Date, link: string }) {
    const timeString = expireTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const promises = []

    // SMS
    if (toPhone && FROM_PHONE) {
        let message = `⚠️ Parking Expiring Soon!\nLic: ${plate}\nLoc: ${propertyName}`
        if (unitName) message += ` (Spot: ${unitName})`
        message += `\nExpires: ${timeString}\nExtend now: ${link}`

        promises.push(
            twilioClient.messages.create({
                body: message,
                from: FROM_PHONE,
                to: toPhone
            }).catch(err => console.error('[Notification] Warning SMS Failed:', err))
        )
    }

    // Email
    if (toEmail) {
        console.log(`[Notification] Sending Expiry Warning to ${toEmail}`)
        promises.push(
            resend.emails.send({
                from: FROM_EMAIL,
                to: toEmail,
                subject: `Action Required: Parking Expiring Soon (${plate})`,
                html: `
                    <h1>Parking Expiring Soon</h1>
                    <p>Your parking session at <strong>${propertyName}</strong> ${unitName ? `(Spot: <strong>${unitName}</strong>) ` : ''}for vehicle <strong>${plate}</strong> is about to expire.</p>
                    <p style="font-size: 18px; font-weight: bold; color: #DC2626;">Expires at: ${timeString}</p>
                    <br/>
                    <a href="${link}" style="background-color: #000; color: #FFD700; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Extend Session Now</a>
                `
            }).catch(err => console.error('[Notification] Warning Email Failed:', err))
        )
    }

    await Promise.all(promises)
}
