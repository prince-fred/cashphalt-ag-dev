'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/db-types'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']
type PricingRuleInsert = Database['public']['Tables']['pricing_rules']['Insert']

export async function upsertPricingRule(rule: PricingRuleInsert) {
    const supabase = await createClient()

    // Validate (basic)
    if (rule.start_time && rule.end_time && rule.start_time === rule.end_time) {
        throw new Error('Start time and end time cannot be the same')
    }

    const { error } = await supabase
        .from('pricing_rules')
        .upsert(rule)

    if (error) {
        console.error('Upsert Rule Error:', error)
        throw new Error('Failed to save pricing rule')
    }

    revalidatePath(`/admin/properties/${rule.property_id}/pricing`)
    return { success: true }
}

export async function deletePricingRule(ruleId: string, propertyId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', ruleId)

    if (error) {
        console.error('Delete Rule Error:', error)
        throw new Error('Failed to delete pricing rule')
    }

    revalidatePath(`/admin/properties/${propertyId}/pricing`)
    return { success: true }
}

export async function reorderPricingRules(rules: { id: string, priority: number }[], propertyId: string) {
    const supabase = await createClient()

    // Update priorities in a transaction-like manner?
    // Supabase JS doesn't support bulk update easily with different values.
    // We'll loop for now (or use an RPC if performance matters later).

    // Reverse logic: High priority number = First matched? 
    // Usually Priority 1 is checked first? 
    // DB schema comment says: "evaluated in order of priority (descending). First match wins."
    // So 100 wins over 1.

    // We expect the UI to send us the NEW priority values.

    const updates = rules.map(r =>
        supabase.from('pricing_rules').update({ priority: r.priority }).eq('id', r.id)
    )

    await Promise.all(updates)

    revalidatePath(`/admin/properties/${propertyId}/pricing`)
    return { success: true }
}
