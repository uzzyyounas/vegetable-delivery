// src/app/track-order/page.tsx
'use client'

import { useState } from 'react'
import { Package, Search, CheckCircle, Clock, Box, Truck, XCircle, MapPin, Phone, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface OrderItem {
    id: string
    product_name: string
    weight_grams: number
    quantity: number
    unit_price: number
    subtotal: number
}

interface Order {
    id: string
    order_number: string
    status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
    payment_status: string
    total_amount: number
    created_at: string
    delivery_address: string
    pin_code: string
    phone: string
    email?: string
    notes?: string
    order_items: OrderItem[]
    order_status_history: Array<{
        status: string
        created_at: string
        notes?: string
    }>
}

export default function TrackOrderPage() {
    const [orderNumber, setOrderNumber] = useState('')
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()

    const trackOrder = async () => {
        if (!orderNumber.trim()) {
            setError('Please enter an order number')
            return
        }

        setLoading(true)
        setError('')
        setOrder(null)

        try {
            // Query orders table without authentication
            // Works with your existing schema
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(
                        id,
                        product_name,
                        weight_grams,
                        quantity,
                        unit_price,
                        subtotal
                    ),
                    order_status_history(
                        status,
                        created_at,
                        notes
                    )
                `)
                .eq('order_number', orderNumber.trim().toUpperCase())
                .maybeSingle()

            if (fetchError) {
                console.error('Database error:', fetchError)
                setError('Error tracking order. Please try again.')
            } else if (!data) {
                setError('Order not found. Please check your order number and try again.')
            } else {
                // Sort status history by date (newest first for display)
                if (data.order_status_history) {
                    data.order_status_history.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                }
                setOrder(data as Order)
            }
        } catch (err) {
            console.error('Error:', err)
            setError('Error tracking order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            trackOrder()
        }
    }

    const getOrderSteps = () => {
        const allSteps = [
            { status: 'pending', label: 'Pending', icon: Clock },
            { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
            { status: 'packed', label: 'Packed', icon: Box },
            { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
            { status: 'delivered', label: 'Delivered', icon: CheckCircle }
        ]

        if (order?.status === 'cancelled') {
            return [
                { status: 'pending', label: 'Pending', icon: Clock },
                { status: 'cancelled', label: 'Cancelled', icon: XCircle }
            ]
        }

        return allSteps
    }

    const getCurrentStepIndex = () => {
        const steps = getOrderSteps()
        return steps.findIndex(step => step.status === order?.status)
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

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Track Your Order</h1>
                                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Enter your order number to track</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                {/* Search Box */}
                <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Track Your Order</h2>
                            <p className="text-sm sm:text-base text-gray-600">Enter your order number to see real-time tracking</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder="Order Number (e.g., ORD-20250122-000001)"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={trackOrder}
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base sm:text-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Tracking...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Track Order</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                            <p>Your order number can be found in your confirmation email or SMS</p>
                        </div>
                    </div>
                </div>

                {/* Order Details */}
                {order && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Status Timeline */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Order Status</h3>

                            {/* Progress Bar - Desktop */}
                            <div className="relative mb-12 hidden md:block">
                                <div className="flex justify-between items-center">
                                    {getOrderSteps().map((step, index) => {
                                        const currentIndex = getCurrentStepIndex()
                                        const isCompleted = index <= currentIndex
                                        const isCurrent = index === currentIndex
                                        const Icon = step.icon
                                        const isCancelled = order.status === 'cancelled'

                                        return (
                                            <div key={step.status} className="flex flex-col items-center flex-1 relative">
                                                {index > 0 && (
                                                    <div
                                                        className={`absolute top-8 -left-1/2 w-full h-1 -z-10 transition-all ${
                                                            isCancelled && step.status === 'cancelled'
                                                                ? 'bg-red-300'
                                                                : isCompleted
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gray-200'
                                                        }`}
                                                        style={{ width: 'calc(100% - 2rem)' }}
                                                    ></div>
                                                )}

                                                <div
                                                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all z-10 ${
                                                        isCancelled && step.status === 'cancelled'
                                                            ? 'bg-red-500 ring-4 ring-red-200'
                                                            : isCurrent
                                                                ? 'bg-green-500 ring-4 ring-green-200 animate-pulse'
                                                                : isCompleted
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`w-8 h-8 ${
                                                            isCancelled && step.status === 'cancelled'
                                                                ? 'text-white'
                                                                : isCompleted
                                                                    ? 'text-white'
                                                                    : 'text-gray-400'
                                                        }`}
                                                    />
                                                </div>

                                                <p
                                                    className={`text-sm font-semibold text-center px-2 ${
                                                        isCancelled && step.status === 'cancelled'
                                                            ? 'text-red-700'
                                                            : isCurrent
                                                                ? 'text-green-600'
                                                                : isCompleted
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-400'
                                                    }`}
                                                >
                                                    {step.label}
                                                </p>

                                                {isCurrent && order.order_status_history && (
                                                    <p className="text-xs text-gray-500 mt-1 text-center">
                                                        {formatDate(
                                                            order.order_status_history.find(h => h.status === step.status)?.created_at ||
                                                            order.created_at
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Progress Bar - Mobile */}
                            <div className="relative mb-12 md:hidden">
                                <div className="space-y-6">
                                    {getOrderSteps().map((step, index) => {
                                        const currentIndex = getCurrentStepIndex()
                                        const isCompleted = index <= currentIndex
                                        const isCurrent = index === currentIndex
                                        const Icon = step.icon
                                        const isCancelled = order.status === 'cancelled'

                                        return (
                                            <div key={step.status} className="flex items-start gap-4 relative">
                                                {index < getOrderSteps().length - 1 && (
                                                    <div
                                                        className={`absolute left-7 top-16 w-0.5 h-14 transition-all ${
                                                            isCancelled && step.status === 'cancelled'
                                                                ? 'bg-red-300'
                                                                : isCompleted
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gray-200'
                                                        }`}
                                                    ></div>
                                                )}

                                                <div
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                                        isCancelled && step.status === 'cancelled'
                                                            ? 'bg-red-500 ring-4 ring-red-200'
                                                            : isCurrent
                                                                ? 'bg-green-500 ring-4 ring-green-200 animate-pulse'
                                                                : isCompleted
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`w-7 h-7 ${
                                                            isCancelled && step.status === 'cancelled'
                                                                ? 'text-white'
                                                                : isCompleted
                                                                    ? 'text-white'
                                                                    : 'text-gray-400'
                                                        }`}
                                                    />
                                                </div>

                                                <div className="flex-1 pt-2">
                                                    <p
                                                        className={`text-base font-semibold mb-1 ${
                                                            isCancelled && step.status === 'cancelled'
                                                                ? 'text-red-700'
                                                                : isCurrent
                                                                    ? 'text-green-600'
                                                                    : isCompleted
                                                                        ? 'text-gray-900'
                                                                        : 'text-gray-400'
                                                        }`}
                                                    >
                                                        {step.label}
                                                    </p>

                                                    {(isCurrent || isCompleted) && order.order_status_history && (
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(
                                                                order.order_status_history.find(h => h.status === step.status)?.created_at ||
                                                                order.created_at
                                                            )}
                                                        </p>
                                                    )}

                                                    {isCurrent && order.order_status_history?.find(h => h.status === step.status)?.notes && (
                                                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                                            {order.order_status_history.find(h => h.status === step.status)?.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Current Status Message */}
                            <div className={`text-center p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                                order.status === 'cancelled'
                                    ? 'bg-red-50 border border-red-200'
                                    : order.status === 'delivered'
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-blue-50 border border-blue-200'
                            }`}>
                                <p className={`font-semibold ${
                                    order.status === 'cancelled'
                                        ? 'text-red-700'
                                        : order.status === 'delivered'
                                            ? 'text-green-700'
                                            : 'text-blue-700'
                                }`}>
                                    {order.status === 'delivered' && '🎉 Your order has been delivered!'}
                                    {order.status === 'out_for_delivery' && '🚚 Your order is out for delivery'}
                                    {order.status === 'packed' && '📦 Your order has been packed'}
                                    {order.status === 'confirmed' && '✅ Your order has been confirmed'}
                                    {order.status === 'pending' && '⏳ Your order is being processed'}
                                    {order.status === 'cancelled' && '❌ This order has been cancelled'}
                                </p>
                            </div>
                        </div>

                        {/* Order Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Order Details */}
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                                <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                    Order Details
                                </h4>
                                <div className="space-y-2 sm:space-y-3">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Order Number</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base break-all">{order.order_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Order Date</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(order.created_at)}</p>
                                    </div>
                                    {/*<div>*/}
                                    {/*    <p className="text-xs sm:text-sm text-gray-600">Payment Status</p>*/}
                                    {/*    <p className={`font-semibold text-sm sm:text-base ${*/}
                                    {/*        order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'*/}
                                    {/*    }`}>*/}
                                    {/*        {formatStatus(order.payment_status)}*/}
                                    {/*    </p>*/}
                                    {/*</div>*/}
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                                        <p className="text-xl sm:text-2xl font-bold text-green-600">Rs.{order.total_amount.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Information */}
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                                <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                    Delivery Information
                                </h4>
                                <div className="space-y-2 sm:space-y-3">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Delivery Address</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{order.delivery_address}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Pin Code</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{order.pin_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Contact Number</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{order.phone}</p>
                                    </div>
                                    {order.email && (
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Email</p>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base break-all">{order.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Order Items ({order.order_items.length})</h4>
                            <div className="divide-y">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="py-3 sm:py-4 flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">{item.product_name}</p>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                {' × '}{item.quantity}
                                                {' @ Rs.'}{item.unit_price.toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm sm:text-base flex-shrink-0">
                                            Rs.{item.subtotal.toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                                        Rs.{order.total_amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}