import { createClient } from '@/utils/supabase/server'
import { TeamList } from './components/TeamList'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TeamSettingsPage() {
    const supabase = await createClient()

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Get Profile & Check Organization
    const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !myProfile || !myProfile.organization_id) {
        // Handle edge case: User has no profile or org
        return <div>Error: You are not part of an organization.</div>
    }

    // 3. Get All Team Members in this Org
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', myProfile.organization_id)
        .order('created_at', { ascending: false })

    if (membersError) {
        return <div>Error loading team members.</div>
    }

    return (
        <div className="space-y-6">
            <Link
                href="/admin/settings"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Settings
            </Link>

            <TeamList
                members={members || []}
                currentUserId={user.id}
                currentUserRole={myProfile.role}
                organizationId={myProfile.organization_id}
            />
        </div>
    )
}
