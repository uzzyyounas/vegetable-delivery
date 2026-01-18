import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Leaf className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <Link
                    href="/"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                    Go Home
                </Link>
            </div>
        </div>
    )
}