// src/components/checkout/CheckoutForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Mail, Phone, MapPin, FileText, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DeliverySlot, CheckoutData } from '@/lib/types/database.types'

interface CheckoutFormProps {
    totalAmount: number
    onSubmit: (data: CheckoutData) => Promise<void>
    userEmail?: string
    userPhone?: string
}

export default function CheckoutForm({ totalAmount, onSubmit, userEmail, userPhone }: CheckoutFormProps) {
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

    const supabase = createClient()

    useEffect(() => {
        fetchDeliverySlots()
    }, [])

    const fetchDeliverySlots = async () => {
        setIsLoading(true)
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('delivery_slots')
            .select('*')
            .gte('slot_date', today)
            .eq('is_active', true)
            .order('slot_date')
            .order('start_time')

        if (data) {
            // Filter out past slots for today
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
        if (!formData.pin_code.trim() || formData.pin_code.length < 6) {
            newErrors.pin_code = 'Valid pin code required'
        }
        if (!formData.delivery_slot_id) newErrors.delivery_slot_id = 'Please select delivery slot'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {showLoginPrompt && !userEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-blue-900 mb-1">Have an account?</p>
                            <p className="text-sm text-blue-700 mb-3">
                                Login to track orders, save addresses, and checkout faster
                            </p>
                            <div className="flex gap-2">
                                <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                    Login
                                </button>
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

            <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name *
                    </label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your full name"
                    />
                    {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setFormData({ ...formData, phone: value })
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="10-digit mobile number"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Delivery Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Delivery Address *
                    </label>
                    <textarea
                        value={formData.delivery_address}
                        onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="House/Flat no., Building, Street, Area"
                    />
                    {errors.delivery_address && <p className="mt-1 text-sm text-red-600">{errors.delivery_address}</p>}
                </div>

                {/* Pin Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pin Code *</label>
                    <input
                        type="text"
                        maxLength={6}
                        value={formData.pin_code}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setFormData({ ...formData, pin_code: value })
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="6-digit pin code"
                    />
                    {errors.pin_code && <p className="mt-1 text-sm text-red-600">{errors.pin_code}</p>}
                </div>

                {/* Delivery Slot */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Select Delivery Slot *
                    </label>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : deliverySlots.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">No delivery slots available</p>
                    ) : (
                        <div className="space-y-2">
                            {deliverySlots.map((slot) => {
                                const { dateStr, timeStr } = formatSlotTime(slot)
                                const isFull = isSlotFull(slot)

                                return (
                                    <label
                                        key={slot.id}
                                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                            formData.delivery_slot_id === slot.id
                                                ? 'bg-green-50 border-green-500'
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
                                            className="w-4 h-4 text-green-600"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{dateStr}</p>
                                            <p className="text-sm text-gray-600">{timeStr}</p>
                                        </div>
                                        {isFull && (
                                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                        Full
                      </span>
                                        )}
                                        {slot.max_orders && !isFull && (
                                            <span className="text-xs text-gray-500">
                        {slot.max_orders - slot.current_orders} slots left
                      </span>
                                        )}
                                    </label>
                                )
                            })}
                        </div>
                    )}
                    {errors.delivery_slot_id && <p className="mt-1 text-sm text-red-600">{errors.delivery_slot_id}</p>}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Delivery Instructions (Optional)
                    </label>
                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Any special instructions for delivery"
                    />
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-700 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Place Order'
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                        By placing order, you agree to our terms and conditions
                    </p>
                </div>
            </form>
        </div>
    )
}