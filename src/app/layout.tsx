// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: 'Fresh Veggies - Farm Fresh Vegetables Delivered',
    description: 'Order fresh vegetables from local farms, delivered to your doorstep',
    keywords: 'vegetables, fresh produce, delivery, organic, farm fresh',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body suppressHydrationWarning>
        {children}
        </body>
        </html>
    )
}