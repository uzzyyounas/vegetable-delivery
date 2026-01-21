// src/lib/config/location.ts

// ============================================
// SERVICE LOCATION CONFIGURATION
// ============================================

export const SERVICE_LOCATION = {
    // City center coordinates
    center: {
        lat: 31.4504,  // Faisalabad city center latitude
        lng: 73.1350,  // Faisalabad city center longitude
    },

    // Service radius in kilometers
    radiusKm: 15,

    // Display information
    cityName: 'Faisalabad',
    country: 'Pakistan',

    // Popular areas in Faisalabad (for reference)
    popularAreas: [
        { name: 'D Ground', lat: 31.4180, lng: 73.0790 },
        { name: 'Ghulam Muhammad Abad', lat: 31.4030, lng: 73.1100 },
        { name: 'Peoples Colony', lat: 31.4280, lng: 73.0680 },
        { name: 'Samanabad', lat: 31.4450, lng: 73.0850 },
        { name: 'Susan Road', lat: 31.4125, lng: 73.0743 },
    ]
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
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

function toRad(value: number): number {
    return (value * Math.PI) / 180
}

/**
 * Check if a location is within service area
 */
export function isInServiceArea(lat: number, lng: number): boolean {
    const distance = calculateDistance(
        lat,
        lng,
        SERVICE_LOCATION.center.lat,
        SERVICE_LOCATION.center.lng
    )

    return distance <= SERVICE_LOCATION.radiusKm
}

/**
 * Get closest popular area to given coordinates
 */
export function getClosestArea(lat: number, lng: number): string {
    let closest = SERVICE_LOCATION.popularAreas[0]
    let minDistance = calculateDistance(lat, lng, closest.lat, closest.lng)

    SERVICE_LOCATION.popularAreas.forEach(area => {
        const dist = calculateDistance(lat, lng, area.lat, area.lng)
        if (dist < minDistance) {
            minDistance = dist
            closest = area
        }
    })

    return closest.name
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// In your component:
import { SERVICE_LOCATION, isInServiceArea, calculateDistance } from '@/lib/config/location'

const userLat = 31.4180
const userLng = 73.0790

const distance = calculateDistance(
  userLat,
  userLng,
  SERVICE_LOCATION.center.lat,
  SERVICE_LOCATION.center.lng
)

const canOrder = isInServiceArea(userLat, userLng)

console.log(`Distance: ${distance.toFixed(2)} km`)
console.log(`Can order: ${canOrder}`)
*/