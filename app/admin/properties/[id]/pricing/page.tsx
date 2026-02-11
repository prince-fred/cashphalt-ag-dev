import { createClient } from '@/utils/supabase/server'
import { PricingRulesEditor } from '../../components/PricingRulesEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getProperty } from '@/actions/properties'
import { Database } from '@/db-types'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']

export default async function PropertyPricingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const property = await getProperty(id)

    if (!property) {
        return <div>Property not found</div>
    }

    const supabase = await createClient()
    const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', id)
        .order('priority', { ascending: false })

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
                    <h1 className="text-2xl font-bold text-slate-900">Pricing Rules</h1>
                    <p className="text-slate-500">{property.name} ({property.timezone})</p>
                </div>
            </div>

            <PricingRulesEditor
                propertyId={id}
                rules={(rules as PricingRule[]) || []}
                timezone={property.timezone}
            />
        </div>
    )
}
