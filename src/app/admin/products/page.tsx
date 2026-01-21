// src/app/admin/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface Product {
    id: string
    name: string
    description: string | null
    category: string | null
    pricing_type: 'daily' | 'tiered'
    is_active: boolean
}

interface DailyPrice {
    price_per_kg: number
}

interface WeightTier {
    weight_grams: number
    price: number
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [dailyPrices, setDailyPrices] = useState<Record<string, DailyPrice>>({})
    const [weightTiers, setWeightTiers] = useState<Record<string, WeightTier[]>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [editingProduct, setEditingProduct] = useState<string | null>(null)
    const [priceUpdates, setPriceUpdates] = useState<Record<string, any>>({})
    const [showAddProduct, setShowAddProduct] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        category: 'Vegetables',
        pricing_type: 'daily' as 'daily' | 'tiered'
    })

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setIsLoading(true)

        // Fetch products
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .order('name')

        // Fetch today's daily prices
        const { data: dailyPricesData } = await supabase
            .from('daily_prices')
            .select('*')
            .eq('effective_date', today)

        // Fetch today's weight tiers
        const { data: weightTiersData } = await supabase
            .from('weight_tiers')
            .select('*')
            .eq('effective_date', today)

        if (productsData) {
            setProducts(productsData)

            // Map daily prices by product_id
            const pricesMap: Record<string, DailyPrice> = {}
            dailyPricesData?.forEach(dp => {
                pricesMap[dp.product_id] = { price_per_kg: dp.price_per_kg }
            })
            setDailyPrices(pricesMap)

            // Map weight tiers by product_id
            const tiersMap: Record<string, WeightTier[]> = {}
            weightTiersData?.forEach(wt => {
                if (!tiersMap[wt.product_id]) {
                    tiersMap[wt.product_id] = []
                }
                tiersMap[wt.product_id].push({
                    weight_grams: wt.weight_grams,
                    price: wt.price
                })
            })
            setWeightTiers(tiersMap)
        }

        setIsLoading(false)
    }

    const handleAddProduct = async () => {
        if (!newProduct.name.trim()) {
            alert('Product name is required')
            return
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .insert({
                    name: newProduct.name,
                    description: newProduct.description || null,
                    category: newProduct.category,
                    pricing_type: newProduct.pricing_type,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            alert('Product added successfully!')
            setShowAddProduct(false)
            setNewProduct({
                name: '',
                description: '',
                category: 'Vegetables',
                pricing_type: 'daily'
            })
            fetchProducts()
        } catch (error: any) {
            console.error('Error adding product:', error)
            alert('Failed to add product: ' + error.message)
        }
    }

    const handleUpdatePrice = async (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        try {
            if (product.pricing_type === 'daily') {
                const newPrice = priceUpdates[productId]?.price_per_kg
                if (!newPrice || isNaN(parseFloat(newPrice))) {
                    alert('Please enter a valid price')
                    return
                }

                // Delete old price for today
                await supabase
                    .from('daily_prices')
                    .delete()
                    .eq('product_id', productId)
                    .eq('effective_date', today)

                // Insert new price
                const { error } = await supabase
                    .from('daily_prices')
                    .insert({
                        product_id: productId,
                        price_per_kg: parseFloat(newPrice),
                        effective_date: today
                    })

                if (error) throw error
            } else {
                const tiers = priceUpdates[productId]?.tiers || []

                if (tiers.length === 0) {
                    alert('Please add at least one weight tier')
                    return
                }

                // Validate tiers
                for (const tier of tiers) {
                    if (!tier.weight_grams || !tier.price || isNaN(parseInt(tier.weight_grams)) || isNaN(parseFloat(tier.price))) {
                        alert('Please enter valid weight and price for all tiers')
                        return
                    }
                }

                // Delete old tiers for today
                await supabase
                    .from('weight_tiers')
                    .delete()
                    .eq('product_id', productId)
                    .eq('effective_date', today)

                // Insert new tiers
                const tierInserts = tiers.map((t: any) => ({
                    product_id: productId,
                    weight_grams: parseInt(t.weight_grams),
                    price: parseFloat(t.price),
                    effective_date: today
                }))

                const { error } = await supabase
                    .from('weight_tiers')
                    .insert(tierInserts)

                if (error) throw error
            }

            setEditingProduct(null)
            setPriceUpdates({})
            fetchProducts()
            alert('Price updated successfully!')
        } catch (error: any) {
            console.error('Error updating price:', error)
            alert('Failed to update price: ' + error.message)
        }
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product? This will also delete all associated prices.')) {
            return
        }

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)

            if (error) throw error

            alert('Product deleted successfully!')
            fetchProducts()
        } catch (error: any) {
            console.error('Error deleting product:', error)
            alert('Failed to delete product: ' + error.message)
        }
    }

    const handleAddTier = (productId: string) => {
        const current = priceUpdates[productId]?.tiers || []
        setPriceUpdates({
            ...priceUpdates,
            [productId]: {
                ...priceUpdates[productId],
                tiers: [...current, { weight_grams: '', price: '' }]
            }
        })
    }

    const handleRemoveTier = (productId: string, index: number) => {
        const current = priceUpdates[productId]?.tiers || []
        setPriceUpdates({
            ...priceUpdates,
            [productId]: {
                ...priceUpdates[productId],
                tiers: current.filter((_: any, i: number) => i !== index)
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading products...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 mt-1">Manage products and prices for {today}</p>
                </div>
                <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., Tomato"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    placeholder="Fresh farm tomatoes..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Vegetables"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pricing Type *
                                </label>
                                <select
                                    value={newProduct.pricing_type}
                                    onChange={(e) => setNewProduct({ ...newProduct, pricing_type: e.target.value as 'daily' | 'tiered' })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="daily">Daily Pricing (per kg)</option>
                                    <option value="tiered">Tiered Pricing (by weight)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddProduct}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                            >
                                Add Product
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddProduct(false)
                                    setNewProduct({
                                        name: '',
                                        description: '',
                                        category: 'Vegetables',
                                        pricing_type: 'daily'
                                    })
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y">
                    {products.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">No products yet. Add your first product!</p>
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                product.pricing_type === 'daily'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-purple-100 text-purple-800'
                                            }`}>
                        {product.pricing_type === 'daily' ? 'Daily Pricing' : 'Tiered Pricing'}
                      </span>
                                            {!product.is_active && (
                                                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                          Inactive
                        </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{product.description}</p>
                                        {product.category && (
                                            <p className="text-xs text-gray-500 mt-1">Category: {product.category}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {editingProduct === product.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdatePrice(product.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(null)
                                                        setPriceUpdates({})
                                                    }}
                                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(product.id)
                                                        if (product.pricing_type === 'daily') {
                                                            setPriceUpdates({
                                                                ...priceUpdates,
                                                                [product.id]: {
                                                                    price_per_kg: dailyPrices[product.id]?.price_per_kg || ''
                                                                }
                                                            })
                                                        } else {
                                                            setPriceUpdates({
                                                                ...priceUpdates,
                                                                [product.id]: {
                                                                    tiers: (weightTiers[product.id] || []).map(t => ({
                                                                        weight_grams: t.weight_grams,
                                                                        price: t.price
                                                                    }))
                                                                }
                                                            })
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit Price
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Daily Pricing */}
                                {product.pricing_type === 'daily' && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price per kg (Rs.)
                                        </label>
                                        {editingProduct === product.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={priceUpdates[product.id]?.price_per_kg || ''}
                                                onChange={(e) => setPriceUpdates({
                                                    ...priceUpdates,
                                                    [product.id]: { price_per_kg: e.target.value }
                                                })}
                                                className="w-full max-w-xs px-4 py-2 border rounded-lg"
                                                placeholder="Enter price"
                                            />
                                        ) : (
                                            <p className="text-2xl font-bold text-green-600">
                                                Rs.{dailyPrices[product.id]?.price_per_kg?.toFixed(2) || 'Not set'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Tiered Pricing */}
                                {product.pricing_type === 'tiered' && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Weight Tiers
                                            </label>
                                            {editingProduct === product.id && (
                                                <button
                                                    onClick={() => handleAddTier(product.id)}
                                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Tier
                                                </button>
                                            )}
                                        </div>

                                        {editingProduct === product.id ? (
                                            <div className="space-y-2">
                                                {(priceUpdates[product.id]?.tiers || []).length === 0 ? (
                                                    <p className="text-sm text-gray-500">No tiers yet. Click "Add Tier" to add one.</p>
                                                ) : (
                                                    (priceUpdates[product.id]?.tiers || []).map((tier: any, index: number) => (
                                                        <div key={index} className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={tier.weight_grams}
                                                                onChange={(e) => {
                                                                    const newTiers = [...priceUpdates[product.id].tiers]
                                                                    newTiers[index].weight_grams = e.target.value
                                                                    setPriceUpdates({
                                                                        ...priceUpdates,
                                                                        [product.id]: { tiers: newTiers }
                                                                    })
                                                                }}
                                                                placeholder="Grams"
                                                                className="w-32 px-3 py-2 border rounded-lg"
                                                            />
                                                            <span className="text-gray-500">grams =</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={tier.price}
                                                                onChange={(e) => {
                                                                    const newTiers = [...priceUpdates[product.id].tiers]
                                                                    newTiers[index].price = e.target.value
                                                                    setPriceUpdates({
                                                                        ...priceUpdates,
                                                                        [product.id]: { tiers: newTiers }
                                                                    })
                                                                }}
                                                                placeholder="Price"
                                                                className="w-32 px-3 py-2 border rounded-lg"
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveTier(product.id, index)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {weightTiers[product.id] && weightTiers[product.id].length > 0 ? (
                                                    weightTiers[product.id]
                                                        .sort((a, b) => a.weight_grams - b.weight_grams)
                                                        .map((tier, index) => (
                                                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {tier.weight_grams >= 1000
                                      ? `${tier.weight_grams / 1000} kg`
                                      : `${tier.weight_grams} g`}
                                </span>
                                                                <span className="font-semibold text-green-600">
                                  Rs.{tier.price.toFixed(2)}
                                </span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <p className="text-sm text-gray-500">No tiers set for today</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}