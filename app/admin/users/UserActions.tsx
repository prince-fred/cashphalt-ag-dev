'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Mail, ShieldAlert, KeyRound } from 'lucide-react' // ShieldAlert, KeyRound as icons
import { Button } from '@/components/ui/Button'
import { EditUserDialog } from './EditUserDialog'
import { deleteUser, resendInvite, sendPasswordReset } from '@/actions/users'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface UserActionsProps {
    user: any // Type matches the one in EditUserDialog
    organizations: any[]
    properties: any[]
    currentUserRole?: string
    currentUserOrgId?: string | null
}

export function UserActions({ user, organizations, properties, currentUserRole, currentUserOrgId }: UserActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteUser(user.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('User deleted')
                setIsDeleteOpen(false)
                router.refresh()
            }
        } catch (err) {
            toast.error('Failed to delete user')
        } finally {
            setLoading(false)
        }
    }

    const handleResendInvite = async () => {
        setLoading(true)
        try {
            const result = await resendInvite(user.email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Invite resent successfully')
            }
        } catch (err) {
            toast.error('Failed to resend invite')
        } finally {
            setLoading(false)
            setIsMenuOpen(false)
        }
    }

    const handlePasswordReset = async () => {
        setLoading(true)
        try {
            const result = await sendPasswordReset(user.email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Password reset email sent')
            }
        } catch (err) {
            toast.error('Failed to send reset email')
        } finally {
            setLoading(false)
            setIsMenuOpen(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
                <MoreHorizontal size={20} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-100 z-20 py-1">
                        <button
                            onClick={() => {
                                setIsEditOpen(true)
                                setIsMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Edit size={16} />
                            Edit User
                        </button>
                        <button
                            onClick={handleResendInvite}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Mail size={16} />
                            Resend Invite
                        </button>
                        <button
                            onClick={handlePasswordReset}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <KeyRound size={16} />
                            Send Password Reset
                        </button>
                        <div className="my-1 border-t border-slate-100"></div>
                        <button
                            onClick={() => {
                                setIsDeleteOpen(true)
                                setIsMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete User
                        </button>
                    </div>
                </>
            )}

            {/* Edit Dialog */}
            <EditUserDialog
                user={user}
                organizations={organizations}
                properties={properties}
                currentUserRole={currentUserRole}
                currentUserOrgId={currentUserOrgId}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />

            {/* Delete Confirmation (Simple inline Modal for now or reuse component?) */}
            {/* I'll use a simple absolute overlay for speed if Modal component is standard */}
            {/* Actually better to use existing Modal component if possible but it seems tied to title/children structure. */}
            {/* Let's Try to use the standard Modal if imported. I'll import Modal from existing UI. */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Delete User?</h3>
                        <p className="text-sm text-slate-600">
                            Are you sure you want to delete <strong>{user.email}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete User'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
