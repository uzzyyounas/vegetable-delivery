// src/app/admin/products/layout.tsx
import React from 'react'

export default function ProductsLayout({
                                           children,
                                       }: {
    children: React.ReactNode
}) {
    return (
        <section className="min-h-screen bg-gray-100">
            {children}
        </section>
    )
}
