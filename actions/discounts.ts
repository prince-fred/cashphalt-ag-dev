'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/db-types'

type DiscountInsert = Database['public']['Tables']['discounts']['Insert']

export async function upsertDiscount(discount: DiscountInsert) {
    const supabase = await createClient()

    // Validate Code format (uppercase, alphanumeric)
    const code = discount.code.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (code.length < 3) {
        throw new Error('Code must be at least 3 characters')
    }

    const { error } = await supabase
        .from('discounts')
        .upsert({
            ...discount,
            code
        })

    if (error) {
        console.error('Upsert Discount Error:', error)
        if (error.code === '23505') throw new Error('Discount code already exists for this property')
        throw new Error('Failed to save discount')
    }

    revalidatePath(`/admin/properties/${discount.property_id}/discounts`)
    return { success: true }
}

export async function deleteDiscount(discountId: string, propertyId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId)

    if (error) {
        console.error('Delete Discount Error:', error)
        throw new Error('Failed to delete discount')
    }

    revalidatePath(`/admin/properties/${propertyId}/discounts`)
    return { success: true }
}
