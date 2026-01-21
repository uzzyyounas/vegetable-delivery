// src/components/layout/TopBar.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Phone, Award, Clock } from 'lucide-react'

interface BusinessInfo {
    physical_address: string
    phone_number: string
    certification_name: string
    certification_number: string
    working_hours: string
}

export default function TopBar() {
    const [info, setInfo] = useState<BusinessInfo | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchBusinessInfo()
    }, [])

    const fetchBusinessInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('business_info')
                .select('*')
                .eq('is_active', true)
                .single()

            if (data) {
                setInfo(data as BusinessInfo)
            }
        } catch (error) {
            console.error('Error fetching business info:', error)
        }
    }

    if (!info) return null

    return (
        <div className="bg-green-700 text-white py-2 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    {/* Physical Location */}
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="hidden sm:inline">Visit us:</span>
                        <span className="font-medium">{info.physical_address}</span>
                    </div>

                    {/* Contact */}
                    <a
                        href={`tel:${info.phone_number}`}
                        className="flex items-center gap-2 hover:text-green-200 transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{info.phone_number}</span>
                    </a>

                    {/* Certification */}
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span className="hidden md:inline">{info.certification_name}:</span>
                        <span className="font-medium">{info.certification_number}</span>
                    </div>

                    {/* Working Hours */}
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{info.working_hours}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}