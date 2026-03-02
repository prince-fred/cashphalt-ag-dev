import { sendSessionReceipt, sendExpiryWarning } from '../lib/notifications'

async function main() {
    // We are going to test sending the email locally to ensure the HTML renders correctly
    console.log("Testing Session Receipt Email...")
    await sendSessionReceipt({
        toEmail: "test@domain.com", // Replace or use real
        plate: "TEST-123",
        propertyName: "Downtown Hub Parking",
        unitName: "A101",
        amountCents: 1500, // $15.00
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
        link: "https://p.cashphalt.com/pay/extend/test-session",
        timezone: "America/New_York",
        type: "INITIAL",
        allocationMode: "SPOT"
    })

    console.log("Testing Expiry Warning Email...")
    await sendExpiryWarning({
        toEmail: "test@domain.com",
        plate: "TEST-123",
        propertyName: "Downtown Hub Parking",
        unitName: "A101",
        expireTime: new Date(Date.now() + 1000 * 60 * 15), // 15 mins
        link: "https://p.cashphalt.com/pay/extend/test-session",
        timezone: "America/New_York",
        allocationMode: "SPOT"
    })

    console.log("Test scripts completed (simulated dispatch).")
}

main().catch(console.error)
