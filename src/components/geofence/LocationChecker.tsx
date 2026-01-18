// src/components/geofence/LocationChecker.tsx
'use client'

import { useState, useEffect } from 'react'
import { MapPin, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LocationCheckerProps {
    onLocationVerified: (pinCode: string) => void
    onLocationDenied: () => void
}

export default function LocationChecker({ onLocationVerified, onLocationDenied }: LocationCheckerProps) {
    const [pinCode, setPinCode] = useState('')
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState('')
    const [isInServiceArea, setIsInServiceArea] = useState<boolean | null>(null)
    const [availableZones, setAvailableZones] = useState<string[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchAvailableZones()
    }, [])

    const fetchAvailableZones = async () => {
        const { data, error } = await supabase
            .from('service_zones')
            .select('pin_code, area_name')
            .eq('is_active', true)
            .order('area_name')

        if (data) {
            setAvailableZones(data.map(z => `${z.pin_code} (${z.area_name})`))
        }
    }

    const checkPinCode = async (code: string) => {
        if (!code || code.length < 6) {
            setError('Please enter a valid pin code')
            return
        }

        setIsChecking(true)
        setError('')

        try {
            const { data, error } = await supabase
                .from('service_zones')
                .select('*')
                .eq('pin_code', code)
                .eq('is_active', true)
                .single()

            if (error || !data) {
                setIsInServiceArea(false)
                onLocationDenied()
            } else {
                setIsInServiceArea(true)
                onLocationVerified(code)
            }
        } catch (err) {
            setError('Failed to verify location')
            setIsInServiceArea(false)
        } finally {
            setIsChecking(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        checkPinCode(pinCode)
    }

    if (isInServiceArea === true) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="w-5 h-5" />
                    <p className="font-medium">Great! We deliver to your area ({pinCode})</p>
                </div>
            </div>
        )
    }

    if (isInServiceArea === false) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Coming Soon to Your Area!</h3>
                        <p className="text-sm text-orange-700 mb-3">
                            We don't deliver to {pinCode} yet, but we're expanding soon.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Currently serving:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableZones.map((zone, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {zone}
              </span>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsInServiceArea(null)
                        setPinCode('')
                    }}
                    className="mt-4 text-sm text-orange-700 font-medium hover:text-orange-800"
                >
                    Try a different pin code
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Check Delivery Availability</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Your Pin Code
                    </label>
                    <input
                        id="pincode"
                        type="text"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setPinCode(value)
                            setError('')
                        }}
                        placeholder="e.g., 400001"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={isChecking}
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isChecking || pinCode.length < 6}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Checking...
                        </>
                    ) : (
                        'Check Availability'
                    )}
                </button>
            </form>

            {availableZones.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">We currently serve:</p>
                    <div className="flex flex-wrap gap-1">
                        {availableZones.slice(0, 3).map((zone, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {zone.split('(')[0].trim()}
              </span>
                        ))}
                        {availableZones.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                +{availableZones.length - 3} more
              </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}