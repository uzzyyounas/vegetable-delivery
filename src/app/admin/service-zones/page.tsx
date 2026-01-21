// src/app/admin/service-zones/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Save, X, MapPin } from 'lucide-react'

interface ServiceZone {
    id: string
    pin_code: string
    area_name: string | null
    is_active: boolean
    created_at: string
}

export default function AdminServiceZonesPage() {
    const [zones, setZones] = useState<ServiceZone[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddZone, setShowAddZone] = useState(false)
    const [editingZone, setEditingZone] = useState<string | null>(null)
    const [newZone, setNewZone] = useState({
        pin_code: '',
        area_name: ''
    })
    const [editData, setEditData] = useState<any>({})

    const supabase = createClient()

    useEffect(() => {
        fetchZones()
    }, [])

    const fetchZones = async () => {
        setIsLoading(true)

        const { data, error } = await supabase
            .from('service_zones')
            .select('*')
            .order('pin_code')

        if (data) {
            setZones(data)
        }

        setIsLoading(false)
    }

    const handleAddZone = async () => {
        if (!newZone.pin_code || newZone.pin_code.length !== 6) {
            alert('Please enter a valid 6-digit pin code')
            return
        }

        try {
            const { error } = await supabase
                .from('service_zones')
                .insert({
                    pin_code: newZone.pin_code,
                    area_name: newZone.area_name || null,
                    is_active: true
                })

            if (error) throw error

            alert('Service zone added successfully!')
            setShowAddZone(false)
            setNewZone({ pin_code: '', area_name: '' })
            fetchZones()
        } catch (error: any) {
            console.error('Error adding zone:', error)
            alert('Failed to add zone: ' + error.message)
        }
    }

    const handleUpdateZone = async (zoneId: string) => {
        try {
            const { error } = await supabase
                .from('service_zones')
                .update({
                    area_name: editData.area_name || null,
                    is_active: editData.is_active
                })
                .eq('id', zoneId)

            if (error) throw error

            alert('Service zone updated successfully!')
            setEditingZone(null)
            setEditData({})
            fetchZones()
        } catch (error: any) {
            console.error('Error updating zone:', error)
            alert('Failed to update zone: ' + error.message)
        }
    }

    const handleDeleteZone = async (zoneId: string) => {
        if (!confirm('Are you sure you want to delete this service zone?')) {
            return
        }

        try {
            const { error } = await supabase
                .from('service_zones')
                .delete()
                .eq('id', zoneId)

            if (error) throw error

            alert('Service zone deleted successfully!')
            fetchZones()
        } catch (error: any) {
            console.error('Error deleting zone:', error)
            alert('Failed to delete zone: ' + error.message)
        }
    }

    const handleBulkAdd = () => {
        const pinCodes = prompt('Enter pin codes separated by commas (e.g., 400001,400002,400003):')
        if (!pinCodes) return

        const codes = pinCodes.split(',').map(c => c.trim()).filter(c => c.length === 6)

        if (codes.length === 0) {
            alert('No valid pin codes entered')
            return
        }

        const zones = codes.map(code => ({
            pin_code: code,
            area_name: null,
            is_active: true
        }))

        supabase
            .from('service_zones')
            .insert(zones)
            .then(({ error }) => {
                if (error) throw error
                alert(`Added ${codes.length} service zones!`)
                fetchZones()
            })
            .catch((error: any) => {
                console.error('Error bulk adding zones:', error)
                alert('Failed to add zones: ' + error.message)
            })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading service zones...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Zones</h1>
                    <p className="text-gray-600 mt-1">Manage serviceable pin codes</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleBulkAdd}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Bulk Add
                    </button>
                    <button
                        onClick={() => setShowAddZone(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Zone
                    </button>
                </div>
            </div>

            {/* Add Zone Modal */}
            {showAddZone && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Service Zone</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pin Code * (6 digits)
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={newZone.pin_code}
                                    onChange={(e) => setNewZone({ ...newZone, pin_code: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="400001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Area Name
                                </label>
                                <input
                                    type="text"
                                    value={newZone.area_name}
                                    onChange={(e) => setNewZone({ ...newZone, area_name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Fort, Mumbai"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddZone}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                            >
                                Add Zone
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddZone(false)
                                    setNewZone({ pin_code: '', area_name: '' })
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zones List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y">
                    {zones.length === 0 ? (
                        <div className="p-12 text-center">
                            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No service zones yet. Add your first zone!</p>
                        </div>
                    ) : (
                        zones.map(zone => (
                            <div key={zone.id} className="p-6 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900 text-lg">
                                            {zone.pin_code}
                                        </h3>
                                        {!zone.is_active && (
                                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                        Inactive
                      </span>
                                        )}
                                    </div>

                                    {editingZone === zone.id ? (
                                        <div className="flex items-center gap-4 mt-3">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editData.is_active}
                                                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-gray-700">Active</span>
                                            </label>

                                            <input
                                                type="text"
                                                value={editData.area_name || ''}
                                                onChange={(e) => setEditData({ ...editData, area_name: e.target.value })}
                                                placeholder="Area name"
                                                className="flex-1 px-3 py-1 border rounded-lg text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600">
                                            {zone.area_name || 'No area name specified'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {editingZone === zone.id ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdateZone(zone.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingZone(null)
                                                    setEditData({})
                                                }}
                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingZone(zone.id)
                                                    setEditData({
                                                        area_name: zone.area_name,
                                                        is_active: zone.is_active
                                                    })
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteZone(zone.id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Zones Summary */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Active Service Zones</h3>
                <div className="flex flex-wrap gap-2">
                    {zones.filter(z => z.is_active).map(zone => (
                        <span key={zone.id} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
              {zone.pin_code} {zone.area_name && `(${zone.area_name})`}
            </span>
                    ))}
                </div>
                {zones.filter(z => z.is_active).length === 0 && (
                    <p className="text-sm text-green-700">No active service zones</p>
                )}
            </div>
        </div>
    )
}