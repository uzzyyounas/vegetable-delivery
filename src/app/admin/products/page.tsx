// src/app/admin/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { ProductWithPricing } from '@/lib/types/database.types'

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductWithPricing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingProduct, setEditingProduct] = useState<string | null>(null)
    const [priceUpdates, setPriceUpdates] = useState<Record<string, any>>({})

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setIsLoading(true)

        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        daily_price:daily_prices(price_per_kg, effective_date),
        weight_tiers(weight_grams, price, effective_date)
      `)
            .order('name')

        if (data) {
            const transformed = data.map(p => ({
                ...p,
                daily_price: Array.isArray(p.daily_price) ? p.daily_price.find(dp => dp.effective_date === today) : p.daily_price,
                weight_tiers: Array.isArray(p.weight_tiers) ? p.weight_tiers.filter(wt => wt.effective_date === today) : []
            }))
            setProducts(transformed as ProductWithPricing[])
        }

        setIsLoading(false)
    }

    const handleUpdatePrice = async (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        try {
            if (product.pricing_type === 'daily') {
                const newPrice = priceUpdates[productId]?.price_per_kg
                if (!newPrice) return

                // Delete old price for today
                await supabase
                    .from('daily_prices')
                    .delete()
                    .eq('product_id', productId)
                    .eq('effective_date', today)

                // Insert new price
                await supabase
                    .from('daily_prices')
                    .insert({
                        product_id: productId,
                        price_per_kg: parseFloat(newPrice),
                        effective_date: today
                    })
            } else {
                const tiers = priceUpdates[productId]?.tiers || []

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

                if (tierInserts.length > 0) {
                    await supabase
                        .from('weight_tiers')
                        .insert(tierInserts)
                }
            }

            setEditingProduct(null)
            setPriceUpdates({})
            fetchProducts()

            alert('Price updated successfully!')
        } catch (error) {
            console.error('Error updating price:', error)
            alert('Failed to update price')
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
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading products...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">Product Price Management</h1>
                        <p className="text-gray-600 mt-1">Update daily prices for {today}</p>
                    </div>

                    <div className="divide-y">
                        {products.map(product => (
                            <div key={product.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                                        <p className="text-sm text-gray-600">{product.description}</p>
                                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {product.pricing_type === 'daily' ? 'Daily Pricing' : 'Tiered Pricing'}
                    </span>
                                    </div>

                                    {editingProduct === product.id ? (
                                        <div className="flex gap-2">
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
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingProduct(product.id)
                                                if (product.pricing_type === 'daily') {
                                                    setPriceUpdates({
                                                        ...priceUpdates,
                                                        [product.id]: {
                                                            price_per_kg: product.daily_price?.price_per_kg || ''
                                                        }
                                                    })
                                                } else {
                                                    setPriceUpdates({
                                                        ...priceUpdates,
                                                        [product.id]: {
                                                            tiers: product.weight_tiers?.map(t => ({
                                                                weight_grams: t.weight_grams,
                                                                price: t.price
                                                            })) || []
                                                        }
                                                    })
                                                }
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Price
                                        </button>
                                    )}
                                </div>

                                {/* Daily Pricing */}
                                {product.pricing_type === 'daily' && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price per kg (₹)
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
                                                ₹{product.daily_price?.price_per_kg?.toFixed(2) || 'Not set'}
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
                                                {(priceUpdates[product.id]?.tiers || []).map((tier: any, index: number) => (
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
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {product.weight_tiers && product.weight_tiers.length > 0 ? (
                                                    product.weight_tiers.map((tier, index) => (
                                                        <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {tier.weight_grams >= 1000
                                    ? `${tier.weight_grams / 1000} kg`
                                    : `${tier.weight_grams} g`}
                              </span>
                                                            <span className="font-semibold text-green-600">
                                ₹{tier.price.toFixed(2)}
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}