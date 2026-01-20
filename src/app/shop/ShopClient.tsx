'use client'

import { useState } from 'react'
import { ShoppingCart, Leaf, X } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import LocationChecker from '@/components/geofence/LocationChecker'
import { ProductWithPricing, CartItem } from '@/lib/types/database.types'
import Link from 'next/link'

interface ShopClientProps {
    products: ProductWithPricing[]
}

export default function ShopClient({ products }: ShopClientProps) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isLocationVerified, setIsLocationVerified] = useState(false)
    const [verifiedPinCode, setVerifiedPinCode] = useState('')
    const [showCart, setShowCart] = useState(false)

    const handleLocationVerified = (pinCode: string) => {
        setIsLocationVerified(true)
        setVerifiedPinCode(pinCode)
    }

    const handleLocationDenied = () => {
        setIsLocationVerified(false)
    }

    const handleAddToCart = (productId: string, weightGrams: number, quantity: number, price: number) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(
                item => item.product.id === productId && item.weight_grams === weightGrams
            )

            if (existingIndex >= 0) {
                const newCart = [...prevCart]
                newCart[existingIndex].quantity += quantity
                return newCart
            } else {
                return [
                    ...prevCart,
                    {
                        product,
                        weight_grams: weightGrams,
                        quantity,
                        price
                    }
                ]
            }
        })

        setShowCart(true)
        setTimeout(() => setShowCart(false), 2000)
    }

    const handleRemoveFromCart = (productId: string, weightGrams: number) => {
        setCart(prevCart => prevCart.filter(
            item => !(item.product.id === productId && item.weight_grams === weightGrams)
        ))
    }

    const handleUpdateQuantity = (productId: string, weightGrams: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(productId, weightGrams)
            return
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.product.id === productId && item.weight_grams === weightGrams
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        )
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Leaf className="w-8 h-8 text-green-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Fresh Veggies</h1>
                        </div>

                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="relative bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="font-medium">Cart</span>
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Location Checker */}
                <LocationChecker
                    onLocationVerified={handleLocationVerified}
                    onLocationDenied={handleLocationDenied}
                />

                {/* Products Grid */}
                {isLocationVerified ? (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fresh Vegetables</h2>
                            <p className="text-gray-600">Farm-fresh vegetables delivered to your door</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No products available today</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-600">Please verify your location to view products</p>
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">Your cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((item, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(item.product.id, item.weight_grams)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-3">
                                                    {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                    {' '} × Rs.{item.price.toFixed(2)}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.product.id, item.weight_grams, item.quantity - 1)}
                                                            className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.product.id, item.weight_grams, item.quantity + 1)}
                                                            className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <span className="font-bold text-gray-900">
                            Rs.{(item.price * item.quantity).toFixed(2)}
                          </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="border-t p-6 bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-semibold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-green-600">
                      Rs.{totalAmount.toFixed(2)}
                    </span>
                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="block w-full bg-green-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-green-700"
                                    >
                                        Proceed to Checkout
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}