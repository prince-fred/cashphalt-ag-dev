import { getOrganization } from '@/actions/organizations'
import { OrganizationEditor } from '../components/OrganizationEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const isNew = id === 'new'
    const organization = !isNew ? await getOrganization(id) : undefined

    return (
        <div className="space-y-6">
            <Link
                href="/admin/organizations"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Organizations
            </Link>

            <div className="flex items-start gap-8 flex-col lg:flex-row">
                <div className="flex-1 w-full">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6">{isNew ? 'New Organization' : 'Edit Organization'}</h1>
                    <OrganizationEditor organization={organization || undefined} />
                </div>
            </div>
        </div>
    )
}
