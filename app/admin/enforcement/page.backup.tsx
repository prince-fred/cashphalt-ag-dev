'use client'

import { useState } from 'react'
import { checkPlate } from '@/actions/enforcement'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, ShieldCheck, ShieldAlert, Car, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function EnforcementPage() {
    const [plate, setPlate] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null) // Type checkPlate result properly if needed
    const [searchedPlate, setSearchedPlate] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!plate.trim()) return

        setLoading(true)
        setResult(null)
        setSearchedPlate(plate.toUpperCase())

        try {
            const res = await checkPlate(plate)
            setResult(res)

            if (res.valid) {
                toast.success('Valid session found!')
            } else {
                toast.error(res.message || 'No valid session found')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">Enforcement</h1>
                <p className="text-slate-600 mt-2">Check license plates for valid parking sessions.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Enter License Plate (e.g. ABC-123)"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            className="text-lg font-mono placeholder:font-sans uppercase text-center tracking-widest h-12"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading} size="lg" className="h-12 px-8">
                        {loading ? 'Checking...' : <Search size={20} />}
                    </Button>
                </form>

                {searchedPlate && (
                    <div className="mt-8 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Result for</span>
                            <div className="text-4xl font-mono font-bold text-slate-900 mt-1">{searchedPlate}</div>
                        </div>

                        {result ? (
                            result.valid ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 text-green-600">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-green-700 mb-2">Valid Session</h2>
                                    <p className="text-green-600 mb-6 font-medium">This vehicle is authorized to park.</p>

                                    {result.session && (
                                        <div className="bg-white rounded-lg border border-green-100 p-4 text-left space-y-3 shadow-sm">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-sm text-slate-500">Property</span>
                                                <span className="font-semibold text-slate-900">{result.session.properties?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="text-sm text-slate-500">Expires At</span>
                                                <span className="font-bold text-slate-900">
                                                    {format(new Date(result.session.end_time), 'h:mm a, MMM d')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500">Remaining</span>
                                                <span className="font-medium text-green-600">
                                                    {/* Calculate diff roughly */}
                                                    {Math.max(0, Math.ceil((new Date(result.session.end_time).getTime() - Date.now()) / (1000 * 60)))} mins
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 text-red-600">
                                        <ShieldAlert size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-red-700 mb-2">No Valid Session</h2>
                                    <p className="text-red-600 font-medium">
                                        {result.message || 'This plate does not have active parking.'}
                                    </p>
                                    <div className="mt-6">
                                        <p className="text-sm text-slate-500">
                                            Make sure check for typos or try searching again.
                                            Also confirm you have access to the property where this car is parked.
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </div>
                )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                    Enforcement history is logged. All checks are recorded for audit purposes.
                </p>
            </div>
        </div>
    )
}
