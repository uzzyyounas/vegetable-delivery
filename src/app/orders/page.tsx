// src/app/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface OrderItem {
    id: string
    product_name: string
    weight_grams: number
    quantity: number
    price: number
}

interface Order {
    id: string
    order_number: string
    status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
    total_amount: number
    created_at: string
    delivery_address: string
    order_items: OrderItem[]
    status_history: Array<{
        status: string
        timestamp: string
        notes?: string
    }>
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    const supabase = createClient()

    useEffect(() => {
        initializeUser()
    }, [])

    const initializeUser = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
            setUser(currentUser)
            await fetchOrders(currentUser.id)
        } else {
            window.location.href = '/login'
        }
    }

    const fetchOrders = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(
                        id,
                        product_id,
                        product_name,
                        weight_grams,
                        quantity,
                        unit_price
                    ),
                    order_status_history(
                        status,
                        created_at,
                        notes
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (data) {
                setOrders(data as Order[])
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />
            case 'processing':
                return <Package className="w-5 h-5 text-blue-600" />
            case 'packed':
                return <CheckCircle className="w-5 h-5 text-indigo-600" />
            case 'out_for_delivery':
                return <Truck className="w-5 h-5 text-purple-600" />
            case 'delivered':
                return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-600" />
            default:
                return <Clock className="w-5 h-5 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'packed':
                return 'bg-indigo-100 text-indigo-800 border-indigo-300'
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800 border-purple-300'
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Orders</h1>
                    <p className="text-gray-600">View and track all your orders in one place</p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                        <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping!</p>
                        <Link
                            href="/"
                            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                Order #{order.order_number}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Placed on {formatDate(order.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 mt-3 md:mt-0">
                                            <span className={`px-4 py-2 rounded-lg border font-semibold text-sm flex items-center gap-2 ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {formatStatus(order.status)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                            <p className="text-xl font-bold text-green-600">
                                                Rs.{order.total_amount.toFixed(2)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                Delivery Address
                                            </p>
                                            <p className="text-sm text-gray-900">{order.delivery_address}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <span className="font-semibold text-gray-900">
                                            View Details ({order.order_items.length} items)
                                        </span>
                                        {expandedOrder === order.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-600" />
                                        )}
                                    </button>

                                    {expandedOrder === order.id && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                                                <div className="space-y-2">
                                                    {order.order_items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                                    {' × '}{item.quantity}
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold text-gray-900">
                                                                Rs.{(item.price * item.quantity).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
                                                <div className="relative pl-8 space-y-4">
                                                    {order.status_history?.map((history, index) => (
                                                        <div key={index} className="relative">
                                                            <div className="absolute -left-8 mt-1">
                                                                {getStatusIcon(history.status)}
                                                            </div>
                                                            {index < (order.status_history?.length || 0) - 1 && (
                                                                <div className="absolute -left-5.5 top-7 w-0.5 h-full bg-gray-300"></div>
                                                            )}
                                                            <div className="pb-4">
                                                                <p className="font-semibold text-gray-900">
                                                                    {formatStatus(history.status)}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {formatDate(history.timestamp)}
                                                                </p>
                                                                {history.notes && (
                                                                    <p className="text-sm text-gray-700 mt-1">{history.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}