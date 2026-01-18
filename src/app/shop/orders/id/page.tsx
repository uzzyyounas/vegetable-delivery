// src/app/(shop)/orders/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle, MapPin, Clock, Phone, Mail, Package } from 'lucide-react'
import OrderTracker from '@/components/orders/OrderTracker'
import Link from 'next/link'

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createServerSupabaseClient()

    // Fetch order with all details
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items(*),
      delivery_slot:delivery_slots(*),
      guest_customer:guest_customers(*)
    `)
        .eq('id', params.id)
        .single()

    if (error || !order) {
        notFound()
    }

    // Fetch status history
    const { data: statusHistory } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true })

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatSlotTime = (slot: any) => {
        const date = new Date(slot.slot_date)
        const dateStr = date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
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

        return `${dateStr}, ${startTime} - ${endTime}`
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h1>
                            <p className="text-gray-600">Order #{order.order_number}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Tracker */}
                        <OrderTracker
                            currentStatus={order.status}
                            statusHistory={statusHistory || []}
                        />

                        {/* Order Items */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Order Items
                            </h3>

                            <div className="space-y-3">
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.product_name}</p>
                                            <p className="text-sm text-gray-600">
                                                {item.weight_grams >= 1000
                                                    ? `${item.weight_grams / 1000} kg`
                                                    : `${item.weight_grams} g`
                                                } × {item.quantity} = ₹{item.unit_price.toFixed(2)} each
                                            </p>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                      ₹{item.subtotal.toFixed(2)}
                    </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-green-600">
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Delivery Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Delivery Details</h3>

                            <div className="space-y-4">
                                {order.delivery_slot && (
                                    <div className="flex gap-3">
                                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Delivery Slot</p>
                                            <p className="text-sm text-gray-900">{formatSlotTime(order.delivery_slot)}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                                        <p className="text-sm text-gray-900">
                                            {order.delivery_address}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">PIN: {order.pin_code}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Contact</p>
                                        <p className="text-sm text-gray-900">{order.phone}</p>
                                    </div>
                                </div>

                                {order.email && (
                                    <div className="flex gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                            <p className="text-sm text-gray-900">{order.email}</p>
                                        </div>
                                    </div>
                                )}

                                {order.notes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Delivery Notes</p>
                                        <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Information</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order Number</span>
                                    <span className="font-medium text-gray-900">{order.order_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Placed On</span>
                                    <span className="font-medium text-gray-900">
                    {formatDate(order.created_at)}
                  </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Status</span>
                                    <span className={`font-medium ${
                                        order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Cash on Delivery'}
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                href="/"
                                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700"
                            >
                                Continue Shopping
                            </Link>

                            {order.status === 'pending' && (
                                <button className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-medium hover:bg-red-50">
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}