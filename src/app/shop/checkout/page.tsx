// src/app/(shop)/checkout/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, ArrowLeft, Wallet, Banknote, ShoppingCart } from 'lucide-react'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import { createClient } from '@/lib/supabase/client'
import { CartItem, CheckoutData } from '@/lib/types/database.types'
import Link from 'next/link'

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        initializeCheckout()
    }, [])

    const initializeCheckout = async () => {
        setIsLoading(true)

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        if (currentUser) {
            // Load user cart from database
            await loadUserCart(currentUser.id)
        } else {
            // Load guest cart from localStorage
            const savedCart = localStorage.getItem('guest_cart')
            if (savedCart) {
                setCart(JSON.parse(savedCart))
            }
        }

        setIsLoading(false)
    }

    const loadUserCart = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('user_carts')
                .select(`
                    *,
                    cart_items(
                        id,
                        product_id,
                        weight_grams,
                        quantity,
                        price,
                        products(*)
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'active')
                .single()

            if (data?.cart_items && data.cart_items.length > 0) {
                const cartItems: CartItem[] = data.cart_items.map((item: any) => ({
                    product: item.products,
                    weight_grams: item.weight_grams,
                    quantity: item.quantity,
                    price: item.price
                }))
                setCart(cartItems)
            }
        } catch (error) {
            console.error('Error loading cart:', error)
        }
    }

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

            // Generate unique order number
            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            // Create order with payment method
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
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
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'cod' ? 'cod' : 'pending'
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
                    notes: `Order placed - Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}`
                })

            // Update delivery slot count (if RPC exists)
            try {
                await supabase.rpc('increment_slot_orders', {
                    slot_id: checkoutData.delivery_slot_id
                })
            } catch (rpcError) {
                console.warn('RPC increment_slot_orders not available:', rpcError)
            }

            // Clear cart
            if (user) {
                // Clear database cart for logged-in users
                const { data: userCart } = await supabase
                    .from('user_carts')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single()

                if (userCart) {
                    await supabase
                        .from('cart_items')
                        .delete()
                        .eq('cart_id', userCart.id)
                }
            } else {
                // Clear localStorage cart for guests
                localStorage.removeItem('guest_cart')
            }

            // Redirect to order confirmation
            router.push(`/track-order/${order.id}`)
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Failed to place order. Please try again.')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Leaf className="w-12 h-12 text-green-600 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-600">Loading checkout...</p>
                </div>
            </div>
        )
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some fresh vegetables to get started</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
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
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Leaf className="w-6 h-6 text-green-600" />
                            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Summary - Mobile: Top, Desktop: Right Sidebar */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-24">
                            <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Order Summary
                            </h3>

                            {/* Cart Items */}
                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm pb-3 border-b border-gray-100 last:border-0">
                                        <div className="flex-1 pr-2">
                                            <p className="font-medium text-gray-900">{item.product.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">
                                                {item.weight_grams >= 1000
                                                    ? `${item.weight_grams / 1000} kg`
                                                    : `${item.weight_grams} g`}
                                                {' '} × {item.quantity}
                                            </p>
                                        </div>
                                        <span className="font-medium text-gray-900 ml-2 flex-shrink-0">
                                            Rs.{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Method Display */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                    {paymentMethod === 'cod' ? (
                                        <Banknote className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Wallet className="w-4 h-4 text-blue-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">Payment Method</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 ml-6">
                                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                </p>
                            </div>

                            {/* Price Summary */}
                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">Rs.{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className="font-medium text-green-600">FREE</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-green-600">
                                            Rs.{totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form - Mobile: Bottom, Desktop: Left */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <CheckoutForm
                            totalAmount={totalAmount}
                            onSubmit={handleCheckout}
                            userEmail={user?.email}
                            userPhone={user?.user_metadata?.phone}
                            paymentMethod={paymentMethod}
                            onPaymentMethodChange={setPaymentMethod}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}