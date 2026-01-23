// src/app/order-success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Package, Truck, Home, Phone } from 'lucide-react'
import Link from 'next/link'

export default function OrderSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderNumber = searchParams.get('order')
    const orderId = searchParams.get('id')

    useEffect(() => {
        // Clear cart after successful order
        localStorage.removeItem('vegetable_cart')
    }, [])

    if (!orderNumber || !orderId) {
        router.push('/')
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            <div className="max-w-2xl mx-auto px-4 py-16">
                {/* Success Animation */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
                    <p className="text-lg text-gray-600">Thank you for your order</p>
                </div>

                {/* Order Details Card */}
                <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-8 mb-6">
                    <div className="text-center mb-6 pb-6 border-b border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Order Number</p>
                        <p className="text-2xl font-bold text-green-600">{orderNumber}</p>
                    </div>

                    <div className="space-y-6">
                        {/* What's Next */}
                        <div>
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-green-600" />
                                What's Next?
                            </h2>

                            <div className="space-y-3">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Order Confirmation</p>
                                        <p className="text-sm text-gray-600">We'll send you an email/SMS confirmation shortly</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Order Processing</p>
                                        <p className="text-sm text-gray-600">We'll prepare your fresh vegetables</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Delivery</p>
                                        <p className="text-sm text-gray-600">Your order will be delivered in your selected time slot</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Track Order */}
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Truck className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-900">Track Your Order</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Get real-time updates on your order status
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href={`/track-order/${orderId}`}
                        className="block w-full bg-green-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Track My Order
                    </Link>

                    <Link
                        href="/"
                        className="block w-full border-2 border-gray-300 text-gray-700 text-center py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                </div>

                {/* Support */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
                    <a
                        href="tel:+923001234567"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                    >
                        <Phone className="w-4 h-4" />
                        Contact Support
                    </a>
                </div>

                {/* Email Confirmation Note */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-800">
                        📧 A confirmation email has been sent to your email address
                    </p>
                </div>
            </div>
        </div>
    )
}