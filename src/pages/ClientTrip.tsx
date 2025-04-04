"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import {
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Tooltip,
  Grid,
  Chip,
  Container,
} from "@mui/material"
import {
  Edit as EditIcon,
  ContentCopy as CloneIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  VerifiedUser as InsuranceIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material"
import type { TripResponse } from "../types/ClientTrip"
import type { TripEvent } from "../types/TripEvent"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"
import ImageGallery from "../components/ImageGallery"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CloneTripModal, { type CloneTripOptions } from "../components/CloneTripModal"
import CustomSnackbar from "../components/CustomSnackBar"
import ActionBar from "../components/ActionBar"
import { useNavigation } from "../contexts/NavigationContext"

const ClientTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [trip, setTrip] = useState<TripResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripImages, setTripImages] = useState<any[]>([])
  const [canEdit, setCanEdit] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [tripStatus, setTripStatus] = useState<"started" | "ended" | null>(null)

  // New state for clone functionality
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  // New state for delete confirmation
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const user = useContext(UserContext)
  const token = localStorage.getItem("accessToken")
  const { navigationSource, getBackNavigationUrl, navigateBack } = useNavigation()

  // Handle navigation state when coming from edit page
  useEffect(() => {
    const state = location.state as { fromEdit?: boolean } | null
    if (state?.fromEdit && tripId) {
      // Remove the edit page from history
      window.history.replaceState(null, "", window.location.href)

      // Restore saved state
      const savedState = localStorage.getItem(`trip-detail-${tripId}`)
      if (savedState) {
        const { scrollPosition } = JSON.parse(savedState)
        window.scrollTo(0, scrollPosition)
        // Clean up the saved state
        localStorage.removeItem(`trip-detail-${tripId}`)
      }
    }
  }, [location.state, tripId])

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

        // Check trip status
        if (response.data.startDate && response.data.endDate) {
          const startDate = new Date(response.data.startDate)
          const endDate = new Date(response.data.endDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (today > endDate) {
            setTripStatus("ended")
          } else if (today >= startDate) {
            setTripStatus("started")
          }
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
    if (tripStatus) {
      setShowConfirmDialog(true)
    } else if (trip?.id) {
      // Save current state before navigating
      const state = {
        tripId: trip.id,
        scrollPosition: window.scrollY,
        navigationSource, // Save the navigation source
      }
      localStorage.setItem(`trip-detail-${trip.id}`, JSON.stringify(state))
      navigate(`/admin-trip-list/${trip.id}/edit`)
    }
  }

  const handleConfirmEdit = () => {
    setShowConfirmDialog(false)
    if (trip?.id) {
      // Save current state before navigating
      const state = {
        tripId: trip.id,
        scrollPosition: window.scrollY,
        navigationSource, // Save the navigation source
      }
      localStorage.setItem(`trip-detail-${trip.id}`, JSON.stringify(state))
      navigate(`/admin-trip-list/${trip.id}/edit`)
    }
  }

  const handleCancelEdit = () => {
    setShowConfirmDialog(false)
  }

  // New handlers for clone functionality
  const handleCloneClick = () => {
    setShowCloneModal(true)
  }

  const handleCloseCloneModal = () => {
    setShowCloneModal(false)
  }

  const handleCloneConfirm = async (options: CloneTripOptions) => {
    if (!tripId) return

    setCloneLoading(true)
    try {
      console.log("Cloning trip with options:", options)

      // Make sure we await the response
      const response = await axios.post<TripResponse>(`${API_URL}/client-trips/${tripId}/clone`, options, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Log the response
      console.log("Clone response:", response.data)

      // Show success message and ensure it stays visible
      setSnackbar({
        open: true,
        message: "Kelionė sėkmingai klonuota!",
        severity: "success",
      })

      // Close the modal
      setShowCloneModal(false)

      // Add a small delay before navigation to ensure the snackbar is seen
      setTimeout(() => {
        // Navigate to edit form with the new trip data
        if (response.data && response.data.id) {
          navigate(`/admin-trip-list/${response.data.id}/edit`)
        }
      }, 1500) // 1.5 second delay
    } catch (err: any) {
      console.error("Failed to clone trip:", err)
      console.error("Error response:", err.response?.data)

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Nepavyko klonuoti kelionės.",
        severity: "error",
      })
    } finally {
      setCloneLoading(false)
    }
  }

  // New handlers for delete functionality
  const handleDeleteClick = () => {
    setShowDeleteConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!tripId) return

    setDeleteLoading(true)
    try {
      await axios.delete(`${API_URL}/client-trips/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Show success message
      setSnackbar({
        open: true,
        message: "Kelionė sėkmingai ištrinta!",
        severity: "success",
      })

      // Close the dialog
      setShowDeleteConfirmDialog(false)

      // Add a small delay before navigation to ensure the snackbar is seen
      setTimeout(() => {
        navigate("/admin-trip-list")
      }, 1500) // 1.5 second delay
    } catch (err: any) {
      console.error("Failed to delete trip:", err)

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Nepavyko ištrinti kelionės.",
        severity: "error",
      })
      setShowDeleteConfirmDialog(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // A simple date-locale function for the overall trip
  function formatDate(dateString?: string) {
    if (!dateString) return "—"
    const d = new Date(dateString)
    return d.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Action Bar with Back Button and Action Buttons */}
      <ActionBar backUrl={getBackNavigationUrl(tripId)} onBackClick={navigateBack}>
        <Tooltip
          title={
            tripStatus
              ? `Kelionė jau ${tripStatus === "started" ? "prasidėjo" : "pasibaigė"}. Ar tikrai norite ją redaguoti?`
              : ""
          }
        >
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEditClick}
              startIcon={<EditIcon />}
              sx={{
                textTransform: "none",
              }}
            >
              Redaguoti
            </Button>
          </span>
        </Tooltip>

        <Button
          variant="outlined"
          color="primary"
          onClick={handleCloneClick}
          startIcon={<CloneIcon />}
          sx={{
            textTransform: "none",
          }}
        >
          Klonuoti
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteClick}
          startIcon={<DeleteIcon />}
          sx={{
            textTransform: "none",
          }}
        >
          Ištrinti
        </Button>
      </ActionBar>

      <Card elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header with trip name and status */}
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {trip.tripName}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {trip.status !== undefined && (
                <Chip
                  label={translateTripStatus(trip.status)}
                  color={trip.status === "Confirmed" ? "success" : "primary"}
                  icon={<FlagIcon />}
                />
              )}
            </Box>
          </Box>

          {/* Trip details in a grid layout */}
          <Box sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
            <Grid container spacing={3}>
              {/* Left column: Basic trip info */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  {/* Category */}
                  {trip.category && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CategoryIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Kategorija:</span>{" "}
                          {translateTripCategory(trip.category)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Price */}
                  {trip.price !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EuroIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Kaina:</span> €{trip.price}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* StartDate */}
                  {trip.startDate && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Nuo:</span> {formatDate(trip.startDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* EndDate */}
                  {trip.endDate && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Iki:</span> {formatDate(trip.endDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Insurance */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InsuranceIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Draudimas:</span>{" "}
                        {trip.insuranceTaken ? "Taip" : "Ne"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right column: Description */}
              <Grid item xs={12} md={6}>
                {trip.description && (
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      gutterBottom
                      sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <DescriptionIcon fontSize="small" /> Aprašymas
                    </Typography>
                    <Typography variant="body2">{trip.description}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            {/* Trip images */}
            {tripImages.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <ImageGallery images={tripImages} thumbnailSize={120} />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Itinerary section */}
      <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
            Kelionės planas
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {trip.itinerary?.sortedEvents?.length ? (
            <Box>
              {sortedDayKeys.map((dayKey, i) => (
                <Card key={i} elevation={1} sx={{ marginBottom: 3, padding: 2, borderRadius: 2 }}>
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
                        {/* Add this section to display images if they exist */}
                        {ev.images && ev.images.length > 0 && (
                          <Box sx={{ marginTop: 1, marginLeft: 4, maxWidth: "100%" }}>
                            <ImageGallery images={ev.images} title="" thumbnailSize={100} />
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body1">Maršrutas dar nesudarytas.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Edit */}
      <ConfirmationDialog
        open={showConfirmDialog}
        title="Patvirtinti redagavimą"
        message={`Kelionė jau ${tripStatus === "started" ? "prasidėjo" : "pasibaigė"}. Ar tikrai norite ją redaguoti?`}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        title="Ištrinti kelionę"
        message="Ar tikrai norite ištrinti šią kelionę? Šis veiksmas yra negrįžtamas, bus ištrinta visa susijusi informacija."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Clone Trip Modal */}
      <CloneTripModal
        open={showCloneModal}
        onClose={handleCloseCloneModal}
        onConfirm={handleCloneConfirm}
        initialStartDate={trip.startDate}
        initialEndDate={trip.endDate}
        loading={cloneLoading}
      />

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default ClientTrip

