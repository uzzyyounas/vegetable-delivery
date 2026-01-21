// src/app/admin/delivery-slots/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Save, X, Calendar } from 'lucide-react'

interface DeliverySlot {
    id: string
    slot_date: string
    start_time: string
    end_time: string
    max_orders: number | null
    current_orders: number
    is_active: boolean
}

export default function AdminDeliverySlotsPage() {
    const [slots, setSlots] = useState<DeliverySlot[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddSlot, setShowAddSlot] = useState(false)
    const [editingSlot, setEditingSlot] = useState<string | null>(null)
    const [newSlot, setNewSlot] = useState({
        slot_date: '',
        start_time: '07:00',
        end_time: '10:00',
        max_orders: 50
    })
    const [editData, setEditData] = useState<any>({})

    const supabase = createClient()

    useEffect(() => {
        fetchSlots()
    }, [])

    const fetchSlots = async () => {
        setIsLoading(true)

        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('delivery_slots')
            .select('*')
            .gte('slot_date', today)
            .order('slot_date')
            .order('start_time')

        if (data) {
            setSlots(data)
        }

        setIsLoading(false)
    }

    const handleAddSlot = async () => {
        if (!newSlot.slot_date || !newSlot.start_time || !newSlot.end_time) {
            alert('Please fill all required fields')
            return
        }

        try {
            const { error } = await supabase
                .from('delivery_slots')
                .insert({
                    slot_date: newSlot.slot_date,
                    start_time: newSlot.start_time,
                    end_time: newSlot.end_time,
                    max_orders: newSlot.max_orders || null,
                    current_orders: 0,
                    is_active: true
                })

            if (error) throw error

            alert('Delivery slot added successfully!')
            setShowAddSlot(false)
            setNewSlot({
                slot_date: '',
                start_time: '07:00',
                end_time: '10:00',
                max_orders: 50
            })
            fetchSlots()
        } catch (error: any) {
            console.error('Error adding slot:', error)
            alert('Failed to add slot: ' + error.message)
        }
    }

    const handleUpdateSlot = async (slotId: string) => {
        try {
            const { error } = await supabase
                .from('delivery_slots')
                .update({
                    max_orders: editData.max_orders || null,
                    is_active: editData.is_active
                })
                .eq('id', slotId)

            if (error) throw error

            alert('Slot updated successfully!')
            setEditingSlot(null)
            setEditData({})
            fetchSlots()
        } catch (error: any) {
            console.error('Error updating slot:', error)
            alert('Failed to update slot: ' + error.message)
        }
    }

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Are you sure you want to delete this delivery slot?')) {
            return
        }

        try {
            const { error } = await supabase
                .from('delivery_slots')
                .delete()
                .eq('id', slotId)

            if (error) throw error

            alert('Delivery slot deleted successfully!')
            fetchSlots()
        } catch (error: any) {
            console.error('Error deleting slot:', error)
            alert('Failed to delete slot: ' + error.message)
        }
    }

    const handleBulkCreate = async () => {
        const days = parseInt(prompt('How many days ahead?', '7') || '0')
        if (days <= 0) return

        try {
            const slots = []
            const today = new Date()

            for (let i = 1; i <= days; i++) {
                const date = new Date(today)
                date.setDate(date.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]

                // Morning slot
                slots.push({
                    slot_date: dateStr,
                    start_time: '07:00:00',
                    end_time: '10:00:00',
                    max_orders: 50,
                    current_orders: 0,
                    is_active: true
                })

                // Evening slot
                slots.push({
                    slot_date: dateStr,
                    start_time: '17:00:00',
                    end_time: '20:00:00',
                    max_orders: 50,
                    current_orders: 0,
                    is_active: true
                })
            }

            const { error } = await supabase
                .from('delivery_slots')
                .insert(slots)

            if (error) throw error

            alert(`Created ${slots.length} delivery slots for the next ${days} days!`)
            fetchSlots()
        } catch (error: any) {
            console.error('Error bulk creating slots:', error)
            alert('Failed to create slots: ' + error.message)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatTime = (timeStr: string) => {
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading delivery slots...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Delivery Slots</h1>
                    <p className="text-gray-600 mt-1">Manage delivery time windows</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleBulkCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Bulk Create
                    </button>
                    <button
                        onClick={() => setShowAddSlot(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Slot
                    </button>
                </div>
            </div>

            {/* Add Slot Modal */}
            {showAddSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Delivery Slot</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={newSlot.slot_date}
                                    onChange={(e) => setNewSlot({ ...newSlot, slot_date: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={newSlot.start_time}
                                        onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={newSlot.end_time}
                                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Orders (leave empty for unlimited)
                                </label>
                                <input
                                    type="number"
                                    value={newSlot.max_orders || ''}
                                    onChange={(e) => setNewSlot({ ...newSlot, max_orders: parseInt(e.target.value) || 50 })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddSlot}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                            >
                                Add Slot
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddSlot(false)
                                    setNewSlot({
                                        slot_date: '',
                                        start_time: '07:00',
                                        end_time: '10:00',
                                        max_orders: 50
                                    })
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slots List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y">
                    {slots.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No delivery slots yet. Add your first slot!</p>
                        </div>
                    ) : (
                        slots.map(slot => (
                            <div key={slot.id} className="p-6 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {formatDate(slot.slot_date)}
                                        </h3>
                                        <span className="text-sm text-gray-600">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                                        {!slot.is_active && (
                                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                        Inactive
                      </span>
                                        )}
                                    </div>

                                    {editingSlot === slot.id ? (
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
                                                type="number"
                                                value={editData.max_orders || ''}
                                                onChange={(e) => setEditData({ ...editData, max_orders: parseInt(e.target.value) || null })}
                                                placeholder="Max orders"
                                                className="w-32 px-3 py-1 border rounded-lg text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>Orders: {slot.current_orders} / {slot.max_orders || '∞'}</span>
                                            {slot.max_orders && slot.current_orders >= slot.max_orders && (
                                                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                          Full
                        </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {editingSlot === slot.id ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdateSlot(slot.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingSlot(null)
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
                                                    setEditingSlot(slot.id)
                                                    setEditData({
                                                        max_orders: slot.max_orders,
                                                        is_active: slot.is_active
                                                    })
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSlot(slot.id)}
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
        </div>
    )
}