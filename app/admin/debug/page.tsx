'use client'

import { useState } from 'react'
import { fixUserForProperty, inspectUserAndProperty } from '@/actions/users'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Search } from 'lucide-react'

export default function DebugPage() {
    const [propertyId, setPropertyId] = useState('')
    const [loading, setLoading] = useState(false)
    const [fixLoading, setFixLoading] = useState(false)
    const [inspection, setInspection] = useState<any>(null)
    const [fixResult, setFixResult] = useState<any>(null)

    const handleInspect = async () => {
        if (!propertyId) return
        setLoading(true)
        setInspection(null)
        setFixResult(null)
        try {
            const res = await inspectUserAndProperty(propertyId.trim())
            setInspection(res)
        } catch (err: any) {
            toast.error(err.message)
            setInspection({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleFix = async () => {
        if (!propertyId) return
        setFixLoading(true)
        try {
            const res = await fixUserForProperty(propertyId.trim())
            setFixResult(res)
            toast.success('Permissions fixed!')
            // Auto re-inspect
            handleInspect()
        } catch (err: any) {
            setFixResult({ error: err.message })
            toast.error(err.message)
        } finally {
            setFixLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-2xl font-bold mb-6">Debug & Repair Permissions</h1>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-2">Inspect & Fix Property Access</h3>
                    <p className="text-slate-600 mb-4">
                        Enter a Property ID to check if your current user has the correct permissions to manage it.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Property UUID"
                        value={propertyId}
                        onChange={e => setPropertyId(e.target.value)}
                    />
                    <Button onClick={handleInspect} disabled={!propertyId || loading} variant="outline">
                        <Search size={16} className="mr-2" /> Inspect
                    </Button>
                    <Button onClick={handleFix} disabled={!propertyId || fixLoading}>
                        {fixLoading ? 'Fixing...' : 'Fix Perms'}
                    </Button>
                </div>

                {inspection && (
                    <div className="border rounded-lg p-4 bg-slate-50 space-y-3 text-sm font-mono">
                        {inspection.error ? (
                            <div className="text-red-600 font-bold">Error: {inspection.error}</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                                    <span className="text-slate-500">User ID:</span>
                                    <span>{inspection.user?.id}</span>

                                    <span className="text-slate-500">User Email:</span>
                                    <span>{inspection.user?.email}</span>

                                    <span className="text-slate-500">Profile Org:</span>
                                    <span className={inspection.match ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {inspection.user?.organization_id || 'NULL'}
                                    </span>

                                    <span className="text-slate-500">Profile Role:</span>
                                    <span>{inspection.user?.role || 'NULL'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <span className="text-slate-500">Property ID:</span>
                                    <span>{inspection.property?.id}</span>

                                    <span className="text-slate-500">Property Org:</span>
                                    <span className="font-bold">{inspection.property?.organization_id}</span>
                                </div>

                                <div className={`mt-4 p-2 rounded text-center font-bold ${inspection.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {inspection.match ? 'MATCH: You should have access.' : 'MISMATCH: You do NOT have access.'}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
