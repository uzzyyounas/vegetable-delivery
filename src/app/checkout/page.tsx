// src/app/checkout/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, ArrowLeft, Loader2 } from 'lucide-react'
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
        // Load cart from localStorag
        // const savedCart = localStorage.getItem('vegetable_cart')
        // if (savedCart) {
        //     try {
        //         const parsedCart = JSON.parse(savedCart)
        //         setCart(parsedCart)
        //     } catch (error) {
        //         console.error('Error parsing cart:', error)
        //         setCart([])
        //     }
        // }

        const fetchCartFromSupabase = async () => {
            try {
                // 1. Get logged-in user
                const { data } = await supabase.auth.getUser();
                const user = data.user;

                setUser(user);
                setIsLoading(false);

                // If no user, empty cart
                if (!user) {
                    setCart([]);
                    return;
                }

                // 2. Get user cart
                const { data: cartData, error: cartError } = await supabase
                    .from('user_carts')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (cartError) {
                    console.error("Error fetching cart:", cartError);
                    setCart([]);
                    return;
                }

                // 3. Get cart items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('cart_items')
                    .select(`id, quantity,weight_grams,price, product_id, products (id,  name )`)
                    .eq('cart_id', cartData.id);
                console.log("cart item data: ", itemsData);

                if (itemsError) {
                    console.error("Error fetching cart items:", itemsError);
                    setCart([]);
                    return;
                }

                // 4. Combine and set cart
                const finalCart = {
                    ...cartData,
                    items: itemsData || [],
                };

                setCart(finalCart);

            } catch (error) {
                console.error("Error fetching cart from supabase:", error);
                setCart([]);
                setIsLoading(false);
            }
        }

        fetchCartFromSupabase();
        // Check if user is logged in
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
            setIsLoading(false)
        })
    }, [])

    const totalAmount = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCheckout = async (checkoutData: CheckoutData) => {

        try {
            // Validate service zone
            // const { data: zone, error: zoneError } = await supabase
            //     .from('service_zones')
            //     .select('*')
            //     .eq('pin_code', checkoutData.pin_code)
            //     .eq('is_active', true)
            //     .single()
            //
            // if (zoneError || !zone) {
            //     alert('We do not deliver to this pin code yet. Please contact support.')
            //     return
            // }

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

                if (guestError) {
                    console.error('Guest customer error:', guestError)
                    throw new Error('Failed to create customer profile')
                }
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
                    notes: checkoutData.notes || null,
                    status: 'pending',
                    payment_status: 'pending'
                })
                .select()
                .single()

            if (orderError) {
                console.error('Order creation error - ss:', {
                    message: orderError?.message,
                    details: orderError?.details,
                    hint: orderError?.hint,
                    code: orderError?.code
                })
                // console.error('Order creation error:', orderError)
                throw new Error('Failed to create order -ss')
            }

            // Create order items
            const orderItems = cart?.items?.map(item => ({
                order_id: order.id,
                product_id: item.products.id,
                product_name: item.products.name,
                weight_grams: item.weight_grams,
                unit_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) {
                console.error('Order items error:', itemsError)
                throw new Error('Failed to add order items')
            }

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
            localStorage.removeItem('vegetable_cart')

            // Redirect to success page
            router.push(`/order-success?order=${order.order_number}&id=${order.id}`)
        } catch (error: any) {
            console.error('Checkout error:', error)
            alert('Failed to place order: ' + (error.message || 'Please try again'))
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading checkout...</p>
                </div>
            </div>
        )
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4 opacity-50" />
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
            <header className="bg-white shadow-sm sticky top-0 z-10">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

                            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                                {cart?.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm pb-3 border-b last:border-0">
                                        <div className="flex-1 pr-4">
                                            <p className="font-medium text-gray-900">{item.products.name}</p>
                                            <p className="text-gray-500">
                                                {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                {' '} × {item.quantity}
                                            </p>
                                        </div>
                                        <span className="font-medium text-gray-900 whitespace-nowrap">
                      Rs.{(item.price * item.quantity).toFixed(2)}
                    </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">Rs.{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className="font-medium text-green-600">FREE</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-green-600">
                      Rs.{totalAmount.toFixed(2)}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-800">
                                    💡 <strong>Tip:</strong> Save your details by creating an account for faster checkout next time!
                                </p>
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

// SQL Function to add (if not exists)
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