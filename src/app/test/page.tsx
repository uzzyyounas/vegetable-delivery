// src/app/test/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function TestPage() {
    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

    const { data: dailyPrices } = await supabase
        .from('daily_prices')
        .select('*')
        .eq('effective_date', today)

    const { data: weightTiers } = await supabase
        .from('weight_tiers')
        .select('*')
        .eq('effective_date', today)

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>

            <div className="mb-6">
                <h2 className="text-xl font-bold">Today: {today}</h2>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold">Products ({products?.length || 0})</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(products, null, 2)}
        </pre>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold">Daily Prices ({dailyPrices?.length || 0})</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(dailyPrices, null, 2)}
        </pre>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold">Weight Tiers ({weightTiers?.length || 0})</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(weightTiers, null, 2)}
        </pre>
            </div>
        </div>
    )
}