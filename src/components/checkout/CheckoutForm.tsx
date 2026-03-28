// src/components/checkout/CheckoutForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Mail, Phone, MapPin, FileText, Loader2, CheckCircle, Banknote, Wallet, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DeliverySlot, CheckoutData } from '@/lib/types/database.types'

interface CheckoutFormProps {
    totalAmount: number
    onSubmit: (data: CheckoutData) => Promise<void>
    userEmail?: string
    userPhone?: string
    paymentMethod?: 'cod' | 'online'
    onPaymentMethodChange?: (method: 'cod' | 'online') => void
}

export default function CheckoutForm({
                                         totalAmount,
                                         onSubmit,
                                         userEmail,
                                         userPhone,
                                         paymentMethod = 'cod',
                                         onPaymentMethodChange = () => {}
                                     }: CheckoutFormProps) {
    const [formData, setFormData] = useState<CheckoutData>({
        full_name: '',
        email: userEmail || '',
        phone: userPhone || '',
        delivery_address: '',
        pin_code: '',
        delivery_slot_id: '',
        notes: ''
    })

    const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Partial<CheckoutData>>({})
    const [showLoginPrompt, setShowLoginPrompt] = useState(!userEmail)
    const [selectedPayment, setSelectedPayment] = useState<'cod' | 'online'>(paymentMethod)

    const supabase = createClient()

    useEffect(() => {
        fetchDeliverySlots()
    }, [])

    useEffect(() => {
        setSelectedPayment(paymentMethod)
    }, [paymentMethod])

    const handlePaymentChange = (method: 'cod' | 'online') => {
        setSelectedPayment(method)
        onPaymentMethodChange(method)
    }

    const fetchDeliverySlots = async () => {
        setIsLoading(true)
        const today = new Date().toISOString().split('T')[0]

        const { data } = await supabase
            .from('delivery_slots')
            .select('*')
            .gte('slot_date', today)
            .eq('is_active', true)
            .order('slot_date')
            .order('start_time')

        if (data) {
            const now = new Date()
            const filtered = data.filter(slot => {
                const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`)
                return slotDateTime > now
            })
            setDeliverySlots(filtered)
        }

        setIsLoading(false)
    }

    const validateForm = (): boolean => {
        const newErrors: Partial<CheckoutData> = {}

        if (!formData.full_name.trim()) newErrors.full_name = 'Name is required'
        if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Valid email is required'
        }
        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Valid 10-digit phone number required'
        }
        if (!formData.delivery_address.trim()) newErrors.delivery_address = 'Address is required'
        if (!formData.delivery_slot_id) newErrors.delivery_slot_id = 'Please select delivery slot'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            const firstError = Object.keys(errors)[0]
            const element = document.querySelector(`[name="${firstError}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
        } catch (error) {
            console.error('Checkout error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatSlotTime = (slot: DeliverySlot) => {
        const date = new Date(slot.slot_date)
        const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
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
        return { dateStr, timeStr: `${startTime} - ${endTime}` }
    }

    const isSlotFull = (slot: DeliverySlot) => {
        return slot.max_orders !== null && slot.current_orders >= slot.max_orders
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            {showLoginPrompt && !userEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-blue-900 mb-1">Have an account?</p>
                            <p className="text-sm text-blue-700 mb-3">
                                Login to track orders, save addresses, and checkout faster
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <a
                                    href="/login"
                                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
                                >
                                    Login
                                </a>
                                <button
                                    onClick={() => setShowLoginPrompt(false)}
                                    className="text-sm text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100"
                                >
                                    Continue as Guest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Delivery Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name *
                    </label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                    />
                    {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email Address *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="your@email.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                setFormData({ ...formData, phone: value })
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="10-digit mobile"
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Delivery Address *
                    </label>
                    <textarea
                        name="delivery_address"
                        value={formData.delivery_address}
                        onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                        placeholder="House/Flat no., Building, Street, Area"
                    />
                    {errors.delivery_address && <p className="mt-1 text-sm text-red-600">{errors.delivery_address}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pin Code *</label>
                    <input
                        type="text"
                        name="pin_code"
                        maxLength={6}
                        value={formData.pin_code}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setFormData({ ...formData, pin_code: value })
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="6-digit pin code"
                    />
                    {errors.pin_code && <p className="mt-1 text-sm text-red-600">{errors.pin_code}</p>}
                </div>

                <div className="border-t border-gray-200 pt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Payment Method *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPayment === 'cod'
                                ? 'border-green-500 bg-green-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                            <input
                                type="radio"
                                name="payment_method"
                                value="cod"
                                checked={selectedPayment === 'cod'}
                                onChange={() => handlePaymentChange('cod')}
                                className="w-4 h-4 text-green-600 flex-shrink-0"
                            />
                            <Banknote className={`w-5 h-5 flex-shrink-0 ${
                                selectedPayment === 'cod' ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium ${
                                    selectedPayment === 'cod' ? 'text-green-900' : 'text-gray-900'
                                }`}>Cash on Delivery</p>
                                <p className="text-xs text-gray-500 mt-0.5">Pay when you receive</p>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all opacity-60 cursor-not-allowed ${
                            selectedPayment === 'online'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                        }`}>
                            <input
                                type="radio"
                                name="payment_method"
                                value="online"
                                checked={selectedPayment === 'online'}
                                onChange={() => handlePaymentChange('online')}
                                disabled
                                className="w-4 h-4 text-green-600 flex-shrink-0"
                            />
                            <Wallet className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">Online Payment</p>
                                <p className="text-xs text-gray-500 mt-0.5">Coming Soon</p>
                            </div>
                        </label>
                    </div>

                    {selectedPayment === 'cod' && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                            <Banknote className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-800">
                                Please keep exact change ready. Our delivery partner will collect <strong>Rs.{totalAmount.toFixed(2)}</strong> at your doorstep.
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 pt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Select Delivery Slot *
                    </label>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : deliverySlots.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-yellow-800">No delivery slots available at the moment</p>
                            <p className="text-xs text-yellow-600 mt-1">Please check back later</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {deliverySlots.map((slot) => {
                                const { dateStr, timeStr } = formatSlotTime(slot)
                                const isFull = isSlotFull(slot)

                                return (
                                    <label
                                        key={slot.id}
                                        className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.delivery_slot_id === slot.id
                                                ? 'bg-green-50 border-green-500 shadow-sm'
                                                : isFull
                                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                                                    : 'bg-white border-gray-200 hover:border-green-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="delivery_slot"
                                            value={slot.id}
                                            checked={formData.delivery_slot_id === slot.id}
                                            onChange={(e) => setFormData({ ...formData, delivery_slot_id: e.target.value })}
                                            disabled={isFull}
                                            className="w-4 h-4 text-green-600 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">{dateStr}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">{timeStr}</p>
                                        </div>
                                        {isFull && (
                                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded flex-shrink-0">
                                                Full
                                            </span>
                                        )}
                                        {slot.max_orders && !isFull && (
                                            <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:inline">
                                                {slot.max_orders - slot.current_orders} left
                                            </span>
                                        )}
                                    </label>
                                )
                            })}
                        </div>
                    )}
                    {errors.delivery_slot_id && <p className="mt-2 text-sm text-red-600">{errors.delivery_slot_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Delivery Instructions (Optional)
                    </label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                        placeholder="Any special instructions for delivery..."
                    />
                </div>

                <div className="pt-5 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
                        <span className="text-gray-700 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-green-600">Rs.{totalAmount.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...,m
                            </>
                        ) : (
                            <>
                                <Banknote className="w-5 h-5" />
                                Place Order ({selectedPayment === 'cod' ? 'COD' : 'Online'})
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                        By placing an order, you agree to our terms and conditions
                    </p>
                </div>
            </form>
        </div>
    )
}