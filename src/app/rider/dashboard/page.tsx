// src/app/rider/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Package,
    MapPin,
    Phone,
    Clock,
    CheckCircle,
    Navigation,
    User,
    Bike,
    AlertCircle,
    Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Types
interface DeliverySlot {
    slot_date: string
    start_time: string
    end_time: string
}

interface Profile {
    full_name: string
    phone: string
}

interface GuestCustomer {
    full_name: string
    phone: string
}

interface Order {
    id: string
    order_number: string
    total_amount: string
    status: string
    payment_method: string
    payment_status: string
    delivery_address: string
    pin_code: string
    phone: string
    notes: string | null
    created_at: string
    rider_picked_at: string | null
    rider_delivered_at: string | null
    customer_rating: number | null
    customer_feedback: string | null
    delivery_slots: DeliverySlot | null
    profiles: Profile | null
    guest_customers: GuestCustomer | null
}

interface RawOrder {
    id: string
    order_number: string
    total_amount: string
    status: string
    payment_method: string
    payment_status: string
    delivery_address: string
    pin_code: string
    phone: string
    notes: string | null
    created_at: string
    rider_picked_at: string | null
    rider_delivered_at: string | null
    customer_rating: number | null
    customer_feedback: string | null
    delivery_slots: DeliverySlot[] | DeliverySlot | null
    profiles: Profile[] | Profile | null
    guest_customers: GuestCustomer[] | GuestCustomer | null
}

interface TodayOrder {
    total_amount: string
    payment_method: string
    payment_status: string
}

interface Stats {
    today: { delivered: number; earnings: number; collected: number }
    pending: number
    inProgress: number
}

interface FeedbackData {
    rating: number
    feedback: string
    paymentCollected: boolean
}

