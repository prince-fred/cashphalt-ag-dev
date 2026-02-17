'use server'

import { getUsers } from '@/actions/users'
import { getOrganizations } from '@/actions/organizations'
import { getProperties } from '@/actions/properties'
import { createClient } from '@/utils/supabase/server'
import { InviteUserDialog } from './InviteUserDialog'
import { UserActions } from './UserActions'
import { User, Users as UsersIcon, Building2 } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch current user profile to determine permissions
    let currentUserRole = 'staff'
    let currentUserOrgId = null

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profile) {
            currentUserRole = profile.role
            currentUserOrgId = profile.organization_id
        }
    }

    const start = Date.now()
    const users = await getUsers()
    const organizations = await getOrganizations()

    // getProperties returns all properties. 
    // If not admin, we might want to filter, but InviteUserDialog does client side filtering too.
    const properties = await getProperties()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
                    <p className="text-slate-600 text-sm mt-1">Manage access for owners and staff.</p>
                </div>

                <InviteUserDialog
                    organizations={organizations}
                    properties={properties}
                    currentUserRole={currentUserRole}
                    currentUserOrgId={currentUserOrgId}
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {!users || users.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No team members found. Invite someone!
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {users.map((u: any) => (
                            <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                        <UsersIcon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {u.full_name || 'Unnamed User'}
                                            </h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'property_owner' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {u.role ? u.role.replace('_', ' ') : 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">{u.email}</p>

                                        {u.organization && (
                                            <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                                                <Building2 size={12} />
                                                <span className="font-medium">{u.organization.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    {u.property_members && u.property_members.length > 0 ? (
                                        <div className="flex flex-col items-end gap-1 mr-4">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Properties</span>
                                            <div className="flex flex-wrap justify-end gap-1">
                                                {u.property_members.map((pm: any) => (
                                                    <span key={pm.property?.id || Math.random()} className="text-xs border border-slate-200 px-2 py-1 rounded bg-slate-50 text-slate-700 font-medium">
                                                        {pm.property?.name || 'Unknown'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic mr-4">No specific properties</div>
                                    )}

                                    <UserActions
                                        user={u}
                                        organizations={organizations}
                                        properties={properties}
                                        currentUserRole={currentUserRole}
                                        currentUserOrgId={currentUserOrgId}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
