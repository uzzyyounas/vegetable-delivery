// src/app/(shop)/checkout/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, ArrowLeft } from 'lucide-react'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import { createClient } from '@/lib/supabase/client'
import { CartItem, CheckoutData } from '@/lib/types/database.types'
import Link from 'next/link'

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        }

        // Check if user is logged in
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
            setIsLoading(false)
        })
    }, [])

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCheckout = async (checkoutData: CheckoutData) => {
        try {
            // Validate service zone
            const { data: zone } = await supabase
                .from('service_zones')
                .select('*')
                .eq('pin_code', checkoutData.pin_code)
                .eq('is_active', true)
                .single()

            if (!zone) {
                alert('We do not deliver to this pin code yet')
                return
            }

            let guestCustomerId = null

            // Create guest customer if not logged in
            if (!user) {
                const { data: guestData, error: guestError } = await supabase
                    .from('guest_customers')
                    .insert({
                        email: checkoutData.email,
                        phone: checkoutData.phone,
                        full_name: checkoutData.full_name
                    })
                    .select()
                    .single()

                if (guestError) throw guestError
                guestCustomerId = guestData.id
            }

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id || null,
                    guest_customer_id: guestCustomerId,
                    delivery_slot_id: checkoutData.delivery_slot_id,
                    delivery_address: checkoutData.delivery_address,
                    pin_code: checkoutData.pin_code,
                    phone: checkoutData.phone,
                    email: checkoutData.email,
                    total_amount: totalAmount,
                    notes: checkoutData.notes,
                    status: 'pending',
                    payment_status: 'pending'
                })
                .select()
                .single()

            if (orderError) throw orderError

            // Create order items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.product.id,
                product_name: item.product.name,
                weight_grams: item.weight_grams,
                unit_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            // Create initial status history
            await supabase
                .from('order_status_history')
                .insert({
                    order_id: order.id,
                    status: 'pending',
                    notes: 'Order placed successfully'
                })

            // Update delivery slot count
            await supabase.rpc('increment_slot_orders', {
                slot_id: checkoutData.delivery_slot_id
            })

            // Clear cart
            localStorage.removeItem('cart')

            // Redirect to order confirmation
            router.push(`/orders/${order.id}`)
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Failed to place order. Please try again.')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Leaf className="w-12 h-12 text-green-600 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some fresh vegetables to get started</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Leaf className="w-6 h-6 text-green-600" />
                            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Order Summary */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

                            <div className="space-y-3 mb-4">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.product.name}</p>
                                            <p className="text-gray-500">
                                                {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                {' '} × {item.quantity}
                                            </p>
                                        </div>
                                        <span className="font-medium text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Delivery</span>
                                    <span className="font-medium text-green-600">FREE</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="md:col-span-2">
                        <CheckoutForm
                            totalAmount={totalAmount}
                            onSubmit={handleCheckout}
                            userEmail={user?.email}
                            userPhone={user?.user_metadata?.phone}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// SQL Function for incrementing slot orders (Add to migration)
/*
CREATE OR REPLACE FUNCTION increment_slot_orders(slot_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE delivery_slots
  SET current_orders = current_orders + 1
  WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql;
*/