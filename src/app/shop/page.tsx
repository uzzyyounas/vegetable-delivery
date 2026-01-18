import { createServerSupabaseClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export default async function ShopPage() {
    const supabase = await createServerSupabaseClient()

    // Fetch products with today's pricing
    const today = new Date().toISOString().split('T')[0]

    const { data: products } = await supabase
        .from('products')
        .select(`
      *,
      daily_price:daily_prices!inner(price_per_kg, effective_date),
      weight_tiers!inner(weight_grams, price, effective_date)
    `)
        .eq('is_active', true)
        .or(`daily_price.effective_date.eq.${today},weight_tiers.effective_date.eq.${today}`)


    // Transform data for client
    const productsWithPricing = products?.map(product => {
        if (product.pricing_type === 'daily') {
            return {
                ...product,
                daily_price: Array.isArray(product.daily_price) ? product.daily_price[0] : product.daily_price,
                weight_tiers: null
            }
        } else {
            return {
                ...product,
                daily_price: null,
                weight_tiers: product.weight_tiers
            }
        }
    }) || []

    return <ShopClient products={productsWithPricing} />
}