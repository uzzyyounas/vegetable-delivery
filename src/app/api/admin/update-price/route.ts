import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    const { productId, pricingType, newPrice, tiers } = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const supabase = createServerSupabaseClient()

    try {
        if (pricingType === 'daily') {

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

            if (error) return NextResponse.json({ error }, { status: 400 })

        } else {

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

            if (tierInserts.length > 0) {
                const { error } = await supabase
                    .from('weight_tiers')
                    .insert(tierInserts)

                if (error) return NextResponse.json({ error }, { status: 400 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 })
    }
}
