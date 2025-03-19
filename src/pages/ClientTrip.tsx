"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import { Box, Typography, Divider, Card, CardContent, CircularProgress, Paper, Button, Tooltip } from "@mui/material"
import { Edit as EditIcon } from "@mui/icons-material"
import type { TripResponse } from "../types/ClientTrip"
import type { TripEvent } from "../types/TripEvent"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"
import ImageGallery from "../components/ImageGallery"

const ClientTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<TripResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripImages, setTripImages] = useState<any[]>([])
  const [canEdit, setCanEdit] = useState(true)

  const user = useContext(UserContext)
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true)
        const response = await axios.get<TripResponse>(`${API_URL}/client-trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setTrip(response.data)

        // Check if trip can be edited (start date is in the future)
        if (response.data.startDate) {
          const startDate = new Date(response.data.startDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
          setCanEdit(startDate > today)
        }
      } catch (err: any) {
        console.error("Failed to fetch trip:", err)
        setError(err.response?.data?.message || "Nepavyko gauti kelionės informacijos.")
      } finally {
        setLoading(false)
      }
    }

    // Fetch images (type = Image)
    const fetchTripImages = async () => {
      try {
        const response = await axios.get<any[]>(`${API_URL}/File/trip/${tripId}/Image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTripImages(response.data)
      } catch (err) {
        console.error("Nepavyko gauti nuotraukų:", err)
      }
    }

    if (tripId) {
      fetchTrip()
      fetchTripImages()
    }
  }, [tripId, token])

  const handleEditClick = () => {
    if (trip?.id) {
      navigate(`/edit-trip/${trip.id}`)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  if (!trip) {
    return <Typography>Kelionė nerasta.</Typography>
  }

  const eventsByDay: { [key: number]: TripEvent[] } = {}
  trip.itinerary?.sortedEvents?.forEach((ev: TripEvent) => {
    const dayNum = ev.stepDayNumber ?? 0
    if (!eventsByDay[dayNum]) {
      eventsByDay[dayNum] = []
    }
    eventsByDay[dayNum].push(ev)
  })

  const sortedDayKeys = Object.keys(eventsByDay)
    .map((k) => Number(k))
    .sort((a, b) => a - b)

  const isDayByDay = trip.dayByDayItineraryNeeded

  return (
    <Box sx={{ maxWidth: 900, margin: "auto", padding: 3 }}>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Centered trip name */}
            <Typography
              variant="h5"
              sx={{
                textAlign: "center",
                mb: 3,
                fontWeight: "bold",
                paddingX: 6, // Add padding to avoid overlap with button
              }}
            >
              {trip.tripName}
            </Typography>

            {/* Edit button positioned in the top right */}
            <Box sx={{ position: "absolute", top: 0, right: 0 }}>
              <Tooltip title={!canEdit ? "Kelionės, kurios jau prasidėjo, redaguoti negalima" : ""}>
                <span>
                  {" "}
                  {/* Wrapper needed for disabled tooltip */}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEditClick}
                    disabled={!canEdit}
                    startIcon={<EditIcon />}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      boxShadow: 2,
                    }}
                  >
                    Redaguoti
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Typography variant="body1">
              <strong>Būsena:</strong> {trip.status ? translateTripStatus(trip.status) : "Nežinomas statusas"}
            </Typography>
            <Typography variant="body1">
              <strong>Kategorija:</strong> {trip.category ? translateTripCategory(trip.category) : "Be kategorijos"}
            </Typography>
            <Typography variant="body1">
              <strong>Pradžios data:</strong>{" "}
              {trip.startDate ? new Date(trip.startDate).toLocaleDateString("lt-LT") : "—"}
            </Typography>
            <Typography variant="body1">
              <strong>Pabaigos data:</strong> {trip.endDate ? new Date(trip.endDate).toLocaleDateString("lt-LT") : "—"}
            </Typography>
            <Typography variant="body1">
              <strong>Kaina:</strong> €{trip.price ?? 0}
            </Typography>
            <Typography variant="body1">
              <strong>Draudimas:</strong> {trip.insuranceTaken ? "Taip" : "Ne"}
            </Typography>
            <Typography variant="body1" sx={{ marginTop: 2 }}>
              <strong>Aprašymas:</strong> {trip.itinerary?.description || "Nėra aprašymo"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Using the new ImageGallery component */}
      <ImageGallery images={tripImages} title="Nuotraukos" thumbnailSize={120} />

      {/* Existing itinerary display below */}
      <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
        Maršrutas
      </Typography>
      <Divider sx={{ marginBottom: 2 }} />

      {trip.itinerary?.sortedEvents?.length ? (
        <Box>
          {sortedDayKeys.map((dayKey, i) => (
            <Paper key={i} elevation={1} sx={{ marginBottom: 3, padding: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {dayKey === 0 && !isDayByDay ? "Bendras maršrutas" : `Diena ${dayKey}`}
              </Typography>
              {eventsByDay[dayKey].map((ev, idx) => {
                let timeStr = "—"
                if (ev.time) {
                  const dateObj = new Date(ev.time)
                  if (isDayByDay) {
                    timeStr = dateObj.toLocaleTimeString("lt-LT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  } else {
                    timeStr = dateObj.toLocaleString("lt-LT", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                }
                return (
                  <Box key={idx} sx={{ marginBottom: 2 }}>
                    <Typography variant="body1">
                      <strong>{timeStr}</strong> {ev.description}
                    </Typography>
                    {ev.details && (
                      <Typography variant="body2" color="text.secondary" sx={{ marginTop: 0.5, marginLeft: 4 }}>
                        {ev.details}
                      </Typography>
                    )}
                  </Box>
                )
              })}
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography variant="body1">Maršrutas dar nesudarytas.</Typography>
      )}
    </Box>
  )
}

export default ClientTrip

