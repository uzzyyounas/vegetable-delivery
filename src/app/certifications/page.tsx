// src/app/certifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Shield, CheckCircle, Leaf } from 'lucide-react'
import Link from 'next/link'

interface BusinessInfo {
    certification_name: string
    certification_number: string
}

export default function CertificationsPage() {
    const [info, setInfo] = useState<BusinessInfo | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchBusinessInfo()
    }, [])

    const fetchBusinessInfo = async () => {
        const { data } = await supabase
            .from('business_info')
            .select('certification_name, certification_number')
            .eq('is_active', true)
            .single()

        if (data) {
            setInfo(data)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Leaf className="w-8 h-8 text-green-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Fresh Veggies</h1>
                    </Link>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <Award className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Certifications</h1>
                    <p className="text-xl text-gray-600">
                        Committed to quality, safety, and excellence
                    </p>
                </div>

                {/* Main Certification Card */}
                {info && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-8 mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{info.certification_name}</h2>
                                <p className="text-green-600 font-semibold">Certificate No: {info.certification_number}</p>
                            </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed mb-6">
                            We are proud to be certified by Pakistan Standards and Quality Control Authority (PSQCA),
                            ensuring that all our products meet the highest standards of food safety and quality.
                        </p>

                        <div className="bg-green-50 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3">What This Certification Means:</h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">All products meet national food safety standards</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Regular quality inspections and audits</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Proper handling and storage procedures</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Traceability from farm to your door</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Our Commitment Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Food Safety</h3>
                        <p className="text-sm text-gray-600">
                            Strict adherence to food safety protocols at every step
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <Leaf className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fresh Quality</h3>
                        <p className="text-sm text-gray-600">
                            Farm-fresh vegetables delivered within 24 hours of harvest
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Quality Assured</h3>
                        <p className="text-sm text-gray-600">
                            100% satisfaction guarantee on all our products
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">About PSQCA</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                        The Pakistan Standards and Quality Control Authority (PSQCA) is the national standards body of Pakistan,
                        responsible for setting and maintaining quality standards across various industries, including food safety.
                        Our certification demonstrates our commitment to providing you with the safest, highest-quality produce.
                    </p>
                </div>

                {/* Back Button */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
                    >
                        Back to Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}