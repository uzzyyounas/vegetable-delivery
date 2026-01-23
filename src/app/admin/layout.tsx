// src/app/admin/layout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Leaf, Package, Calendar, MapPin, ShoppingBag, Menu, X, Globe, Settings } from 'lucide-react'

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Package },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Delivery Slots', href: '/admin/delivery-slots', icon: Calendar },
        { name: 'Service Area', href: '/admin/service-area', icon: Globe },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Business Settings', href: '/admin/business-info', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                            >
                                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>

                            <Link href="/" className="flex items-center gap-2">
                                <Leaf className="w-8 h-8 text-green-600" />
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Fresh Veggies</h1>
                                    <p className="text-xs text-gray-500">Admin Panel</p>
                                </div>
                            </Link>
                        </div>

                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
                        >
                            Back to Store
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out mt-[73px] lg:mt-0`}
                >
                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-green-50 text-green-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}