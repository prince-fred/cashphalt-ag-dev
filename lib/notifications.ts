
import { Resend } from 'resend'
import twilio from 'twilio'

// Initialize clients
const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER
const FROM_EMAIL = 'Cashphalt <receipts@cashphalt.com>' // Verify this domain in Resend!

interface SendReceiptParams {
    toEmail?: string | null
    toPhone?: string | null
    plate: string
    propertyName: string
    amountCents: number // e.g. 500
    endTime: Date
    link: string // e.g. /pay/extend/[sessionId]
}

export async function sendSessionReceipt({ toEmail, toPhone, plate, propertyName, amountCents, endTime, link }: SendReceiptParams) {
    const formattedPrice = `$${(amountCents / 100).toFixed(2)}`
    const timeString = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const promises = []

    // 1. Send SMS (if not opted out / if provided? We don't have phone input yet in UI!)
    // TODO: We need to add Phone Input to UI if we want to send SMS receipts.
    // For now, Text-To-Park users have phone numbers implicitly. 
    if (toPhone && FROM_PHONE) {
        const message = `Access Granted: ${plate} at ${propertyName}.\nexpires at ${timeString}.\nExtend here: ${link}`
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
                    <p><strong>Plate:</strong> ${plate}</p>
                    <p><strong>Total:</strong> ${formattedPrice}</p>
                    <p><strong>Expires:</strong> ${timeString}</p>
                    <br/>
                    <a href="${link}">Extend Session</a>
                `
            }).catch(err => console.error('[Notification] Email Failed:', err))
        )
    }

    await Promise.all(promises)
}

export async function sendExpiryWarning({ toEmail, toPhone, plate, propertyName, expireTime, link }: { toEmail?: string | null, toPhone?: string | null, plate: string, propertyName: string, expireTime: Date, link: string }) {
    const timeString = expireTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const promises = []

    // SMS
    if (toPhone && FROM_PHONE) {
        const message = `⚠️ Parking Expiring Soon!\nLic: ${plate}\nLoc: ${propertyName}\nExpires: ${timeString}\nExtend now: ${link}`
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
                    <p>Your parking session at <strong>${propertyName}</strong> for vehicle <strong>${plate}</strong> is about to expire.</p>
                    <p style="font-size: 18px; font-weight: bold; color: #DC2626;">Expires at: ${timeString}</p>
                    <br/>
                    <a href="${link}" style="background-color: #000; color: #FFD700; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Extend Session Now</a>
                `
            }).catch(err => console.error('[Notification] Warning Email Failed:', err))
        )
    }

    await Promise.all(promises)
}
