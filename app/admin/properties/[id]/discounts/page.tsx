import { createClient } from '@/utils/supabase/server'
import { DiscountsEditor } from '../../components/DiscountsEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getProperty } from '@/actions/properties'
import { Database } from '@/db-types'

type Discount = Database['public']['Tables']['discounts']['Row']

export default async function PropertyDiscountsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const property = await getProperty(id)

    if (!property) {
        return <div>Property not found</div>
    }

    const supabase = await createClient()
    const { data: discounts } = await supabase
        .from('discounts')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <Link
                href={`/admin/properties/${id}`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Property
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Discounts</h1>
                    <p className="text-slate-500">{property.name}</p>
                </div>
            </div>

            <DiscountsEditor
                propertyId={id}
                discounts={(discounts as Discount[]) || []}
            />
        </div>
    )
}
