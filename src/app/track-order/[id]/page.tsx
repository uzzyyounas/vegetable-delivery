'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
    Package, CheckCircle, Clock, Box, Truck, XCircle, MapPin
} from 'lucide-react'
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

export default function TrackOrderByIdPage() {
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return

        const fetchOrder = async () => {
            setLoading(true)
            setError('')

            const { data, error } = await supabase
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
                .eq('id', id)
                .maybeSingle()

            if (error) {
                console.error(error)
                setError('Unable to load order.')
            } else if (!data) {
                setError('Order not found.')
            } else {
                if (data.order_status_history) {
                    data.order_status_history.sort(
                        (a: any, b: any) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                    )
                }
                setOrder(data as Order)
            }

            setLoading(false)
        }

        fetchOrder()
    }, [id])

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

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

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                {error}
            </div>
        )
    }

    if (!order) return null

    return (
        <div className="min-h-screen bg-green-50 px-4 py-10">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Order Tracking
                    </h1>
                    <Link href="/profile" className="text-green-600 font-medium">
                        Back to Profile
                    </Link>
                </div>

                {/* Status Timeline */}
                {/*<div className="bg-white rounded-xl shadow-lg p-6">*/}
                {/*    <div className="flex justify-between items-center">*/}
                {/*        {getSteps().map((step, index) => {*/}
                {/*            const Icon = step.icon*/}
                {/*            const active = index <= currentIndex*/}
                {/*            return (*/}
                {/*                <div key={step.status} className="flex-1 text-center">*/}
                {/*                    <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-2 ${*/}
                {/*                        active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'*/}
                {/*                    }`}>*/}
                {/*                        <Icon className="w-6 h-6" />*/}
                {/*                    </div>*/}
                {/*                    <p className={`text-sm font-semibold ${*/}
                {/*                        active ? 'text-green-600' : 'text-gray-400'*/}
                {/*                    }`}>*/}
                {/*                        {step.label}*/}
                {/*                    </p>*/}
                {/*                </div>*/}
                {/*            )*/}
                {/*        })}*/}
                {/*    </div>*/}
                {/*</div>*/}

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
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">Payment Status</p>
                                <p className={`font-semibold text-sm sm:text-base ${
                                    order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                    {formatStatus(order.payment_status)}
                                </p>
                            </div>
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

                {/* Items */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-4">
                        Items ({order.order_items.length})
                    </h3>
                    {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between py-2 border-b">
                            <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">
                                    {item.quantity} × Rs.{item.unit_price}
                                </p>
                            </div>
                            <p className="font-semibold">
                                Rs.{item.subtotal.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
