// src/app/ShopClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Leaf, X, Search, User, Award, Phone, Menu as MenuIcon, Package, Home } from 'lucide-react'
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

    useEffect(() => {
        initializeUser()
        fetchCategories()
    }, [])

    const initializeUser = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
            setUser(currentUser)
            await loadUserCart(currentUser.id)
        } else {
            setUser(null)
            setCart([])
            localStorage.removeItem('vegetable_cart')
        }
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

            if (data?.cart_items) {
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

    const saveCartToDatabase = async (updatedCart: CartItem[]) => {
        if (!user) return

        try {
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
                    .insert({ user_id: user.id, status: 'active' })
                    .select('id')
                    .single()
                cartId = newCart!.id
            } else {
                cartId = userCart.id
            }

            await supabase.from('cart_items').delete().eq('cart_id', cartId)

            if (updatedCart.length > 0) {
                const cartItemsData = updatedCart.map(item => ({
                    cart_id: cartId,
                    product_id: item.product.id,
                    weight_grams: item.weight_grams,
                    quantity: item.quantity,
                    price: item.price
                }))
                await supabase.from('cart_items').insert(cartItemsData)
            }
        } catch (error) {
            console.error('Error saving cart:', error)
        }
    }

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

        console.log('data',data);

        if (data) setCategories(data)
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
            alert('Sorry, we do not deliver to your area yet.')
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
                return [...prevCart, { product, weight_grams: weightGrams, quantity, price }]
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

    const filteredProducts = products.filter(product => {
        if (selectedCategory !== 'all') {
            const category = categories.find(c => c.slug === selectedCategory)
            if (category && product.category_id !== category.id) return false
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                            <div className="relative">
                                <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 transform group-hover:rotate-12 transition-transform" />
                                <div className="absolute inset-0 bg-green-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    Fresh Veggies
                                </h1>
                                <p className="text-xs text-gray-600 hidden sm:block">Farm Fresh Delivered</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            <Link href="/" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Home
                            </Link>
                            <Link href="/orders" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Track Order
                            </Link>
                            <Link href="/certifications" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Certifications
                            </Link>
                            <Link href="/contact" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Contact
                            </Link>
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Menu"
                            >
                                {showMobileMenu ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>

                            {/* User Profile/Login */}
                            {user ? (
                                <Link
                                    href="/profile"
                                    className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-all"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-medium hidden md:inline">Profile</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 font-medium transition-all"
                                >
                                    Login
                                </Link>
                            )}

                            {/* Cart Button */}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        alert('Please login to view cart')
                                        window.location.href = '/login'
                                        return
                                    }
                                    setShowCart(!showCart)
                                }}
                                className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">Cart</span>
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {showMobileMenu && (
                        <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-1 animate-in slide-in-from-top">
                            <Link href="/" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                <Home className="w-4 h-4 inline mr-2" />
                                Home
                            </Link>
                            <Link href="/orders" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                <Package className="w-4 h-4 inline mr-2" />
                                Track Order
                            </Link>
                            <Link href="/certifications" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                <Award className="w-4 h-4 inline mr-2" />
                                Certifications
                            </Link>
                            <Link href="/contact" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Contact
                            </Link>
                            {user ? (
                                <Link href="/profile" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Profile
                                </Link>
                            ) : (
                                <Link href="/login" className="block py-2.5 px-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all">
                                    Login
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Location Checker */}
                <AutoLocationChecker onLocationVerified={handleLocationVerified} />

                {userLocation && (
                    <>
                        {/* Categories */}
                        <div className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                            {/*<h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base sm:text-lg">*/}
                            {/*    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">*/}
                            {/*        <Leaf className="w-4 h-4 text-white" />*/}
                            {/*    </div>*/}
                            {/*    Shop by Category*/}
                            {/*</h3>*/}
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 ${
                                        selectedCategory === 'all'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    All Products
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.slug)}
                                        className={`px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 ${
                                            selectedCategory === category.slug
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6 sm:mb-8">
                            <div className="relative max-w-2xl mx-auto">
                                <Search className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                                <input
                                    type="text"
                                    placeholder="Search fresh vegetables..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 sm:pl-14 pr-12 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all shadow-sm text-base sm:text-lg"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="mt-3 text-center text-sm text-gray-600">
                                    Found <span className="font-semibold text-green-600">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Products Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                {selectedCategory === 'all'
                                    ? '🌱 All Products'
                                    : `${categories.find(c => c.slug === selectedCategory)?.name || 'Products'}`}
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                                {selectedCategory === 'all'
                                    ? 'Browse our complete collection of farm-fresh produce'
                                    : categories.find(c => c.slug === selectedCategory)?.description || 'Fresh from the farm'}
                            </p>
                            {!isInServiceArea && (
                                <div className="mt-4 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <span><strong>Browsing Mode:</strong> You cannot place orders outside our service area</span>
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        {/* No Results */}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16 sm:py-20">
                                <div className="bg-gray-100 rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 flex items-center justify-center">
                                    <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                                    {searchQuery
                                        ? `No results for "${searchQuery}"`
                                        : 'No products in this category'}
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSelectedCategory('all')
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    View All Products
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Cart Sidebar */}
            {showCart && user && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" onClick={() => setShowCart(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            {/* Cart Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                        <ShoppingCart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                                        <p className="text-xs text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                            <ShoppingCart className="w-12 h-12 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Your cart is empty</p>
                                        <p className="text-sm text-gray-400 mt-1">Start adding some fresh veggies!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 sm:space-y-4">
                                        {cart.map((item, index) => (
                                            <div key={index} className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {item.weight_grams >= 1000 ? `${item.weight_grams / 1000} kg` : `${item.weight_grams} g`}
                                                            {' '} × <span className="font-medium text-green-600">Rs.{item.price.toFixed(2)}</span>
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(item.product.id, item.weight_grams)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.product.id, item.weight_grams, item.quantity - 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-700 font-bold"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.product.id, item.weight_grams, item.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-700 font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="text-lg font-bold text-gray-900">
                                                        Rs.{(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            {cart.length > 0 && (
                                <div className="border-t p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-green-50/30">
                                    <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-semibold text-gray-900">Rs.{totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="text-lg font-bold text-gray-900">Total</span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                Rs.{totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {isInServiceArea ? (
                                        <Link
                                            href="/checkout"
                                            className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            Proceed to Checkout
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed"
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