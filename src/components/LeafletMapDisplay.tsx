"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Box, CircularProgress } from "@mui/material"
import "leaflet/dist/leaflet.css"
import type { Map as LeafletMap } from "leaflet"

interface LeafletMapDisplayProps {
  address: string
  initialZoom?: number
}

const LeafletMapDisplay: React.FC<LeafletMapDisplayProps> = ({ address, initialZoom = 13 }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom] = useState(initialZoom)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Function to geocode an address to coordinates
  const geocodeAddress = async (addressToGeocode: string, L: typeof import("leaflet").default) => {
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
        return
      }

      // Otherwise, use Nominatim API for geocoding (OpenStreetMap's free geocoding service)
      const encodedAddress = encodeURIComponent(addressToGeocode)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`)

      if (!response.ok) {
        // Silently fail
        setError("Geocoding failed")
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat)
        const lon = Number.parseFloat(data[0].lon)
        setCoordinates([lat, lon])
        updateMap([lat, lon], L)
        setMapInitialized(true)
      } else {
        // Silently fail
        setError("Address not found")
      }
    } catch (err) {
      // Silently fail
      console.error("Geocoding error:", err)
      setError("Failed to get coordinates")
    } finally {
      setLoading(false)
    }
  }

  // Function to update the map with new coordinates
  const updateMap = (coords: [number, number], L: typeof import("leaflet").default) => {
    if (!mapContainerRef.current) return

    // If map doesn't exist, create it
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(coords, zoom)

      // Add the OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current)
    } else {
      // If map exists, update the view
      mapRef.current.setView(coords, zoom)
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // Add a marker at the coordinates
    L.marker(coords).addTo(mapRef.current)
  }

  // Initialize the map when the component mounts
  useEffect(() => {
    // Make sure Leaflet is only initialized in the browser
    if (typeof window === "undefined") return

    // Dynamically import Leaflet
    const initializeLeaflet = async () => {
      const L = (await import("leaflet")).default

      // Fix Leaflet icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // If address is provided, geocode it
      if (address) {
        geocodeAddress(address, L)
      }
    }

    initializeLeaflet()

    return () => {
      // Clean up the map when component unmounts
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [address, zoom])

  // If there's an error, don't show anything
  if (error) {
    return null
  }

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
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

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "400px" }} />
    </Box>
  )
}

export default LeafletMapDisplay

