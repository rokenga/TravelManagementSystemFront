"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Box, CircularProgress, Typography } from "@mui/material"
import "leaflet/dist/leaflet.css"
import type { Map as LeafletMap } from "leaflet"

interface LeafletMapDisplayProps {
  address: string
  initialZoom?: number
  height?: string | number
  hideErrors?: boolean
}

const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({
  address,
  initialZoom = 13,
  height = 300,
  hideErrors = false,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom] = useState(initialZoom)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Check if address is valid before attempting to display map
  const isValidAddress = address && address.trim() !== ""

  // Function to extract city from address
  const extractCity = (fullAddress: string): string => {
    // Split by commas and take the first part (usually the city)
    const parts = fullAddress.split(",").map((part) => part.trim())
    if (parts.length > 0) {
      return parts[0] // Return just the city
    }
    return fullAddress
  }

  // Function to geocode an address to coordinates with fallback
  const geocodeAddress = async (addressToGeocode: string, L: any) => {
    try {
      setLoading(true)
      setError(null)

      // Check if the address is already in coordinate format (e.g., "36.465040,32.118976")
      const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
      const coordsMatch = addressToGeocode.trim().match(coordsRegex)

      if (coordsMatch) {
        // If it's already coordinates, parse them
        const lat = Number.parseFloat(coordsMatch[1])
        const lng = Number.parseFloat(coordsMatch[3])
        setCoordinates([lat, lng])
        updateMap([lat, lng], L)
        setMapInitialized(true)
        return true
      }

      // Try with the full address first
      const success = await tryGeocode(addressToGeocode, L)
      if (success) return true

      // If full address fails, try with just the city
      const city = extractCity(addressToGeocode)
      if (city !== addressToGeocode) {
        return await tryGeocode(city, L)
      }

      return false
    } catch (err: any) {
      console.error("Geocoding error:", err)
      if (!hideErrors) {
        setError(`Failed to get coordinates: ${err instanceof Error ? err.message : String(err)}`)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  // Helper function to try geocoding with a specific address
  const tryGeocode = async (addressToTry: string, L: any): Promise<boolean> => {
    try {
      const encodedAddress = encodeURIComponent(addressToTry)
      const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat)
        const lon = Number.parseFloat(data[0].lon)
        setCoordinates([lat, lon])
        updateMap([lat, lon], L)
        setMapInitialized(true)
        return true
      } else {
        return false
      }
    } catch (err: any) {
      console.error(`Error geocoding ${addressToTry}:`, err)
      return false
    }
  }

  // Function to update the map with new coordinates
  const updateMap = (coords: [number, number], L: any) => {
    if (!mapContainerRef.current) {
      return
    }

    try {
      // If map doesn't exist, create it
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView(coords, zoom)

        // Add the OpenStreetMap tile layer
        const contributors = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: contributors,
        }).addTo(mapRef.current)
      } else {
        // If map exists, update the view
        mapRef.current.setView(coords, zoom)
      }

      // Clear existing markers
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer)
        }
      })

      // Add a marker at the coordinates
      L.marker(coords).addTo(mapRef.current)

      // Force a resize to ensure the map renders correctly
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
    } catch (err: any) {
      console.error("Map update error:", err)
      if (!hideErrors) {
        setError(`Failed to update map: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // Initialize the map when the component mounts
  useEffect(() => {
    const initializeMap = async () => {
      // Don't initialize if there's no valid address
      if (!isValidAddress) {
        setLoading(false)
        return
      }

      // Make sure Leaflet is only initialized in the browser
      if (typeof window === "undefined") {
        return
      }

      // Dynamically import Leaflet
      const initializeLeaflet = async () => {
        try {
          const leafletModule = await import("leaflet")
          const L = leafletModule.default

          // Fix Leaflet icon issue
          delete (L.Icon.Default.prototype as any)._getIconUrl

          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          })

          // If address is provided, geocode it
          if (address) {
            const success = await geocodeAddress(address, L)
            if (!success && !hideErrors) {
              setError("Could not find location on map")
            }
          }
        } catch (err: any) {
          console.error("Leaflet initialization error:", err)
          if (!hideErrors) {
            setError(`Failed to initialize map: ${err instanceof Error ? err.message : String(err)}`)
          }
          setLoading(false)
        }
      }

      await initializeLeaflet()
    }

    initializeMap()

    return () => {
      // Clean up the map when component unmounts
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [address, zoom, isValidAddress, hideErrors])

  // If there's no valid address, don't render the map
  if (!isValidAddress) {
    return null
  }

  // If there's an error and hideErrors is true, don't render anything
  if (error && hideErrors) {
    return null
  }

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {error && !hideErrors && (
        <Box
          sx={{
            p: 2,
            border: "1px solid #ddd",
            borderRadius: 1,
            bgcolor: "#f9f9f9",
            mb: 2,
          }}
        >
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          border: "1px solid #ddd",
          borderRadius: "4px",
          visibility: error && !hideErrors ? "hidden" : "visible",
        }}
      />
    </Box>
  )
}

export default LeafletMapDisplay
