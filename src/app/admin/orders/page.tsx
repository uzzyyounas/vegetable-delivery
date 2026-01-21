// src/app/admin/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderTracker'
import Link from 'next/link'

interface Order {
    id: string
    order_number: string
    total_amount: number
    status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
    payment_status: string
    phone: string
    email: string | null
    pin_code: string
    delivery_address: string
    created_at: string
    delivery_slot: {
        slot_date: string
        start_time: string
        end_time: string
    } | null
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showOrderDetails, setShowOrderDetails] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
    }, [])

    useEffect(() => {
        filterOrders()
    }, [searchTerm, statusFilter, orders])

    const fetchOrders = async () => {
        setIsLoading(true)

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        delivery_slot:delivery_slots(slot_date, start_time, end_time)
      `)
            .order('created_at', { ascending: false })
            .limit(100)

        if (data) {
            setOrders(data as Order[])
        }

        setIsLoading(false)
    }

    const filterOrders = () => {
        let filtered = [...orders]

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.phone.includes(searchTerm) ||
                order.pin_code.includes(searchTerm) ||
                (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }

        setFilteredOrders(filtered)
    }

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!confirm(`Update order status to "${newStatus}"?`)) {
            return
        }

        try {
            // Update order status
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)

            if (updateError) throw updateError

            // Add to status history
            await supabase
                .from('order_status_history')
                .insert({
                    order_id: orderId,
                    status: newStatus,
                    notes: 'Status updated by admin'
                })

            alert('Order status updated successfully!')
            fetchOrders()
            setShowOrderDetails(false)
        } catch (error: any) {
            console.error('Error updating status:', error)
            alert('Failed to update status: ' + error.message)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatSlot = (slot: Order['delivery_slot']) => {
        if (!slot) return 'No slot'

        const date = new Date(slot.slot_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        })

        const startTime = new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })

        const endTime = new Date(`2000-01-01T${slot.end_time}`).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })

        return `${date}, ${startTime}-${endTime}`
    }

    const statusOptions = [
        { value: 'all', label: 'All Orders', count: orders.length },
        { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
        { value: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
        { value: 'packed', label: 'Packed', count: orders.filter(o => o.status === 'packed').length },
        { value: 'out_for_delivery', label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length },
        { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
        { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading orders...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600 mt-1">Manage customer orders</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by order number, phone, email, pin code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label} ({option.count})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No orders found
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{order.order_number}</p>
                                            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm text-gray-900">{order.phone}</p>
                                            {order.email && (
                                                <p className="text-xs text-gray-500">{order.email}</p>
                                            )}
                                            <p className="text-xs text-gray-500">PIN: {order.pin_code}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">Rs.{order.total_amount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">{order.payment_status}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-700">{formatSlot(order.delivery_slot)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                target="_blank"
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order)
                                                    setShowOrderDetails(true)
                                                }}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <Package className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Status Update Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Update Order Status
                        </h2>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">Order Number</p>
                            <p className="font-semibold text-gray-900">{selectedOrder.order_number}</p>

                            <p className="text-sm text-gray-600 mt-3 mb-1">Current Status</p>
                            <OrderStatusBadge status={selectedOrder.status} />
                        </div>

                        <div className="space-y-2 mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Change to:</p>

                            {selectedOrder.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'confirmed')}
                                        className="w-full flex items-center gap-3 px-4 py-3 border-2 border-green-200 rounded-lg hover:bg-green-50"
                                    >
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium">Confirm Order</span>
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                                        className="w-full flex items-center gap-3 px-4 py-3 border-2 border-red-200 rounded-lg hover:bg-red-50"
                                    >
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium">Cancel Order</span>
                                    </button>
                                </>
                            )}

                            {selectedOrder.status === 'confirmed' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'packed')}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-2 border-purple-200 rounded-lg hover:bg-purple-50"
                                >
                                    <Package className="w-5 h-5 text-purple-600" />
                                    <span className="font-medium">Mark as Packed</span>
                                </button>
                            )}

                            {selectedOrder.status === 'packed' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'out_for_delivery')}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-2 border-orange-200 rounded-lg hover:bg-orange-50"
                                >
                                    <Truck className="w-5 h-5 text-orange-600" />
                                    <span className="font-medium">Out for Delivery</span>
                                </button>
                            )}

                            {selectedOrder.status === 'out_for_delivery' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-2 border-green-200 rounded-lg hover:bg-green-50"
                                >
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">Mark as Delivered</span>
                                </button>
                            )}

                            {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    This order is {selectedOrder.status}. No further actions available.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setShowOrderDetails(false)
                                setSelectedOrder(null)
                            }}
                            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}