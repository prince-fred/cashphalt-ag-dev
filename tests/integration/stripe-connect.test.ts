import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { createParkingSession } from '@/actions/checkout'
import { extendSession } from '@/actions/extension'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Mock Next.js headers/cookies to avoid errors in Server Actions
vi.mock('next/headers', () => ({
    cookies: () => ({
        getAll: () => [],
        set: () => { },
    }),
    headers: () => ({
        get: () => null,
    }),
}))

// Mock Supabase Server Client to use valid Admin Client instead of cookie-based one
vi.mock('@/utils/supabase/server', () => ({
    createClient: async () => {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }
}))

// Mock Stripe to avoid real API calls and spy on arguments
vi.mock('@/lib/stripe', async (importOriginal) => {
    const original = await importOriginal() as any
    return {
        ...original,
        stripe: {
            ...original.stripe,
            paymentIntents: {
                create: vi.fn().mockResolvedValue({
                    id: 'pi_mock_123',
                    client_secret: 'secret_mock_123',
                    amount: 600,
                }),
            },
        },
    }
})

describe('Stripe Connect Integration Tests', () => {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let orgId: string
    let propertyId: string
    const TEST_CONNECT_ID = 'acct_123456789Test'
    const PLATFORM_FEE_PERCENT = 10
    const SERVICE_FEE_CENTS = 100

    beforeAll(async () => {
        console.log('--- Setup: Creating Test Data ---')

        // 1. Create Organization with Connect ID
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: 'Test Org Integration',
                slug: `test-org-${Date.now()}`,
                stripe_connect_id: TEST_CONNECT_ID,
                platform_fee_percent: PLATFORM_FEE_PERCENT
            })
            .select()
            .single()

        if (orgError) throw new Error(`Org Setup Failed: ${orgError.message}`)
        orgId = org.id

        // 2. Create Property linked to Org
        const { data: prop, error: propError } = await supabase
            .from('properties')
            .insert({
                organization_id: orgId,
                name: 'Test Property Integration',
                slug: `test-prop-${Date.now()}`,
                address: '123 Test St',
                price_hourly_cents: 500, // $5.00/hr
                timezone: 'America/New_York'
            })
            .select()
            .single()

        if (propError) {
            console.error('Property Setup Error:', JSON.stringify(propError, null, 2))
            throw new Error(`Property Setup Failed: ${propError.message}`)
        }
        propertyId = prop.id

        console.log(`Created Org: ${orgId}, Property: ${propertyId}`)
    })

    afterAll(async () => {
        console.log('--- Teardown: Cleaning Up ---')
        if (propertyId) await supabase.from('properties').delete().eq('id', propertyId)
        if (orgId) await supabase.from('organizations').delete().eq('id', orgId)
    })

    it('should calculate correct Application Fee and Transfer Destination for Initial Booking', async () => {
        const durationHours = 1 // $5.00 parking rate

        // Expected Logic:
        // Total User Pays: $5.00 (Parking) + $1.00 (Service) = $6.00 (600 cents)
        // Platform Fee: Service Fee ($1.00) + 10% of Parking ($0.50) = $1.50 (150 cents)
        // Connected Account receives remainder in Stripe automatically via dest transfer logic
        // But we specifically check 'application_fee_amount' parameter.

        const response = await createParkingSession({
            propertyId,
            durationHours,
            plate: 'TEST-VITEST',
            customerEmail: 'test@example.com'
        })

        expect(response.sessionId).toBeDefined()
        expect(response.amountCents).toBe(500) // Base charged to user (Service Fee is added in PI)

        // Verify Stripe Call
        expect(stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 600,
            application_fee_amount: 150, // 100 + 50
            transfer_data: {
                destination: TEST_CONNECT_ID
            },
            metadata: expect.objectContaining({
                type: 'INITIAL',
                propertyId: propertyId
            })
        }))
    })

    it('should calculate correct Application Fee and Transfer Destination for Extension', async () => {
        // Setup: Create an active session first
        // We can just manually insert one to bypass the first test dependency
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

        const { data: session } = await supabase.from('sessions').insert({
            property_id: propertyId,
            start_time: startTime.toISOString(),
            end_time_current: endTime.toISOString(),
            end_time_initial: endTime.toISOString(),
            vehicle_plate: 'EXT-TEST',
            total_price_cents: 600,
            status: 'ACTIVE'
        }).select().single()

        if (!session) throw new Error("Failed to create setup session")

        // Action: Extend by 1 hour ($5.00)
        await extendSession({
            sessionId: session.id,
            durationHours: 1
        })

        // Verify Stripe Call
        // Logic same as initial: $5.00 parking -> $6.00 total. App Fee $1.50.
        expect(stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 600,
            application_fee_amount: 150,
            transfer_data: {
                destination: TEST_CONNECT_ID
            },
            metadata: expect.objectContaining({
                type: 'EXTENSION',
                sessionId: session.id
            })
        }))
    })
})
