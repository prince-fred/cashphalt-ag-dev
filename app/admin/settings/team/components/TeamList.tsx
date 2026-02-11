'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { inviteTeamMember, removeTeamMember } from '@/actions/team'
import { Plus, Trash2, Mail, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

interface TeamListProps {
    members: Profile[]
    currentUserId: string
    currentUserRole: string
    organizationId: string
}

export function TeamList({ members, currentUserId, currentUserRole, organizationId }: TeamListProps) {
    const router = useRouter()
    const [isInviting, setIsInviting] = useState(false)
    const [loading, setLoading] = useState(false)
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'staff' as 'staff' | 'property_owner'
    })

    const canManage = ['admin', 'property_owner'].includes(currentUserRole)

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await inviteTeamMember(inviteData.email, inviteData.role, organizationId)
            toast.success('Invitation sent successfully')
            setIsInviting(false)
            setInviteData({ email: '', role: 'staff' })
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (userId: string) => {
        if (!confirm('Remove this team member? This cannot be undone.')) return
        try {
            await removeTeamMember(userId)
            toast.success('Team member removed')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
                    <p className="text-slate-500 text-sm">Manage who has access to your organization.</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setIsInviting(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={16} /> Invite Member
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {members.map((member) => (
                    <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{member.full_name || 'Pending User'}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail size={14} />
                                    {member.email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1
                                ${member.role === 'property_owner' || member.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                <Shield size={12} />
                                {member.role === 'property_owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>

                            {canManage && member.id !== currentUserId && (
                                <button
                                    onClick={() => handleRemove(member.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 rounded-lg"
                                    title="Remove Member"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isInviting} onClose={() => setIsInviting(false)} title="Invite Team Member">
                <form onSubmit={handleInvite} className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="colleague@example.com"
                            value={inviteData.email}
                            onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select
                            value={inviteData.role}
                            onChange={e => setInviteData({ ...inviteData, role: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="staff">Staff (Can view & manage basic tasks)</option>
                            <option value="property_owner">Owner (Full access)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Sending Invite...' : 'Send Invitation'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}
