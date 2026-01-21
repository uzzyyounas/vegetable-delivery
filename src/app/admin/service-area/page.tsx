// src/app/admin/service-area/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Save, Search, Loader2, Target } from 'lucide-react'

interface ServiceArea {
    id: string
    center_lat: number
    center_lng: number
    radius_km: number
    city_name: string
    country: string
    is_active: boolean
    created_at: string
}

export default function AdminServiceAreaPage() {
    const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        center_lat: 31.4504,
        center_lng: 73.1350,
        radius_km: 15,
        city_name: 'Faisalabad',
        country: 'Pakistan'
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchServiceArea()
    }, [])

    const fetchServiceArea = async () => {
        setIsLoading(true)

        const { data, error } = await supabase
            .from('service_area')
            .select('*')
            .eq('is_active', true)
            .single()

        if (data) {
            setServiceArea(data)
            setFormData({
                center_lat: data.center_lat,
                center_lng: data.center_lng,
                radius_km: data.radius_km,
                city_name: data.city_name,
                country: data.country
            })
        }

        setIsLoading(false)
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            if (serviceArea) {
                // Update existing
                const { error } = await supabase
                    .from('service_area')
                    .update({
                        center_lat: formData.center_lat,
                        center_lng: formData.center_lng,
                        radius_km: formData.radius_km,
                        city_name: formData.city_name,
                        country: formData.country
                    })
                    .eq('id', serviceArea.id)

                if (error) throw error
            } else {
                // Deactivate all existing areas
                await supabase
                    .from('service_area')
                    .update({ is_active: false })
                    .eq('is_active', true)

                // Create new
                const { error } = await supabase
                    .from('service_area')
                    .insert({
                        center_lat: formData.center_lat,
                        center_lng: formData.center_lng,
                        radius_km: formData.radius_km,
                        city_name: formData.city_name,
                        country: formData.country,
                        is_active: true
                    })

                if (error) throw error
            }

            alert('Service area updated successfully!')
            fetchServiceArea()
        } catch (error: any) {
            console.error('Error saving service area:', error)
            alert('Failed to save: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) {
            alert('Please enter a location to search')
            return
        }

        setIsSearching(true)

        try {
            // Using Nominatim (OpenStreetMap) geocoding API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
            )

            const data = await response.json()

            if (data && data.length > 0) {
                const result = data[0]
                setFormData({
                    ...formData,
                    center_lat: parseFloat(result.lat),
                    center_lng: parseFloat(result.lon),
                    city_name: result.display_name.split(',')[0] || formData.city_name
                })
                alert(`Location found: ${result.display_name}`)
            } else {
                alert('Location not found. Try a different search term.')
            }
        } catch (error) {
            console.error('Search error:', error)
            alert('Failed to search location')
        } finally {
            setIsSearching(false)
        }
    }

    const handleGetMyLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    center_lat: position.coords.latitude,
                    center_lng: position.coords.longitude
                })
                alert('Current location set!')
            },
            (error) => {
                alert('Failed to get your location: ' + error.message)
            }
        )
    }

    const openInGoogleMaps = () => {
        window.open(
            `https://www.google.com/maps?q=${formData.center_lat},${formData.center_lng}`,
            '_blank'
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading service area...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Service Area Settings</h1>
                <p className="text-gray-600 mt-1">Configure your delivery service area with coordinates</p>
            </div>

            {/* Map Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Service Area Map</h2>
                        <button
                            onClick={openInGoogleMaps}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <MapPin className="w-4 h-4" />
                            Open in Google Maps
                        </button>
                    </div>
                </div>

                {/* Embedded Map */}
                <div className="relative h-96">
                    <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.center_lng - 0.1},${formData.center_lat - 0.1},${formData.center_lng + 0.1},${formData.center_lat + 0.1}&layer=mapnik&marker=${formData.center_lat},${formData.center_lng}`}
                        className="w-full h-full border-0"
                        title="Service Area Map"
                    />
                </div>
            </div>

            {/* Search Location */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">Find Location</h2>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                                placeholder="Search for city, address, or landmark..."
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <button
                            onClick={handleSearchLocation}
                            disabled={isSearching}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Search
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="text-sm text-gray-500">OR</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <button
                        onClick={handleGetMyLocation}
                        className="w-full border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2"
                    >
                        <Target className="w-5 h-5" />
                        Use My Current Location
                    </button>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">Service Area Configuration</h2>

                <div className="space-y-4">
                    {/* City Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City Name
                        </label>
                        <input
                            type="text"
                            value={formData.city_name}
                            onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Latitude (Center)
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.center_lat}
                                onChange={(e) => setFormData({ ...formData, center_lat: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Longitude (Center)
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.center_lng}
                                onChange={(e) => setFormData({ ...formData, center_lng: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Service Radius */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Radius (km)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="100"
                            value={formData.radius_km}
                            onChange={(e) => setFormData({ ...formData, radius_km: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Customers within {formData.radius_km} km of the center can place orders
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Preview</h3>
                <div className="text-sm text-green-800 space-y-1">
                    <p>📍 <strong>Center:</strong> {formData.city_name}, {formData.country}</p>
                    <p>🌍 <strong>Coordinates:</strong> {formData.center_lat.toFixed(4)}, {formData.center_lng.toFixed(4)}</p>
                    <p>📏 <strong>Coverage:</strong> {formData.radius_km} km radius</p>
                    <p>📦 <strong>Approximate Area:</strong> {(Math.PI * formData.radius_km * formData.radius_km).toFixed(0)} km²</p>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSaving ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Save Service Area
                    </>
                )}
            </button>

            {/* Help Text */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 How to Use</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Search for your city or business location</li>
                    <li>Or use "Use My Current Location" if you're at your service center</li>
                    <li>Set the service radius (how far you deliver)</li>
                    <li>Click "Open in Google Maps" to verify the location</li>
                    <li>Save to apply changes to your website</li>
                </ul>
            </div>
        </div>
    )
}