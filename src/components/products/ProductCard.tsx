// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { ProductWithPricing, WeightTier } from '@/lib/types/database.types'
import Image from 'next/image'

interface ProductCardProps {
    product: ProductWithPricing
    onAddToCart: (productId: string, weightGrams: number, quantity: number, price: number) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const [selectedWeight, setSelectedWeight] = useState<number>(500)
    const [quantity, setQuantity] = useState(1)

    // Calculate price based on pricing type
    const getPrice = (weightGrams: number): number => {
        if (product.pricing_type === 'daily' && product.daily_price) {
            return (product.daily_price.price_per_kg * weightGrams) / 1000
        }

        if (product.pricing_type === 'tiered' && product.weight_tiers) {
            const tier = product.weight_tiers.find(t => t.weight_grams === weightGrams)
            return tier?.price || 0
        }

        return 0
    }

    // Get available weights
    const getAvailableWeights = (): number[] => {
        if (product.pricing_type === 'tiered' && product.weight_tiers) {
            return product.weight_tiers.map(t => t.weight_grams).sort((a, b) => a - b)
        }
        return [250, 500, 1000] // Default weights for daily pricing
    }

    const availableWeights = getAvailableWeights()
    const currentPrice = getPrice(selectedWeight)
    const totalPrice = currentPrice * quantity

    const handleAddToCart = () => {
        onAddToCart(product.id, selectedWeight, quantity, currentPrice)
        setQuantity(1) // Reset quantity after adding
    }

    const formatWeight = (grams: number): string => {
        if (grams >= 1000) {
            return `${grams / 1000} kg`
        }
        return `${grams} g`
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="w-16 h-16" />
                    </div>
                )}
                {product.category && (
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            {product.category}
          </span>
                )}
            </div>

            {/* Product Details */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
                {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Weight Selector */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Select Weight</label>
                    <div className="grid grid-cols-3 gap-2">
                        {availableWeights.map((weight) => (
                            <button
                                key={weight}
                                onClick={() => setSelectedWeight(weight)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                    selectedWeight === weight
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                                }`}
                            >
                                {formatWeight(weight)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline justify-between mb-3">
                    <div>
                        <span className="text-2xl font-bold text-green-600">₹{currentPrice.toFixed(2)}</span>
                        <span className="text-sm text-gray-500 ml-1">/ {formatWeight(selectedWeight)}</span>
                    </div>
                    {product.pricing_type === 'daily' && product.daily_price && (
                        <span className="text-xs text-gray-500">
              ₹{product.daily_price.price_per_kg}/kg
            </span>
                    )}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            disabled={quantity <= 1}
                        >
                            <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-semibold">{quantity}</span>
                        <button
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            disabled={quantity >= 10}
                        >
                            <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Total & Add to Cart */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">₹{totalPrice.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>
        </div>
    )
}