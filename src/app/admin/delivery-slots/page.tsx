// src/app/admin/delivery-slots/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Calendar,
    Clock,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    X,
    Save,
    Search
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Delivery Slot Modal Component
const DeliverySlotModal = ({ isOpen, onClose, slot, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        slot_date: '',
        start_time: '',
        end_time: '',
        max_orders: 10,
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (slot) {
                loadSlotData();
            } else {
                resetForm();
            }
        }
    }, [isOpen, slot]);

    const loadSlotData = () => {
        setFormData({
            slot_date: slot.date || '',
            start_time: slot.startTime || '',
            end_time: slot.endTime || '',
            max_orders: slot.maxOrders || 10,
            is_active: slot.isActive ?? true
        });
    };

    const resetForm = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
            slot_date: tomorrow.toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '12:00',
            max_orders: 10,
            is_active: true
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.slot_date || !formData.start_time || !formData.end_time) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.start_time >= formData.end_time) {
            alert('End time must be after start time');
            return;
        }

        setLoading(true);
        try {
            const slotData = {
                slot_date: formData.slot_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                max_orders: parseInt(formData.max_orders),
                is_active: formData.is_active,
                current_orders: slot?.currentOrders || 0
            };

            if (slot) {
                const { error } = await supabase
                    .from('delivery_slots')
                    .update(slotData)
                    .eq('id', slot.id);

                if (error) throw error;
                alert('Delivery slot updated successfully!');
            } else {
                const { error } = await supabase
                    .from('delivery_slots')
                    .insert(slotData);

                if (error) throw error;
                alert('Delivery slot created successfully!');
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving delivery slot:', error);
            alert('Failed to save delivery slot');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {slot ? 'Edit Delivery Slot' : 'Add New Delivery Slot'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            Delivery Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="slot_date"
                            value={formData.slot_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4" />
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4" />
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Orders <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="max_orders"
                            value={formData.max_orders}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Slot Status</p>
                            <p className="text-sm text-gray-500">
                                {formData.is_active ? 'Available for booking' : 'Hidden'}
                            </p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">Active</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-green-600"></div>
                                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {slot ? 'Update' : 'Create'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Delivery Slots Component
const DeliverySlots = () => {
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchSlots();
    }, [dateFrom, dateTo]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('delivery_slots')
                .select('*')
                .order('slot_date', { ascending: false })
                .order('start_time', { ascending: true });

            if (dateFrom) {
                query = query.gte('slot_date', dateFrom);
            }
            if (dateTo) {
                query = query.lte('slot_date', dateTo);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching slots:', error);
                return;
            }

            const formattedSlots = data.map(slot => ({
                id: slot.id,
                date: slot.slot_date,
                startTime: slot.start_time.substring(0, 5),
                endTime: slot.end_time.substring(0, 5),
                maxOrders: slot.max_orders,
                currentOrders: slot.current_orders,
                isActive: slot.is_active
            }));

            setSlots(formattedSlots);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (slotId, currentStatus) => {
        const { error } = await supabase
            .from('delivery_slots')
            .update({ is_active: !currentStatus })
            .eq('id', slotId);

        if (!error) fetchSlots();
    };

    const handleDelete = async (slotId) => {
        if (confirm('Are you sure you want to delete this delivery slot?')) {
            const { error } = await supabase
                .from('delivery_slots')
                .delete()
                .eq('id', slotId);

            if (!error) fetchSlots();
        }
    };

    const handleEdit = (slot) => {
        setSelectedSlot(slot);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedSlot(null);
        setShowModal(true);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAvailabilityColor = (current, max) => {
        const percentage = (current / max) * 100;
        if (percentage >= 100) return 'bg-red-100 text-red-800';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getAvailabilityStatus = (current, max) => {
        const percentage = (current / max) * 100;
        if (percentage >= 100) return 'Full';
        if (percentage >= 70) return 'Limited';
        return 'Available';
    };

    const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {});

    const today = new Date().toISOString().split('T')[0];
    const todaySlots = slots.filter(s => s.date === today);
    const activeCount = slots.filter(s => s.isActive).length;
    const inactiveCount = slots.filter(s => !s.isActive).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Delivery Slots</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage delivery time slots and capacity</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Slot</span>
                </button>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Slots</p>
                            <p className="text-2xl font-bold text-gray-900">{slots.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Today's Slots</p>
                            <p className="text-2xl font-bold text-gray-900">{todaySlots.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <EyeOff className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Inactive</p>
                            <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <div className="space-y-6">
                        {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                            <div key={date}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-gray-900">{formatDate(date)}</h3>
                                    <span className="text-sm text-gray-500">
                                        {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dateSlots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`border rounded-lg p-4 transition-all ${
                                                slot.isActive ? 'border-gray-200 hover:border-green-300 hover:shadow-md' : 'border-gray-200 bg-gray-50 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-gray-400" />
                                                    <span className="font-semibold text-gray-900">
                                                        {slot.startTime} - {slot.endTime}
                                                    </span>
                                                </div>
                                                {slot.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Capacity</span>
                                                    <span className="font-medium text-gray-900">{slot.currentOrders} / {slot.maxOrders}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            (slot.currentOrders / slot.maxOrders) >= 1 ? 'bg-red-500' :
                                                                (slot.currentOrders / slot.maxOrders) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${(slot.currentOrders / slot.maxOrders) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(slot.currentOrders, slot.maxOrders)}`}>
                                                    {getAvailabilityStatus(slot.currentOrders, slot.maxOrders)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t">
                                                <button
                                                    onClick={() => handleEdit(slot)}
                                                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-1"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(slot.id)}
                                                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                    <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-900">{formatDate(date)}</h3>
                            <p className="text-sm text-gray-500 mt-1">{dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="p-4 space-y-3">
                            {dateSlots.map((slot) => (
                                <div key={slot.id} className={`border rounded-lg p-4 ${slot.isActive ? 'border-gray-200' : 'bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="font-semibold text-gray-900">{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(slot.currentOrders, slot.maxOrders)}`}>
                                            {getAvailabilityStatus(slot.currentOrders, slot.maxOrders)}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Orders</span>
                                            <span className="font-medium text-gray-900">{slot.currentOrders} / {slot.maxOrders}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    (slot.currentOrders / slot.maxOrders) >= 1 ? 'bg-red-500' :
                                                        (slot.currentOrders / slot.maxOrders) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${(slot.currentOrders / slot.maxOrders) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(slot)}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4 inline mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(slot.id)}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4 inline mr-1" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DeliverySlotModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedSlot(null);
                }}
                slot={selectedSlot}
                onSave={fetchSlots}
            />
        </div>
    );
};

export default DeliverySlots;