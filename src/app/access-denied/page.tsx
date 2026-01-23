import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function AccessDenied() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
                <ShieldOff className="w-16 h-16 text-red-600 mx-auto mb-6" />

                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Access Denied
                </h1>

                <p className="text-gray-600 mb-6">
                    You do not have permission to access this page.
                    This area is restricted to administrators only.
                </p>

                <div className="flex justify-center gap-4">
                    <Link
                        href="/"
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
