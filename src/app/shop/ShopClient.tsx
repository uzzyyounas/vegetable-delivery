// src/app/ShopClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Leaf, X, Search, User } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import AutoLocationChecker from '@/components/geofence/AutoLocationChecker'
import TopBar from '@/components/layout/TopBar'
import { ProductWithPricing, CartItem } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ShopClientProps {
    products: ProductWithPricing[]
}

export default function ShopClient({ products }: ShopClientProps) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isInServiceArea, setIsInServiceArea] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [showCart, setShowCart] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [user, setUser] = useState<any>(null)

    const supabase = createClient()

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('vegetable_cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (error) {
                console.error('Error loading cart:', error)
            }
        }

        // Check if user is logged in
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('vegetable_cart', JSON.stringify(cart))
        } else {
            localStorage.removeItem('vegetable_cart')
        }
    }, [cart])

    const handleLocationVerified = (inArea: boolean, location: { lat: number; lng: number }) => {
        setIsInServiceArea(inArea)
        setUserLocation(location)
    }

    const handleAddToCart = (productId: string, weightGrams: number, quantity: number, price: number) => {
        // Prevent adding to cart if outside service area
        if (!isInServiceArea) {
            alert('Sorry, we do not deliver to your area yet. You can only browse products.')
            return
        }

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

    // Filter products based on search query
    const filteredProducts = products.filter(product => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        return (
            product.name.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
        )
    })

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Top Bar */}
            <TopBar />

            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Leaf className="w-8 h-8 text-green-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Fresh Veggies</h1>
                                <p className="text-xs text-gray-600">Faisalabad, Pakistan</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* User Profile Link */}
                            {user ? (
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="hidden sm:inline font-medium">Profile</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium"
                                >
                                    Login
                                </Link>
                            )}

                            {/* Cart Button */}
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
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Auto Location Checker */}
                <AutoLocationChecker onLocationVerified={handleLocationVerified} />

                {/* Show products only after location is detected */}
                {userLocation && (
                    <>
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search vegetables..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {searchQuery && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Products Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fresh Vegetables</h2>
                            <p className="text-gray-600">Farm-fresh vegetables delivered to your door</p>
                            {!isInServiceArea && (
                                <div className="mt-3 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm">
                                    ⚠️ Browsing only - You cannot place orders outside our service area
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && searchQuery && (
                            <div className="text-center py-12">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No products found for "{searchQuery}"</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-green-600 hover:text-green-700 font-medium"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}

                        {products.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No products available today</p>
                            </div>
                        )}
                    </>
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

                                    {isInServiceArea ? (
                                        <Link
                                            href="/checkout"
                                            className="block w-full bg-green-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-green-700"
                                        >
                                            Proceed to Checkout
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full bg-gray-300 text-gray-500 py-4 rounded-lg font-semibold cursor-not-allowed"
                                        >
                                            Checkout Unavailable
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}