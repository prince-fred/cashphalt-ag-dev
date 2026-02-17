'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inviteUser, UserRole } from '@/actions/users'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface Organization {
    id: string
    name: string
}

interface Property {
    id: string
    name: string
    organization_id: string
}

interface InviteUserDialogProps {
    organizations: Organization[]
    properties: Property[]
    currentUserRole?: string
    currentUserOrgId?: string | null
}

export function InviteUserDialog({
    organizations,
    properties,
    currentUserRole,
    currentUserOrgId
}: InviteUserDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<UserRole>('staff')
    const [orgId, setOrgId] = useState<string>(currentUserOrgId || '')
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
    const [isManual, setIsManual] = useState(false)
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    // Filter properties based on selected org
    const availableProperties = properties.filter(p =>
        // If org selected, show only its properties
        // If no org selected (and user is super admin), show all? Or wait for org?
        // Usually staff belong to an org.
        orgId ? p.organization_id === orgId : true
    )

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await inviteUser({
                email,
                role,
                organizationId: orgId || undefined,
                propertyIds: selectedPropertyIds,
                password: isManual ? password : undefined
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('User created successfully')
                setIsOpen(false)
                // Reset form
                setEmail('')
                setPassword('')
                setIsManual(false)
                setRole('staff')
                setSelectedPropertyIds([])
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const toggleProperty = (id: string) => {
        setSelectedPropertyIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        )
    }

    // Update orgId if currentUser has fixed org
    if (currentUserRole === 'property_owner' && currentUserOrgId && orgId !== currentUserOrgId) {
        setOrgId(currentUserOrgId)
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus size={18} className="mr-2" />
                Invite User
            </Button>

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Invite Team Member"
                >
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="manual-create"
                                checked={isManual}
                                onChange={e => setIsManual(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="manual-create" className="text-sm text-slate-600">
                                Set password manually (skips email invite)
                            </label>
                        </div>

                        {isManual && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <Input
                                    type="password"
                                    required={isManual}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="******"
                                    minLength={6}
                                />
                                <p className="text-xs text-slate-500 mt-1">User can log in immediately with this password.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={role}
                                onChange={e => setRole(e.target.value as UserRole)}
                            >
                                <option value="staff">Staff (Enforcement)</option>
                                <option value="property_owner">Property Admin</option>
                                {currentUserRole === 'admin' && <option value="admin">Global Admin</option>}
                            </select>
                        </div>

                        {/* Organization Selection (Only for Global Admin) */}
                        {currentUserRole === 'admin' && role !== 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                                <select
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={orgId}
                                    onChange={e => setOrgId(e.target.value)}
                                    required={role !== 'admin'}
                                >
                                    <option value="">Select Organization...</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Property Assignments (Only for Staff) */}
                        {role === 'staff' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Assign Properties {orgId && '(Optional)'}
                                </label>
                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-2">
                                    {availableProperties.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-2">
                                            {orgId ? 'No properties found for this organization.' : 'Select an organization first.'}
                                        </p>
                                    ) : (
                                        availableProperties.map(prop => (
                                            <label key={prop.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPropertyIds.includes(prop.id)}
                                                    onChange={() => toggleProperty(prop.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-slate-700">{prop.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Staff will only see sessions for assigned properties.
                                </p>
                            </div>
                        )}

                        <div className="pt-2 flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Processing...' : (isManual ? 'Create User' : 'Send Invitation')}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    )
}
