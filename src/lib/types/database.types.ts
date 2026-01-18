// src/lib/types/database.types.ts

export type PricingType = 'daily' | 'tiered'
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface Profile {
    id: string
    phone: string
    full_name: string | null
    created_at: string
    updated_at: string
}

export interface GuestCustomer {
    id: string
    email: string
    phone: string
    full_name: string
    created_at: string
}

export interface ServiceZone {
    id: string
    pin_code: string
    area_name: string | null
    is_active: boolean
    created_at: string
}

export interface Product {
    id: string
    name: string
    description: string | null
    image_url: string | null
    category: string | null
    is_active: boolean
    pricing_type: PricingType
    base_unit: string
    created_at: string
    updated_at: string
}

export interface DailyPrice {
    id: string
    product_id: string
    price_per_kg: number
    effective_date: string
    created_at: string
}

export interface WeightTier {
    id: string
    product_id: string
    weight_grams: number
    price: number
    effective_date: string
    created_at: string
}

export interface DeliverySlot {
    id: string
    slot_date: string
    start_time: string
    end_time: string
    max_orders: number | null
    current_orders: number
    is_active: boolean
    created_at: string
}

export interface Order {
    id: string
    order_number: string
    user_id: string | null
    guest_customer_id: string | null
    delivery_slot_id: string | null
    delivery_address: string
    pin_code: string
    phone: string
    email: string | null
    total_amount: number
    status: OrderStatus
    payment_status: PaymentStatus
    notes: string | null
    created_at: string
    updated_at: string
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: string | null
    product_name: string
    weight_grams: number
    unit_price: number
    quantity: number
    subtotal: number
    created_at: string
}

export interface OrderStatusHistory {
    id: string
    order_id: string
    status: OrderStatus
    notes: string | null
    created_by: string | null
    created_at: string
}

// Extended types with relations
export interface ProductWithPricing extends Product {
    daily_price?: DailyPrice
    weight_tiers?: WeightTier[]
}

export interface OrderWithDetails extends Order {
    order_items: OrderItem[]
    delivery_slot?: DeliverySlot
    guest_customer?: GuestCustomer
}

export interface CartItem {
    product: Product
    weight_grams: number
    quantity: number
    price: number
}

export interface CheckoutData {
    full_name: string
    email: string
    phone: string
    delivery_address: string
    pin_code: string
    delivery_slot_id: string
    notes?: string
}