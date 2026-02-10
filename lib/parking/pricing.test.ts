
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculatePrice, isRuleApplicable } from './pricing'
import { addHours } from 'date-fns'

// Mock Supabase
const mockSupabase = {
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
    })),
}

vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

describe('Pricing Logic', () => {
    const propertyId = 'prop-123'

    // Date: 2026-06-15 14:00:00 UTC (Monday)
    // EST (New York): 10:00:00 AM
    // PST (Los Angeles): 07:00:00 AM
    const mondayUTC14 = new Date('2026-06-15T14:00:00Z')

    describe('isRuleApplicable (Timezones)', () => {
        it('applies rule correctly in UTC property', () => {
            // Rule: 13:00 - 15:00
            const rule: any = {
                start_time: '13:00:00',
                end_time: '15:00:00',
                days_of_week: [1], // Monday
            }
            expect(isRuleApplicable(rule, mondayUTC14, 'UTC')).toBe(true)
        })

        it('applies rule correctly in New York (UTC-4)', () => {
            // 14:00 UTC = 10:00 NY
            // Rule: 09:00 - 11:00
            const rule: any = {
                start_time: '09:00:00',
                end_time: '11:00:00',
                days_of_week: [1], // Monday
            }
            expect(isRuleApplicable(rule, mondayUTC14, 'America/New_York')).toBe(true)
        })

        it('rejects rule outside window in New York', () => {
            // 14:00 UTC = 10:00 NY
            // Rule: 12:00 - 14:00 (NY time)
            const rule: any = {
                start_time: '12:00:00',
                end_time: '14:00:00',
                days_of_week: [1],
            }
            expect(isRuleApplicable(rule, mondayUTC14, 'America/New_York')).toBe(false)
        })

        it('handles overnight rules correctly (22:00 - 06:00)', () => {
            const timezone = 'UTC'
            const rule: any = {
                start_time: '22:00:00',
                end_time: '06:00:00',
                days_of_week: [],
            }

            // 23:00 UTC -> Should match
            const nightTime = new Date('2026-06-15T23:00:00Z')
            expect(isRuleApplicable(rule, nightTime, timezone)).toBe(true)

            // 05:00 UTC -> Should match
            const morningTime = new Date('2026-06-16T05:00:00Z')
            expect(isRuleApplicable(rule, morningTime, timezone)).toBe(true)

            // 12:00 UTC -> Should NOT match
            expect(isRuleApplicable(rule, mondayUTC14, timezone)).toBe(false)
        })
    })

    describe('calculatePrice (Mocked DB)', () => {

        it('calculates flat rate correctly', async () => {
            const mockRules = [{
                id: 'rule-1',
                rate_type: 'FLAT',
                amount_cents: 1000,
                priority: 1,
                days_of_week: [],
                start_time: null,
                end_time: null,
                properties: { timezone: 'UTC' }
            }]

            // Mock DB implementation specifically for this test
            const selectMock = vi.fn().mockResolvedValue({ data: mockRules, error: null })
            mockSupabase.from.mockImplementation(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: selectMock
            } as any))

            const result = await calculatePrice(propertyId, mondayUTC14, 2)
            expect(result.amountCents).toBe(1000)
        })

        it('calculates hourly rate correctly', async () => {
            const mockRules = [{
                id: 'rule-2',
                rate_type: 'HOURLY',
                amount_cents: 500, // $5/hr
                priority: 1,
                days_of_week: [],
                properties: { timezone: 'UTC' }
            }]

            const selectMock = vi.fn().mockResolvedValue({ data: mockRules, error: null })
            mockSupabase.from.mockImplementation(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: selectMock
            } as any))

            const result = await calculatePrice(propertyId, mondayUTC14, 3)
            expect(result.amountCents).toBe(1500) // 3 * 500
        })

        it('switches to hourly optimization if cheaper than daily', async () => {
            const mockRules = [
                {
                    id: 'rule-daily',
                    rate_type: 'DAILY',
                    amount_cents: 2000, // $20/day
                    priority: 10, // Higher priority
                    days_of_week: [],
                    properties: { timezone: 'UTC' } // mock join result
                },
                {
                    id: 'rule-hourly',
                    rate_type: 'HOURLY',
                    amount_cents: 200, // $2/hr
                    priority: 1,
                    days_of_week: [],
                    properties: { timezone: 'UTC' }
                }
            ]

            const selectMock = vi.fn().mockResolvedValue({ data: mockRules, error: null })
            mockSupabase.from.mockImplementation(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: selectMock
            } as any))

            // 2 hours * $2 = $4. Daily is $20. Should pick $4.
            const result = await calculatePrice(propertyId, mondayUTC14, 2)
            expect(result.amountCents).toBe(400)
            expect(result.ruleApplied?.id).toBe('rule-hourly')
        })
    })
})
