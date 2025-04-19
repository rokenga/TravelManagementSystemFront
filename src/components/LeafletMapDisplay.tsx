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
}

const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ address, initialZoom = 13, height = 300 }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom] = useState(initialZoom)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
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
      setDebugInfo(`Geocoding address: ${addressToGeocode}`)

      // Check if the address is already in coordinate format (e.g., "36.465040,32.118976")
      const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/
      const coordsMatch = addressToGeocode.trim().match(coordsRegex)

      if (coordsMatch) {
        // If it's already coordinates, parse them
        const lat = Number.parseFloat(coordsMatch[1])
        const lng = Number.parseFloat(coordsMatch[3])
        setCoordinates([lat, lng])
        setDebugInfo(`Parsed coordinates: ${lat}, ${lng}`)
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
        setDebugInfo(`Trying with just city: ${city}`)
        return await tryGeocode(city, L)
      }

      return false
    } catch (err) {
      console.error("Geocoding error:", err)
      setError(`Failed to get coordinates: ${err instanceof Error ? err.message : String(err)}`)
      setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`)
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
      setDebugInfo(`Fetching from: ${apiUrl}`)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        setDebugInfo(`API error: ${response.status} ${response.statusText}`)
        return false
      }

      const data = await response.json()
      setDebugInfo(`API response: ${JSON.stringify(data)}`)

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat)
        const lon = Number.parseFloat(data[0].lon)
        setDebugInfo(`Found coordinates: ${lat}, ${lon}`)
        setCoordinates([lat, lon])
        updateMap([lat, lon], L)
        setMapInitialized(true)
        return true
      } else {
        setDebugInfo(`No results for: ${addressToTry}`)
        return false
      }
    } catch (err) {
      console.error(`Error geocoding ${addressToTry}:`, err)
      setDebugInfo(`Error with ${addressToTry}: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }

  // Function to update the map with new coordinates
  const updateMap = (coords: [number, number], L: any) => {
    if (!mapContainerRef.current) {
      setDebugInfo("Map container ref is null")
      return
    }

    try {
      // If map doesn't exist, create it
      if (!mapRef.current) {
        setDebugInfo(`Creating new map at coords: ${coords[0]}, ${coords[1]}, zoom: ${zoom}`)
        mapRef.current = L.map(mapContainerRef.current).setView(coords, zoom)

        // Add the OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current)
      } else {
        // If map exists, update the view
        setDebugInfo(`Updating existing map to coords: ${coords[0]}, ${coords[1]}`)
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
          setDebugInfo("Map size invalidated/refreshed")
        }
      }, 100)
    } catch (err) {
      console.error("Map update error:", err)
      setError(`Failed to update map: ${err instanceof Error ? err.message : String(err)}`)
      setDebugInfo(`Map update error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Initialize the map when the component mounts
  useEffect(() => {
    // Don't initialize if there's no valid address
    if (!isValidAddress) {
      setLoading(false)
      setDebugInfo("No valid address provided")
      return
    }

    // Make sure Leaflet is only initialized in the browser
    if (typeof window === "undefined") {
      setDebugInfo("Not in browser environment")
      return
    }

    // Dynamically import Leaflet
    const initializeLeaflet = async () => {
      try {
        setDebugInfo("Importing Leaflet...")
        const leafletModule = await import("leaflet")
        const L = leafletModule.default

        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        })

        setDebugInfo("Leaflet imported, geocoding address...")
        // If address is provided, geocode it
        if (address) {
          const success = await geocodeAddress(address, L)
          if (!success) {
            setError("Could not find location on map")
          }
        }
      } catch (err) {
        console.error("Leaflet initialization error:", err)
        setError(`Failed to initialize map: ${err instanceof Error ? err.message : String(err)}`)
        setDebugInfo(`Leaflet init error: ${err instanceof Error ? err.message : String(err)}`)
        setLoading(false)
      }
    }

    initializeLeaflet()

    return () => {
      // Clean up the map when component unmounts
      if (mapRef.current) {
        setDebugInfo("Cleaning up map")
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [address, zoom, isValidAddress])

  // If there's no valid address, don't render the map
  if (!isValidAddress) {
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

      {error && (
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
          visibility: error ? "hidden" : "visible",
        }}
      />
    </Box>
  )
}

export default LeafletMapDisplay
