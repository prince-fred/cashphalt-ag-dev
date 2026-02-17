'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { updateUser, UserRole } from '@/actions/users'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

interface Organization {
    id: string
    name: string
}

interface Property {
    id: string
    name: string
    organization_id: string
}

interface UserData {
    id: string
    email: string
    role: string
    organization_id: string | null
    property_members: {
        property: {
            id: string
            name: string
        } | null
    }[]
}

interface EditUserDialogProps {
    user: UserData
    organizations: Organization[]
    properties: Property[]
    currentUserRole?: string
    currentUserOrgId?: string | null
    isOpen: boolean
    onClose: () => void
}

export function EditUserDialog({
    user,
    organizations,
    properties,
    currentUserRole,
    currentUserOrgId,
    isOpen,
    onClose
}: EditUserDialogProps) {
    const [role, setRole] = useState<UserRole>(user.role as UserRole)
    // Note: We don't support changing organization deeply yet because it requires more logic, 
    // but we can display it. For simplicity, we'll focus on Role and Properties.
    // If role is property_owner, org is fixed to their profile org usually.

    // Initial property IDs from user.property_members
    const initialPropertyIds = user.property_members
        .map(pm => pm.property?.id)
        .filter(Boolean) as string[]

    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(initialPropertyIds)
    const [loading, setLoading] = useState(false)

    // Reset state when user changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            setRole(user.role as UserRole)
            setSelectedPropertyIds(user.property_members.map(pm => pm.property?.id).filter(Boolean) as string[])
        }
    }, [isOpen, user])

    const orgId = user.organization_id || currentUserOrgId // Use user's org if set

    // Filter properties based on user's org
    const availableProperties = properties.filter(p =>
        orgId ? p.organization_id === orgId : true
    )

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateUser(user.id, {
                role,
                propertyIds: selectedPropertyIds
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('User updated successfully')
                onClose()
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit User"
        >
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                </div>

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

                {/* Property Assignments (For Staff/Owners) */}
                {role !== 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Assign Properties
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-2">
                            {availableProperties.length === 0 ? (
                                <p className="text-sm text-slate-500 italic p-2">
                                    No properties found for this organization.
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
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
