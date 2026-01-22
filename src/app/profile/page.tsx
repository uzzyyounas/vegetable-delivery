// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Package, LogOut, Loader2, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderTracker'
import Link from 'next/link'

// interface Order {
//     id: string
//     order_number: string
//     total_amount: number
//     status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
//     created_at: string
//     delivery_slot: {
//         slot_date: string
//         start_time: string
//     } | null
// }

interface Order {
    id: string
    order_number: string
    total_amount: number
    status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'
    created_at: string
    delivery_slot: {
        slot_date: string
        start_time: string
    }[]  // <-- array
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        setIsLoading(true)

        try {
            // Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                router.push('/login')
                return
            }

            setUser(user)

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(profileData)

            // Get orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          delivery_slot:delivery_slots(slot_date, start_time)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setOrders(ordersData as Order[] || [])
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold text-gray-900">
                            ← Fresh Veggies
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            {/* Profile Info */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="font-semibold text-gray-900 text-lg">
                                    {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {user?.email}
                                </p>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        activeTab === 'orders'
                                            ? 'bg-green-50 text-green-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Package className="w-5 h-5" />
                                    My Orders
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        activeTab === 'profile'
                                            ? 'bg-green-50 text-green-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <User className="w-5 h-5" />
                                    Profile Details
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'orders' && (
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

                                {orders.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                                        <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                                        <Link
                                            href="/"
                                            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                                        >
                                            Start Shopping
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                            Order #{order.order_number}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Placed on {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-600">Total</p>
                                                            <p className="text-xl font-bold text-green-600">
                                                                Rs.{order.total_amount.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <OrderStatusBadge status={order.status} />
                                                    </div>
                                                </div>

                                                {order.delivery_slot && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                              Delivery: {formatDate(order.delivery_slot.slot_date)} at{' '}
                                                            {new Date(`2000-01-01T${order.delivery_slot.start_time}`).toLocaleTimeString('en-IN', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                            </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    <Link
                                                        href={`/orders/${order.id}`}
                                                        className="flex-1 bg-green-600 text-white text-center py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                                                    >
                                                        Track Order
                                                    </Link>
                                                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                                                        <button className="flex-1 border-2 border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                                            Reorder
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Details</h1>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                <User className="w-4 h-4" />
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile?.full_name || ''}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                <Mail className="w-4 h-4" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                <Phone className="w-4 h-4" />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={profile?.phone || ''}
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="font-semibold text-gray-900 mb-3">Account Statistics</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-green-50 rounded-lg p-4">
                                                    <p className="text-sm text-green-700 mb-1">Total Orders</p>
                                                    <p className="text-2xl font-bold text-green-600">{orders.length}</p>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <p className="text-sm text-blue-700 mb-1">Total Spent</p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        Rs.{orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}