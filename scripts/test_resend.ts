
import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing')
    process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
    console.log('Attempting to send test email...')
    try {
        const fromEmail = 'Cashphalt <receipts@p.cashphalt.com>'
        const toEmail = 'delivered@resend.dev'

        console.log(`Sending from ${fromEmail} to ${toEmail}`)

        const data = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: 'Test Email from Cashphalt Debugger',
            html: '<p>If you see this, Resend is working!</p>'
        })

        console.log('Success:', data)
    } catch (error) {
        console.error('Failed:', error)
    }
}

testEmail()
