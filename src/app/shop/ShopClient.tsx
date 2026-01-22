// src/app/ShopClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Leaf, X, Search, User, Award, Phone, Menu as MenuIcon, Package } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import AutoLocationChecker from '@/components/geofence/AutoLocationChecker'
import { ProductWithPricing, CartItem } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ShopClientProps {
    products: ProductWithPricing[]
}

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
}

export default function ShopClient({ products }: ShopClientProps) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isInServiceArea, setIsInServiceArea] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [showCart, setShowCart] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [user, setUser] = useState<any>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const supabase = createClient()

    // Load cart and fetch data on mount
    useEffect(() => {
        initializeUser()
        fetchCategories()
    }, [])

    const initializeUser = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
            setUser(currentUser)
            // Load user-specific cart from database
            await loadUserCart(currentUser.id)
        } else {
            setUser(null)
            // Clear cart for guests on refresh (security measure)
            setCart([])
            localStorage.removeItem('vegetable_cart')
        }
    }

    const loadUserCart = async (userId: string) => {
        try {
            const { data, error } = await supabase
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

            if (data && data.cart_items) {
                const cartItems: CartItem[] = data.cart_items.map((item: any) => ({
                    product: item.products,
                    weight_grams: item.weight_grams,
                    quantity: item.quantity,
                    price: item.price
                }))
                setCart(cartItems)
            }
        } catch (error) {
            console.error('Error loading user cart:', error)
        }
    }

    const saveCartToDatabase = async (updatedCart: CartItem[]) => {
        if (!user) return

        try {
            // Get or create user cart
            let { data: userCart } = await supabase
                .from('user_carts')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()

            let cartId: string

            if (!userCart) {
                const { data: newCart } = await supabase
                    .from('user_carts')
                    .insert({
                        user_id: user.id,
                        status: 'active'
                    })
                    .select('id')
                    .single()

                cartId = newCart!.id
            } else {
                cartId = userCart.id
            }

            // Delete existing cart items
            await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cartId)

            // Insert new cart items
            if (updatedCart.length > 0) {
                const cartItemsData = updatedCart.map(item => ({
                    cart_id: cartId,
                    product_id: item.product.id,
                    weight_grams: item.weight_grams,
                    quantity: item.quantity,
                    price: item.price
                }))

                await supabase
                    .from('cart_items')
                    .insert(cartItemsData)
            }
        } catch (error) {
            console.error('Error saving cart to database:', error)
        }
    }

    // Save cart whenever it changes
    useEffect(() => {
        if (user) {
            saveCartToDatabase(cart)
        }
    }, [cart, user])

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('product_categories')
            .select('id, name, slug, description')
            .eq('is_active', true)
            .order('display_order')

        if (data) {
            setCategories(data)
        }
    }

    const handleLocationVerified = (inArea: boolean, location: { lat: number; lng: number }) => {
        setIsInServiceArea(inArea)
        setUserLocation(location)
    }

    const handleAddToCart = (productId: string, weightGrams: number, quantity: number, price: number) => {
        if (!user) {
            alert('Please login to add items to cart')
            window.location.href = '/login'
            return
        }

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

    // Filter products by category and search
    const filteredProducts = products.filter(product => {
        if (selectedCategory !== 'all') {
            const category = categories.find(c => c.slug === selectedCategory)
            if (category && product.category_id !== category.id) {
                return false
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            return (
                product.name.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query) ||
                product.category?.toLowerCase().includes(query)
            )
        }

        return true
    })

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Leaf className="w-8 h-8 text-green-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Fresh Veggies</h1>
                                <p className="text-xs text-gray-600">Farm Fresh Delivered</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
                                Home
                            </Link>
                            {user && (
                                <Link href="/orders" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    Track Orders
                                </Link>
                            )}
                            <Link href="/certifications" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                Certifications
                            </Link>
                            <Link href="/contact" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                Contact
                            </Link>
                        </nav>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <MenuIcon className="w-6 h-6" />
                            </button>

                            {user ? (
                                <Link
                                    href="/profile"
                                    className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Profile</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium"
                                >
                                    Login
                                </Link>
                            )}

                            <button
                                onClick={() => {
                                    if (!user) {
                                        alert('Please login to view cart')
                                        window.location.href = '/login'
                                        return
                                    }
                                    setShowCart(!showCart)
                                }}
                                className="relative bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">Cart</span>
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {showMobileMenu && (
                        <div className="md:hidden mt-4 py-4 border-t space-y-2">
                            <Link href="/" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                Home
                            </Link>
                            {user && (
                                <Link href="/orders" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                    <Package className="w-4 h-4 inline mr-2" />
                                    Track Orders
                                </Link>
                            )}
                            <Link href="/certifications" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                <Award className="w-4 h-4 inline mr-2" />
                                Certifications
                            </Link>
                            <Link href="/contact" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Contact
                            </Link>
                            {user ? (
                                <Link href="/profile" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Profile
                                </Link>
                            ) : (
                                <Link href="/login" className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                                    Login
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <AutoLocationChecker onLocationVerified={handleLocationVerified} />

                {userLocation && (
                    <>
                        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Shop by Category</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        selectedCategory === 'all'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All Products
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.slug)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            selectedCategory === category.slug
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {selectedCategory === 'all'
                                    ? 'All Products'
                                    : categories.find(c => c.slug === selectedCategory)?.name}
                            </h2>
                            {!isInServiceArea && (
                                <div className="mt-3 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm">
                                    ⚠️ Browsing only - You cannot place orders outside our service area
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showCart && user && (
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