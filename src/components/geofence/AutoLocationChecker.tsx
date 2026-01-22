// src/components/geofence/AutoLocationChecker.tsx
'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, Navigation, Settings } from 'lucide-react'
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
    const [permissionDenied, setPermissionDenied] = useState(false)

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

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371
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

        const dist = calculateDistance(
            latitude,
            longitude,
            config.center_lat,
            config.center_lng
        )

        setDistance(dist)

        const inArea = dist <= config.radius_km
        setIsInServiceArea(inArea)
        onLocationVerified(inArea, { lat: latitude, lng: longitude })
    }

    const openLocationSettings = () => {
        const userAgent = navigator.userAgent.toLowerCase()
        const isAndroid = /android/.test(userAgent)
        const isIOS = /iphone|ipad|ipod/.test(userAgent)
        const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent)
        const isFirefox = /firefox/.test(userAgent)
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)

        if (isAndroid) {
            // Android - Try multiple deep links immediately

            // Try 1: Open Chrome's site-specific settings (BEST for Chrome Android)
            try {
                window.location.href = 'googlechrome://settings/content/siteDetails?site=' + encodeURIComponent(window.location.origin)
                return
            } catch (e) {
                console.log('Chrome settings failed, trying next method')
            }

            // Try 2: Open Android Location Settings directly
            setTimeout(() => {
                try {
                    window.location.href = 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end'
                    return
                } catch (e) {
                    console.log('Location settings intent failed')
                }
            }, 300)

            // Try 3: Open App Settings
            setTimeout(() => {
                try {
                    window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:com.android.chrome;end'
                } catch (e) {
                    console.log('App settings intent failed')
                }
            }, 600)

            // Try 4: Generic app settings
            setTimeout(() => {
                try {
                    window.location.href = 'app-settings:'
                } catch (e) {
                    console.log('Generic app settings failed')
                }
            }, 900)

        } else if (isIOS) {
            // iOS - Try to open Settings app directly

            // Try 1: Open Privacy & Location settings (iOS 8+)
            try {
                window.location.href = 'App-prefs:root=Privacy&path=LOCATION'
                return
            } catch (e) {
                console.log('iOS privacy settings failed')
            }

            // Try 2: Open general settings
            setTimeout(() => {
                try {
                    window.location.href = 'app-settings:'
                } catch (e) {
                    console.log('iOS settings failed')
                }
            }, 300)

            // Try 3: Open Safari settings
            setTimeout(() => {
                try {
                    window.location.href = 'App-prefs:root=Safari'
                } catch (e) {
                    console.log('Safari settings failed')
                }
            }, 600)

        } else {
            // Desktop - Try to trigger browser's site settings
            if (isChrome) {
                try {
                    window.open('chrome://settings/content/siteDetails?site=' + encodeURIComponent(window.location.origin))
                } catch (e) {
                    console.log('Chrome settings page failed')
                }
            } else if (isFirefox) {
                try {
                    window.open('about:preferences#privacy')
                } catch (e) {
                    console.log('Firefox settings failed')
                }
            }
        }
    }

    const detectLocation = (config: ServiceAreaConfig) => {
        setIsChecking(true)
        setError('')
        setPermissionDenied(false)

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
                let shouldOpenSettings = false

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied'
                        shouldOpenSettings = true
                        setPermissionDenied(true)
                        break
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable'
                        break
                    case err.TIMEOUT:
                        errorMessage = 'Location request timed out'
                        break
                }

                setError(errorMessage)
                setIsInServiceArea(false)
                onLocationVerified(false, { lat: 0, lng: 0 })
                setIsChecking(false)

                // Automatically prompt to open settings if permission denied
                if (shouldOpenSettings) {
                    setTimeout(() => {
                        // Directly open settings without confirmation dialog
                        openLocationSettings()
                    }, 500)
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    const handleRetryWithSettings = () => {
        if (permissionDenied) {
            openLocationSettings()
        } else {
            if (serviceArea) {
                detectLocation(serviceArea)
            }
        }
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
        const userAgent = navigator.userAgent.toLowerCase()
        const isAndroid = /android/.test(userAgent)
        const isIOS = /iphone|ipad|ipod/.test(userAgent)
        const isMobile = isAndroid || isIOS

        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">Location Access Required</h3>
                        <p className="text-sm text-red-700 mb-4">{error}</p>

                        {permissionDenied && (
                            <>
                                <div className="bg-red-100 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-red-800 font-medium mb-2">
                                        ⚠️ Location permission is blocked
                                    </p>
                                    {isMobile ? (
                                        <div className="text-xs text-red-700 space-y-2">
                                            <p className="font-semibold">We tried to open your settings automatically.</p>
                                            <p>If settings didn't open, tap the button below to try again or manually:</p>
                                            {isAndroid && (
                                                <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                                                    <li>Tap lock icon 🔒 in address bar</li>
                                                    <li>Tap "Permissions"</li>
                                                    <li>Enable "Location"</li>
                                                    <li>Reload this page</li>
                                                </ol>
                                            )}
                                            {isIOS && (
                                                <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                                                    <li>Go to Settings app</li>
                                                    <li>Tap Safari or Chrome</li>
                                                    <li>Enable Location</li>
                                                    <li>Reload this page</li>
                                                </ol>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-red-700">
                                            Click the lock icon 🔒 in your address bar and enable location, then reload.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleRetryWithSettings}
                                className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm active:scale-95 transition-transform"
                            >
                                {permissionDenied ? (
                                    <>
                                        <Settings className="w-5 h-5" />
                                        <span>Open Settings Again</span>
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="w-5 h-5" />
                                        <span>Try Again</span>
                                    </>
                                )}
                            </button>

                            {permissionDenied && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex items-center justify-center gap-2 bg-white text-red-600 border-2 border-red-300 px-4 py-3 rounded-lg hover:bg-red-50 text-sm font-medium shadow-sm active:scale-95 transition-transform"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Reload Page</span>
                                </button>
                            )}
                        </div>
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