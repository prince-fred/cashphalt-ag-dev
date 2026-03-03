
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
    timezone: string
    type?: 'INITIAL' | 'EXTENSION'
    allocationMode?: 'ZONE' | 'SPOT'
}

export async function sendSessionReceipt({ toEmail, toPhone, plate, propertyName, unitName, amountCents, endTime, link, timezone, type = 'INITIAL', allocationMode = 'SPOT' }: SendReceiptParams) {
    const formattedPrice = `$${(amountCents / 100).toFixed(2)}`
    const timeString = endTime.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
    const dateString = endTime.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' })
    const dateTimeString = `${dateString} at ${timeString}`

    const promises = []

    // 1. Send SMS (if provided and configured)
    if (toPhone && FROM_PHONE) {
        let message = ''
        if (type === 'EXTENSION') {
            message = `Parking Extended: ${plate} at ${propertyName}`
        } else {
            message = `Parking Granted: ${plate} at ${propertyName}`
        }

        const unitLabel = allocationMode === 'ZONE' ? 'Zone' : 'Spot'
        if (unitName) message += ` (${unitLabel}: ${unitName})`
        message += `.\nExpires: ${dateTimeString}.\nExtend: ${link}`
        // Add link for easy extension? 
        // message += `\nManage: ${link}`

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
        const subject = type === 'EXTENSION'
            ? `Parking Extended: ${plate}`
            : `Parking Receipt: ${plate}`

        const title = type === 'EXTENSION' ? 'Parking Extended' : 'Parking Confirmed'

        promises.push(
            resend.emails.send({
                from: FROM_EMAIL,
                to: toEmail,
                subject: subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${title}</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121212;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F4F5; padding: 40px 20px;">
                            <tr>
                                <td align="center">
                                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                        <!-- Header -->
                                        <tr>
                                            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 2px solid #F4F4F5;">
                                                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #121212; letter-spacing: -0.5px;">${propertyName}</h1>
                                            </td>
                                        </tr>
                                        <!-- Content -->
                                        <tr>
                                            <td style="padding: 30px 40px;">
                                                <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #121212;">${title}</h2>
                                                <p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.5;">
                                                    ${type === 'EXTENSION' ? 'Your parking session has been successfully extended. Your new expiration time is confirmed below.' : 'Your parking session is confirmed and active. Have a great day!'}
                                                </p>
                                                
                                                <div style="background-color: #F4F4F5; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="padding-bottom: 16px;">
                                                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Location Details</p>
                                                                <p style="margin: 4px 0 0 0; font-size: 16px; color: #121212;">${propertyName}</p>
                                                            </td>
                                                        </tr>
                                                        ${unitName ? `<tr>
                                                            <td style="padding-bottom: 16px;">
                                                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${allocationMode === 'ZONE' ? 'Zone' : 'Spot'}</p>
                                                                <p style="margin: 4px 0 0 0; font-size: 16px; color: #121212;">${unitName}</p>
                                                            </td>
                                                        </tr>` : ''}
                                                        <tr>
                                                            <td style="padding-bottom: 16px;">
                                                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle</p>
                                                                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 500; color: #121212;">License Plate: <span style="background-color: #121212; color: #FFFFFF; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; margin-left: 4px;">${plate}</span></p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Expiration</p>
                                                                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #121212;">${dateTimeString}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </div>

                                                <div style="border-top: 1px solid #E4E4E7; border-bottom: 1px solid #E4E4E7; padding: 20px 0; margin-bottom: 30px; text-align: center;">
                                                    <p style="margin: 0 0 8px 0; font-size: 15px; color: #666;">Total Charged</p>
                                                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #121212;">${formattedPrice}</p>
                                                </div>

                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="${link}" style="display: inline-block; background-color: #FFD700; color: #121212; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; width: 100%; max-width: 300px; text-align: center; border: 1px solid #EAB308;">EXTEND SESSION</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <!-- Footer -->
                                        <tr>
                                            <td style="background-color: #F4F4F5; padding: 24px 40px; text-align: center; border-top: 1px solid #E4E4E7;">
                                                <p style="margin: 0; font-size: 12px; color: #999;">If you need assistance with your parking session, please contact support.</p>
                                                <p style="margin: 12px 0 0 0; font-size: 12px; color: #999; font-weight: 600;">Powered by Cashphalt</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            }).catch(err => console.error('[Notification] Email Failed:', err))
        )
    }

    await Promise.all(promises)
}

export async function sendExpiryWarning({ toEmail, toPhone, plate, propertyName, unitName, expireTime, link, timezone, allocationMode = 'SPOT' }: { toEmail?: string | null, toPhone?: string | null, plate: string, propertyName: string, unitName?: string | null, expireTime: Date, link: string, timezone: string, allocationMode?: 'ZONE' | 'SPOT' }) {
    const timeString = expireTime.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
    const dateString = expireTime.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' })
    const dateTimeString = `${dateString} at ${timeString}`
    const promises = []

    // SMS
    if (toPhone && FROM_PHONE) {
        let message = `⚠️ Parking Expiring Soon!\nLic: ${plate}\nLoc: ${propertyName}`
        const unitLabel = allocationMode === 'ZONE' ? 'Zone' : 'Spot'
        if (unitName) message += ` (${unitLabel}: ${unitName})`
        message += `\nExpires: ${dateTimeString}\nExtend now: ${link}`

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
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Parking Expiring Soon</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121212;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F4F5; padding: 40px 20px;">
                            <tr>
                                <td align="center">
                                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                        <!-- Header -->
                                        <tr>
                                            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 2px solid #F4F4F5;">
                                                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #121212; letter-spacing: -0.5px;">${propertyName}</h1>
                                            </td>
                                        </tr>
                                        <!-- Content -->
                                        <tr>
                                            <td style="padding: 30px 40px;">
                                                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #DC2626;">Action Required: Parking Expiring Soon</h2>
                                                
                                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #444; line-height: 1.5;">Your parking session at <strong>${propertyName}</strong> ${unitName ? `(${allocationMode === 'ZONE' ? 'Zone' : 'Spot'}: <strong>${unitName}</strong>) ` : ''}for vehicle <strong>${plate}</strong> is about to expire.</p>

                                                <div style="background-color: rgba(220, 38, 38, 0.05); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 30px; text-align: center;">
                                                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #DC2626; text-transform: uppercase; letter-spacing: 0.5px;">Expires At</p>
                                                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #DC2626;">${dateTimeString}</p>
                                                </div>

                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td align="center">
                                                            <a href="${link}" style="display: inline-block; background-color: #FFD700; color: #121212; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; width: 100%; max-width: 300px; text-align: center; border: 1px solid #EAB308;">EXTEND SESSION NOW</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <!-- Footer -->
                                        <tr>
                                            <td style="background-color: #F4F4F5; padding: 24px 40px; text-align: center; border-top: 1px solid #E4E4E7;">
                                                <p style="margin: 0; font-size: 12px; color: #999;">If you need assistance with your parking session, please contact support.</p>
                                                <p style="margin: 12px 0 0 0; font-size: 12px; color: #999; font-weight: 600;">Powered by Cashphalt</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            }).catch(err => console.error('[Notification] Warning Email Failed:', err))
        )
    }

    await Promise.all(promises)
}
