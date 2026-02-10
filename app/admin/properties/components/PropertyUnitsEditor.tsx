'use client'

import { useState } from 'react'
import { createParkingUnit, deleteParkingUnit } from '@/actions/properties'
import { Plus, Trash2, QrCode, Download, ExternalLink, Loader2, Archive } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/navigation'

interface ParkingUnit {
    id: string
    property_id: string
    name: string
}

interface PropertyUnitsEditorProps {
    propertyId: string
    propertySlug: string
    allocationMode: 'SPOT' | 'ZONE'
    units: ParkingUnit[]
}

export function PropertyUnitsEditor({ propertyId, propertySlug, allocationMode, units }: PropertyUnitsEditorProps) {
    const router = useRouter()
    const [newUnitName, setNewUnitName] = useState('')
    const [isAddingUnit, setIsAddingUnit] = useState(false)
    const [isZipping, setIsZipping] = useState(false)

    // QR Modal State
    const [qrUnit, setQrUnit] = useState<ParkingUnit | null>(null)
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
    const [qrSvg, setQrSvg] = useState<string | null>(null)
    const [loadingQr, setLoadingQr] = useState(false)

    const handleAddUnit = async () => {
        if (!propertyId || !newUnitName.trim()) return
        setIsAddingUnit(true)
        try {
            await createParkingUnit(propertyId, newUnitName.trim())
            setNewUnitName('')
            toast.success('Unit added successfully')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to add unit')
        } finally {
            setIsAddingUnit(false)
        }
    }

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('Are you sure you want to delete this unit?')) return
        try {
            await deleteParkingUnit(id)
            toast.success('Unit deleted')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete unit')
        }
    }

    const generateQrData = async (unit: ParkingUnit) => {
        const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/pay/${propertyId}?unit=${unit.id}`
        const png = await QRCode.toDataURL(url, { width: 400, margin: 2 })
        const svg = await QRCode.toString(url, { type: 'svg', width: 400, margin: 2 })
        return { png, svg }
    }

    const handleShowQr = async (unit: ParkingUnit) => {
        setQrUnit(unit)
        setLoadingQr(true)
        try {
            const { png, svg } = await generateQrData(unit)
            setQrCodeUrl(png)
            setQrSvg(svg)
        } catch (error) {
            console.error('Failed to generate QR', error)
            toast.error('Failed to generate QR code')
        } finally {
            setLoadingQr(false)
        }
    }

    const handleDownloadZip = async () => {
        if (!units || units.length === 0) return
        setIsZipping(true)
        const zip = new JSZip()

        try {
            const folder = zip.folder(`qr-codes-${propertySlug}`)

            // Generate all QRs
            const promises = units.map(async (unit) => {
                const { png } = await generateQrData(unit)
                // Remove data:image/png;base64, prefix
                const base64Data = png.replace(/^data:image\/png;base64,/, "")
                folder?.file(`${unit.name.replace(/[^a-z0-9]/gi, '_')}.png`, base64Data, { base64: true })
            })

            await Promise.all(promises)

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `qr-codes-${propertySlug}.zip`)
            toast.success("ZIP downloaded")
        } catch (err) {
            console.error(err)
            toast.error("Failed to generate ZIP")
        } finally {
            setIsZipping(false)
        }
    }

    const downloadSvg = () => {
        if (!qrSvg || !qrUnit) return
        const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
        saveAs(blob, `qr-${propertySlug}-${qrUnit.name}.svg`)
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {allocationMode === 'SPOT' ? 'Parking Spots' : 'Zones'}
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {units.length}
                    </span>
                </h2>

                {units.length > 0 && (
                    <button
                        onClick={handleDownloadZip}
                        disabled={isZipping}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isZipping ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                        Download All QR (ZIP)
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6">
                <input
                    placeholder={allocationMode === 'SPOT' ? "e.g. Spot 101" : "e.g. Zone A"}
                    value={newUnitName}
                    onChange={e => setNewUnitName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                />
                <button
                    onClick={handleAddUnit}
                    disabled={!newUnitName.trim() || isAddingUnit}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isAddingUnit ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Add
                </button>
            </div>

            <div className="space-y-2">
                {units.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No {allocationMode === 'SPOT' ? 'spots' : 'zones'} added yet.
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Direct Link</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {units.map(unit => {
                                    const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/pay/${propertyId}?unit=${unit.id}`
                                    return (
                                        <tr key={unit.id} className="hover:bg-slate-50 group">
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {unit.name}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <a href={link} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1 overflow-hidden text-ellipsis max-w-[200px] whitespace-nowrap">
                                                    .../pay/...?unit={unit.id.substring(0, 8)}...
                                                    <ExternalLink size={12} className="flex-shrink-0" />
                                                </a>
                                                <span className="md:hidden text-xs text-gray-400">Link available</span>
                                            </td>
                                            <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleShowQr(unit)}
                                                    title="Show QR Code"
                                                >
                                                    <QrCode size={16} />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                    onClick={() => handleDeleteUnit(unit.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {qrUnit && (
                <Modal
                    isOpen={!!qrUnit}
                    onClose={() => { setQrUnit(null); setQrCodeUrl(null); setQrSvg(null) }}
                    title={`QR Code for ${qrUnit.name}`}
                >
                    <div className="flex flex-col items-center gap-4 py-4">
                        {loadingQr ? (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                                <Loader2 className="text-slate-400 animate-spin" size={32} />
                            </div>
                        ) : qrCodeUrl ? (
                            <>
                                <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                                    <Image
                                        src={qrCodeUrl}
                                        alt={`QR Code for ${qrUnit.name}`}
                                        width={200}
                                        height={200}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex gap-3 w-full">
                                    <a
                                        href={qrCodeUrl}
                                        download={`qr-${propertySlug}-${qrUnit.name}.png`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                    >
                                        <Download size={16} />
                                        PNG
                                    </a>
                                    <button
                                        onClick={downloadSvg}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        <Download size={16} />
                                        SVG
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-red-500">Failed to load QR code</div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    )
}
