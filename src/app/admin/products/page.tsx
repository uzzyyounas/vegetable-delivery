// src/app/admin/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
    id: string
    name: string
    description: string | null
    category: string | null
    pricing_type: 'daily' | 'tiered'
    is_active: boolean
}
interface ProductCategory {
    id: string
    name: string
    slug: string
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
    const [categories, setCategories] = useState<ProductCategory[]>([])
    // const [newProduct, setNewProduct] = useState({
    //     name: '',
    //     description: '',
    //     category: 'Vegetables',
    //     pricing_type: 'daily' as 'daily' | 'tiered'
    // })
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        category_id: '',
        pricing_type: 'daily' as 'daily' | 'tiered'
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const recordsPerPage = 5

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        setIsLoading(true)

        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .order('name')

        const { data: dailyPricesData } = await supabase
            .from('daily_prices')
            .select('*')
            .eq('effective_date', today)

        const { data: weightTiersData } = await supabase
            .from('weight_tiers')
            .select('*')
            .eq('effective_date', today)

        if (productsData) {
            setProducts(productsData)

            const pricesMap: Record<string, DailyPrice> = {}
            dailyPricesData?.forEach(dp => {
                pricesMap[dp.product_id] = { price_per_kg: dp.price_per_kg }
            })
            setDailyPrices(pricesMap)

            const tiersMap: Record<string, WeightTier[]> = {}
            weightTiersData?.forEach(wt => {
                if (!tiersMap[wt.product_id]) tiersMap[wt.product_id] = []
                tiersMap[wt.product_id].push({
                    weight_grams: wt.weight_grams,
                    price: wt.price
                })
            })
            setWeightTiers(tiersMap)
        }

        setIsLoading(false)
    }

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('product_categories')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('display_order')

        if (error) {
            console.error('Error fetching categories:', error)
            return
        }

        setCategories(data || [])
    }

    const handleAddProduct = async () => {
        if (!newProduct.name.trim() || !newProduct.category_id) {
            alert('Product name and category is required')
            return
        }

        try {
            const { error } = await supabase
                .from('products')
                .insert({
                    name: newProduct.name,
                    description: newProduct.description || null,
                    category_id: newProduct.category_id,
                    pricing_type: newProduct.pricing_type,
                    is_active: true
                })

            if (error) throw error

            alert('Product added successfully!')
            setShowAddProduct(false)
            setNewProduct({
                name: '',
                description: '',
                category_id: '',
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

                await supabase
                    .from('daily_prices')
                    .delete()
                    .eq('product_id', productId)
                    .eq('effective_date', today)

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

                for (const tier of tiers) {
                    if (!tier.weight_grams || !tier.price || isNaN(parseInt(tier.weight_grams)) || isNaN(parseFloat(tier.price))) {
                        alert('Please enter valid weight and price for all tiers')
                        return
                    }
                }

                await supabase
                    .from('weight_tiers')
                    .delete()
                    .eq('product_id', productId)
                    .eq('effective_date', today)

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

    // Pagination logic
    const indexOfLastRecord = currentPage * recordsPerPage
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
    const currentRecords = products.slice(indexOfFirstRecord, indexOfLastRecord)
    const totalPages = Math.ceil(products.length / recordsPerPage)

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

                            {/*<div>*/}
                            {/*    <label className="block text-sm font-medium text-gray-700 mb-2">*/}
                            {/*        Category*/}
                            {/*    </label>*/}
                            {/*    <input*/}
                            {/*        type="text"*/}
                            {/*        value={newProduct.category}*/}
                            {/*        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}*/}
                            {/*        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"*/}
                            {/*        placeholder="Vegetables"*/}
                            {/*    />*/}
                            {/*</div>*/}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={newProduct.category_id}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, category_id: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
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

            {/* Products Table */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pricing Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentRecords.map((product) => (
                        <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">{product.category}</div>
                                <div className="text-xs text-gray-400">{product.description}</div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        product.pricing_type === 'daily'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {product.pricing_type === 'daily' ? 'Daily' : 'Tiered'}
                                    </span>

                                {!product.is_active && (
                                    <div className="text-xs mt-1 text-red-600">Inactive</div>
                                )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                {product.pricing_type === 'daily' ? (
                                    editingProduct === product.id ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={priceUpdates[product.id]?.price_per_kg || ''}
                                            onChange={(e) => setPriceUpdates({
                                                ...priceUpdates,
                                                [product.id]: { price_per_kg: e.target.value }
                                            })}
                                            className="w-40 px-3 py-2 border rounded-lg"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-green-600">
                                                Rs. {dailyPrices[product.id]?.price_per_kg?.toFixed(2) || 'Not set'}
                                            </span>
                                    )
                                ) : (
                                    editingProduct === product.id ? (
                                        <div className="space-y-2">
                                            {(priceUpdates[product.id]?.tiers || []).map((tier: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
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
                                                        className="w-24 px-2 py-1 border rounded-lg"
                                                    />
                                                    <span>=</span>
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
                                                        className="w-24 px-2 py-1 border rounded-lg"
                                                    />
                                                    <button onClick={() => handleRemoveTier(product.id, index)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => handleAddTier(product.id)}
                                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded mt-2"
                                            >
                                                <Plus className="w-4 h-4 inline-block" /> Add Tier
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {(weightTiers[product.id] || []).sort((a, b) => a.weight_grams - b.weight_grams).map((tier, idx) => (
                                                <div key={idx} className="text-sm">
                                                    {tier.weight_grams} g = <span className="font-semibold text-green-600">Rs. {tier.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                                {editingProduct === product.id ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdatePrice(product.id)}
                                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingProduct(null)
                                                setPriceUpdates({})
                                            }}
                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
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
                                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
