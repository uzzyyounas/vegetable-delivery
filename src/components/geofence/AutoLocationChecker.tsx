// src/components/geofence/AutoLocationChecker.tsx
'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AutoLocationCheckerProps {
    onLocationVerified: (isInArea: boolean, location: { lat: number; lng: number }) => void
}

interface ServiceAreaConfig {
    center_lat: number
    center_lng: number
    radius_km: number
    city_name: string
    country: string
}

export default function AutoLocationChecker({ onLocationVerified }: AutoLocationCheckerProps) {
    const [isChecking, setIsChecking] = useState(true)
    const [error, setError] = useState('')
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isInServiceArea, setIsInServiceArea] = useState<boolean | null>(null)
    const [distance, setDistance] = useState<number>(0)
    const [serviceArea, setServiceArea] = useState<ServiceAreaConfig | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchServiceAreaConfig()
    }, [])

    const fetchServiceAreaConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('service_area')
                .select('*')
                .eq('is_active', true)
                .single()

            if (data) {
                setServiceArea(data as ServiceAreaConfig)
                detectLocation(data as ServiceAreaConfig)
            } else {
                // Fallback to default if no config in database
                const defaultConfig: ServiceAreaConfig = {
                    center_lat: 31.4504,
                    center_lng: 73.1350,
                    radius_km: 15,
                    city_name: 'Faisalabad',
                    country: 'Pakistan'
                }
                setServiceArea(defaultConfig)
                detectLocation(defaultConfig)
            }
        } catch (err) {
            console.error('Error fetching service area:', err)
            // Use default config on error
            const defaultConfig: ServiceAreaConfig = {
                center_lat: 31.4504,
                center_lng: 73.1350,
                radius_km: 15,
                city_name: 'Faisalabad',
                country: 'Pakistan'
            }
            setServiceArea(defaultConfig)
            detectLocation(defaultConfig)
        }
    }

    // Calculate distance between two coordinates
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371 // Earth's radius in km
        const dLat = toRad(lat2 - lat1)
        const dLon = toRad(lon2 - lon1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const toRad = (value: number): number => {
        return (value * Math.PI) / 180
    }

    const checkLocation = (latitude: number, longitude: number, config: ServiceAreaConfig) => {
        setUserLocation({ lat: latitude, lng: longitude })

        // Calculate distance from service center
        const dist = calculateDistance(
            latitude,
            longitude,
            config.center_lat,
            config.center_lng
        )

        setDistance(dist)

        // Check if within service radius
        const inArea = dist <= config.radius_km
        setIsInServiceArea(inArea)
        onLocationVerified(inArea, { lat: latitude, lng: longitude })
    }

    const detectLocation = (config: ServiceAreaConfig) => {
        setIsChecking(true)
        setError('')

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            setIsChecking(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                checkLocation(latitude, longitude, config)
                setIsChecking(false)
            },
            (err) => {
                console.error('Geolocation error:', err)

                let errorMessage = 'Unable to get your location'

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.'
                        break
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.'
                        break
                    case err.TIMEOUT:
                        errorMessage = 'Location request timed out.'
                        break
                }

                setError(errorMessage)
                setIsInServiceArea(false)
                onLocationVerified(false, { lat: 0, lng: 0 })
                setIsChecking(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    if (isChecking) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                    <div>
                        <p className="font-medium text-gray-900">Detecting your location...</p>
                        <p className="text-sm text-gray-600">Please allow location access</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">Location Access Required</h3>
                        <p className="text-sm text-red-700 mb-3">{error}</p>
                        <button
                            onClick={detectLocation}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                        >
                            <Navigation className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (isInServiceArea === true && serviceArea) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <p className="font-medium text-green-900">Great! We deliver to your area</p>
                        <p className="text-sm text-green-700">
                            You're {distance.toFixed(1)} km from our service center in {serviceArea.city_name}, {serviceArea.country}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (isInServiceArea === false && serviceArea) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Currently Not Available in Your Area</h3>
                        <p className="text-sm text-orange-700 mb-2">
                            You're {distance.toFixed(1)} km from our service area in {serviceArea.city_name}.
                        </p>
                        <p className="text-sm text-orange-700 mb-3">
                            We currently serve within {serviceArea.radius_km} km of {serviceArea.city_name} city center.
                        </p>
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                            <p className="text-xs font-medium text-gray-700 mb-1">Your Location:</p>
                            <p className="text-xs text-gray-600">
                                {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}
                            </p>
                        </div>
                        <p className="text-xs text-orange-600 mt-3">
                            You can browse products but won't be able to place orders
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return null
}