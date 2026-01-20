// src/app/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export default async function HomePage() {
    const supabase = await createServerSupabaseClient()

    const today = new Date().toISOString().split('T')[0]

    // Fetch all active products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

    if (productsError || !products) {
        console.error('Error fetching products:', productsError)
        return <ShopClient products={[]} />
    }

    // Fetch all daily prices for today (LEFT JOIN approach)
    const { data: dailyPrices } = await supabase
        .from('daily_prices')
        .select('*')
        .eq('effective_date', today)

    // Fetch all weight tiers for today (LEFT JOIN approach)
    const { data: weightTiers } = await supabase
        .from('weight_tiers')
        .select('*')
        .eq('effective_date', today)

    // Manually join the data
    const productsWithPricing = products.map(product => {
        if (product.pricing_type === 'daily') {
            const dailyPrice = dailyPrices?.find(dp => dp.product_id === product.id)

            return {
                ...product,
                daily_price: dailyPrice || null,
                weight_tiers: null
            }
        } else {
            const tiers = weightTiers?.filter(wt => wt.product_id === product.id) || []

            return {
                ...product,
                daily_price: null,
                weight_tiers: tiers
            }
        }
    })

    // Filter out products without prices
    const availableProducts = productsWithPricing.filter(p => {
        if (p.pricing_type === 'daily') {
            return p.daily_price !== null
        } else {
            return p.weight_tiers && p.weight_tiers.length > 0
        }
    })

    // Debug logging (remove in production)
    console.log('📅 Date:', today)
    console.log('📦 Total products:', products.length)
    console.log('💰 Daily prices:', dailyPrices?.length || 0)
    console.log('⚖️ Weight tiers:', weightTiers?.length || 0)
    console.log('✅ Available products:', availableProducts.length)

    return <ShopClient products={availableProducts} />
}