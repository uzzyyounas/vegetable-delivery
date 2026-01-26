// src/app/admin/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Leaf,
    Package,
    Calendar,
    MapPin,
    ShoppingBag,
    Menu,
    X,
    Globe,
    Settings,
    LayoutDashboard,
    LogOut,
    User
} from 'lucide-react'

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true)
            } else {
                setIsSidebarOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false)
        }
    }, [pathname, isMobile])

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Delivery Slots', href: '/admin/delivery-slots', icon: Calendar },
        { name: 'Service Area', href: '/admin/service-area', icon: Globe },
        { name: 'Business Settings', href: '/admin/business-info', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-4">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {isSidebarOpen ? (
                                    <X className="w-6 h-6 text-gray-700" />
                                ) : (
                                    <Menu className="w-6 h-6 text-gray-700" />
                                )}
                            </button>

                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2 lg:gap-3">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                    <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900">Fresh Veggies</h1>
                                    <p className="text-xs text-gray-500 hidden sm:block">Admin Panel</p>
                                </div>
                            </Link>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Admin Profile Dropdown */}

                            {/*<div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">*/}
                            {/*    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">*/}
                            {/*        <User className="w-4 h-4 text-green-600" />*/}
                            {/*    </div>*/}
                            {/*    <div className="hidden lg:block">*/}
                            {/*        <p className="text-sm font-medium text-gray-900">Admin User</p>*/}
                            {/*        <p className="text-xs text-gray-500">Administrator</p>*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            {/* Back to Store */}
                            <Link
                                href="/"
                                className="text-sm text-gray-600 hover:text-gray-900 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                <span className="hidden sm:inline">Back to Store</span>
                                <span className="sm:hidden">Store</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex relative">
                {/* Backdrop for mobile */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
            fixed lg:sticky top-0 left-0 z-20 h-screen
            w-64 lg:w-72 bg-white border-r border-gray-200
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            pt-[73px] lg:pt-0
            shadow-xl lg:shadow-none
          `}
                >
                    <nav className="p-4 lg:p-6 space-y-2 overflow-y-auto h-full pb-20">
                        <div className="mb-6 hidden lg:block">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                                Navigation
                            </h2>
                        </div>

                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg 
                    transition-all duration-200 group
                    ${isActive
                                        ? 'bg-green-50 text-green-700 font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }
                  `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-green-600 rounded-full" />
                                    )}
                                </Link>
                            )
                        })}

                        {/* Logout Button */}
                        {/*<div className="pt-6 mt-6 border-t border-gray-200">*/}
                        {/*    <button*/}
                        {/*        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"*/}
                        {/*    >*/}
                        {/*        <LogOut className="w-5 h-5" />*/}
                        {/*        <span className="font-medium">Logout</span>*/}
                        {/*    </button>*/}
                        {/*</div>*/}


                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 w-full min-h-screen">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}