export default function RiderDashboardPage() {
    const [riderId, setRiderId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('assigned')
    const [orders, setOrders] = useState<Order[]>([])
    const [stats, setStats] = useState<Stats>({
        today: { delivered: 0, earnings: 0, collected: 0 },
        pending: 0,
        inProgress: 0
    })
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<Order | null>(null)
    const [feedbackData, setFeedbackData] = useState<FeedbackData>({
        rating: 5,
        feedback: '',
        paymentCollected: false
    })

    const router = useRouter()
    const supabase = createClient()

    // Helper function to normalize orders
    const normalizeOrder = (rawOrder: RawOrder): Order => ({
        ...rawOrder,
        delivery_slots: Array.isArray(rawOrder.delivery_slots)
            ? (rawOrder.delivery_slots[0] ?? null)
            : rawOrder.delivery_slots,
        profiles: Array.isArray(rawOrder.profiles)
            ? (rawOrder.profiles[0] ?? null)
            : rawOrder.profiles,
        guest_customers: Array.isArray(rawOrder.guest_customers)
            ? (rawOrder.guest_customers[0] ?? null)
            : rawOrder.guest_customers,
    })

    // Check authentication
    useEffect(() => {
        const checkRiderAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'rider') {
                alert('Access denied. This page is for riders only.')
                router.push('/')
                return
            }

            setRiderId(user.id)
            setLoading(false)
        }

        checkRiderAuth()
    }, [router, supabase])

    // Fetch orders when riderId or activeTab changes
    useEffect(() => {
        if (riderId) {
            const fetchOrders = async () => {
                let query = supabase
                    .from('orders')
                    .select(`
                        id,
                        order_number,
                        total_amount,
                        status,
                        payment_method,
                        payment_status,
                        delivery_address,
                        pin_code,
                        phone,
                        notes,
                        created_at,
                        rider_picked_at,
                        rider_delivered_at,
                        customer_rating,
                        customer_feedback,
                        delivery_slots:delivery_slot_id (slot_date, start_time, end_time),
                        profiles:user_id (full_name, phone),
                        guest_customers:guest_customer_id (full_name, phone)
                    `)
                    .eq('rider_id', riderId)
                    .order('created_at', { ascending: false })

                if (activeTab === 'assigned') {
                    query = query.eq('status', 'out_for_delivery')
                } else if (activeTab === 'completed') {
                    query = query.eq('status', 'delivered')
                }

                const { data } = await query

                if (data) {
                    const normalised: Order[] = (data as RawOrder[]).map(normalizeOrder)
                    setOrders(normalised)
                }
            }

            fetchOrders()
        }
    }, [riderId, activeTab, supabase])

    // Fetch stats when riderId changes
    useEffect(() => {
        if (riderId) {
            const fetchStats = async () => {
                const today = new Date().toISOString().split('T')[0]

                const { data: todayOrders } = await supabase
                    .from('orders')
                    .select('total_amount, payment_method, payment_status')
                    .eq('rider_id', riderId)
                    .eq('status', 'delivered')
                    .gte('created_at', today)

                const todayEarnings = (todayOrders as TodayOrder[] || []).reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                const todayCollected = (todayOrders as TodayOrder[] || [])
                    .filter(o => o.payment_method === 'cod' && o.payment_status === 'paid')
                    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

                const { count: inProgressCount } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('rider_id', riderId)
                    .eq('status', 'out_for_delivery')

                setStats({
                    today: {
                        delivered: (todayOrders as TodayOrder[] || []).length,
                        earnings: todayEarnings,
                        collected: todayCollected
                    },
                    pending: 0,
                    inProgress: inProgressCount || 0
                })
            }

            fetchStats()
        }
    }, [riderId, supabase])

    const handlePickup = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({
                rider_picked_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (!error && riderId) {
            // Refresh orders
            const { data } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total_amount,
                    status,
                    payment_method,
                    payment_status,
                    delivery_address,
                    pin_code,
                    phone,
                    notes,
                    created_at,
                    rider_picked_at,
                    rider_delivered_at,
                    customer_rating,
                    customer_feedback,
                    delivery_slots:delivery_slot_id (slot_date, start_time, end_time),
                    profiles:user_id (full_name, phone),
                    guest_customers:guest_customer_id (full_name, phone)
                `)
                .eq('rider_id', riderId)
                .eq('status', 'out_for_delivery')
                .order('created_at', { ascending: false })

            if (data) {
                const normalised: Order[] = (data as RawOrder[]).map(normalizeOrder)
                setOrders(normalised)
            }
            alert('Order marked as picked up!')
        }
    }

    const handleOpenFeedbackModal = (order: Order) => {
        setSelectedOrderForFeedback(order)
        setFeedbackData({
            rating: 5,
            feedback: '',
            paymentCollected: order.payment_method === 'cod'
        })
        setShowFeedbackModal(true)
    }

    const handleSubmitDelivery = async () => {
        if (!selectedOrderForFeedback || !riderId) return

        if (feedbackData.paymentCollected && selectedOrderForFeedback.payment_method === 'cod') {
            const confirmed = confirm(
                `Confirm: Received PKR ${selectedOrderForFeedback.total_amount} cash from customer?`
            )
            if (!confirmed) return
        }

        const { error } = await supabase
            .from('orders')
            .update({
                status: 'delivered',
                payment_status: feedbackData.paymentCollected ? 'paid' : 'pending',
                rider_delivered_at: new Date().toISOString(),
                customer_rating: feedbackData.rating,
                customer_feedback: feedbackData.feedback
            })
            .eq('id', selectedOrderForFeedback.id)

        if (!error) {
            await supabase
                .from('order_status_history')
                .insert({
                    order_id: selectedOrderForFeedback.id,
                    status: 'delivered',
                    notes: `Order delivered successfully. Payment ${feedbackData.paymentCollected ? 'collected' : 'pending'}`,
                    created_by: riderId
                })

            await supabase
                .from('rider_earnings')
                .insert({
                    rider_id: riderId,
                    order_id: selectedOrderForFeedback.id,
                    amount: parseFloat(selectedOrderForFeedback.total_amount),
                    payment_collected: feedbackData.paymentCollected
                })

            // Refresh orders
            const { data } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total_amount,
                    status,
                    payment_method,
                    payment_status,
                    delivery_address,
                    pin_code,
                    phone,
                    notes,
                    created_at,
                    rider_picked_at,
                    rider_delivered_at,
                    customer_rating,
                    customer_feedback,
                    delivery_slots:delivery_slot_id (slot_date, start_time, end_time),
                    profiles:user_id (full_name, phone),
                    guest_customers:guest_customer_id (full_name, phone)
                `)
                .eq('rider_id', riderId)
                .eq('status', 'out_for_delivery')
                .order('created_at', { ascending: false })

            if (data) {
                const normalised: Order[] = (data as RawOrder[]).map(normalizeOrder)
                setOrders(normalised)
            }

            // Refresh stats
            const today = new Date().toISOString().split('T')[0]
            const { data: todayOrders } = await supabase
                .from('orders')
                .select('total_amount, payment_method, payment_status')
                .eq('rider_id', riderId)
                .eq('status', 'delivered')
                .gte('created_at', today)

            const todayEarnings = (todayOrders as TodayOrder[] || []).reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
            const todayCollected = (todayOrders as TodayOrder[] || [])
                .filter(o => o.payment_method === 'cod' && o.payment_status === 'paid')
                .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

            const { count: inProgressCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('rider_id', riderId)
                .eq('status', 'out_for_delivery')

            setStats({
                today: {
                    delivered: (todayOrders as TodayOrder[] || []).length,
                    earnings: todayEarnings,
                    collected: todayCollected
                },
                pending: 0,
                inProgress: inProgressCount || 0
            })

            setShowFeedbackModal(false)
            setSelectedOrderForFeedback(null)
            alert('Order marked as delivered!')
        }
    }

    const getCustomerName = (order: Order): string => {
        return order.profiles?.full_name || order.guest_customers?.full_name || 'Customer'
    }

    const getCustomerPhone = (order: Order): string => {
        return order.phone || order.profiles?.phone || order.guest_customers?.phone || ''
    }

    const formatTime = (timeStr: string | null | undefined): string => {
        if (!timeStr) return ''
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0 z-10 shadow-lg">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bike className="w-8 h-8" />
                            <div>
                                <h1 className="text-xl font-bold">Rider Dashboard</h1>
                                <p className="text-xs text-green-100">Fresh Veggies Delivery</p>
                            </div>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                            className="text-sm px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-gray-600">Today</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.today.delivered}</p>
                        <p className="text-xs text-gray-500">Deliveries</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Collected</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            PKR {stats.today.collected.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">Cash Today</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-600">Earnings</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            PKR {stats.today.earnings.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">Total Today</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Bike className="w-5 h-5 text-orange-600" />
                            <span className="text-sm text-gray-600">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                        <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-y border-gray-200 sticky top-[73px] z-10">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${
                            activeTab === 'assigned'
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-gray-600'
                        }`}
                    >
                        My Deliveries ({stats.inProgress})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${
                            activeTab === 'completed'
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-gray-600'
                        }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="p-4 space-y-4 pb-20">
                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {activeTab === 'assigned' && 'No active deliveries'}
                            {activeTab === 'completed' && 'No completed deliveries'}
                        </p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900">#{order.order_number}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600">
                                            PKR {parseFloat(order.total_amount).toFixed(0)}
                                        </p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                            order.payment_method === 'cod'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {order.payment_method === 'cod' ? '💵 COD' : '💳 Online'}
                                        </span>
                                    </div>
                                </div>

                                {order.delivery_slots && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {new Date(order.delivery_slots.slot_date).toLocaleDateString()} •
                                            {formatTime(order.delivery_slots.start_time)} - {formatTime(order.delivery_slots.end_time)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
                                        <a
                                            href={`tel:${getCustomerPhone(order)}`}
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <Phone className="w-3 h-3" />
                                            {getCustomerPhone(order)}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{order.delivery_address}</p>
                                        <p className="text-xs text-gray-500">PIN: {order.pin_code}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const address = encodeURIComponent(order.delivery_address)
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank')
                                        }}
                                        className="p-2 bg-green-50 rounded-lg hover:bg-green-100"
                                    >
                                        <Navigation className="w-5 h-5 text-green-600" />
                                    </button>
                                </div>

                                {order.notes && (
                                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-900">{order.notes}</p>
                                    </div>
                                )}

                                {activeTab === 'completed' && order.customer_rating && (
                                    <div className="border-t pt-3 mt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${
                                                        i < order.customer_rating!
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        {order.customer_feedback && (
                                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                {order.customer_feedback}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t">
                                {activeTab === 'assigned' && (
                                    <div className="space-y-2">
                                        {!order.rider_picked_at && (
                                            <button
                                                onClick={() => handlePickup(order.id)}
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                                            >
                                                Mark as Picked Up
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenFeedbackModal(order)}
                                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Complete Delivery
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'completed' && (
                                    <div className="text-center text-sm text-gray-600">
                                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <p>Delivered on {new Date(order.rider_delivered_at!).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Payment: {order.payment_status === 'paid' ? '✅ Collected' : '⏳ Pending'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && selectedOrderForFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">Complete Delivery</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Order: {selectedOrderForFeedback.order_number}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Satisfaction
                                </label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => setFeedbackData({ ...feedbackData, rating })}
                                            className="p-1"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${
                                                    rating <= feedbackData.rating
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Notes (Optional)
                                </label>
                                <textarea
                                    value={feedbackData.feedback}
                                    onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    placeholder="Any notes about the delivery..."
                                />
                            </div>

                            {selectedOrderForFeedback.payment_method === 'cod' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={feedbackData.paymentCollected}
                                            onChange={(e) => setFeedbackData({ ...feedbackData, paymentCollected: e.target.checked })}
                                            className="w-5 h-5 text-green-600 rounded"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Payment Collected</p>
                                            <p className="text-sm text-gray-600">
                                                PKR {selectedOrderForFeedback.total_amount} received from customer
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex gap-3">
                            <button
                                onClick={() => {
                                    setShowFeedbackModal(false)
                                    setSelectedOrderForFeedback(null)
                                }}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitDelivery}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Confirm Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}