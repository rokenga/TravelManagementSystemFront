"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PublicOfferDetails } from "../types/PublicSpecialOffer"
import type { ImageItem } from "../components/ImageGallery"
import { translateBoardBasisType, translateTripCategory } from "../Utils/translateEnums"
import LeafletMapDisplay from "../components/LeafletMapDisplay"
import UserContext from "../contexts/UserContext"
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Chip,
  Card,
  CardContent,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
  Snackbar,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Flight as FlightIcon,
  DirectionsCar as CarIcon,
  DirectionsBus as BusIcon,
  DirectionsBoat as BoatIcon,
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  Info as InfoIcon,
  EventAvailable as ValidUntilIcon,
  DirectionsBus as DirectionsBusIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"

// Import the ImageSlider component
import ImageSlider from "../components/ImageSlider"
import ActionBar from "../components/ActionBar"
import ConfirmationDialog from "../components/ConfirmationDialog"
// Import the StatusChangeDialog component and add necessary imports
import StatusChangeDialog, { type OfferStatus } from "../components/status/PublicOfferStatusChangeModal"

/**
 * Helper function to safely parse dates in various formats
 * This handles both ISO format and DD/MM/YYYY format
 */
const parseDateCorrectly = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null

  // First try standard parsing
  let date = new Date(dateString)
  if (!isNaN(date.getTime())) return date

  // If that fails, try to parse DD/MM/YYYY format
  // This handles formats like "02/04/2025 01:00:00"
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?:?(\d{2})?/
  const match = dateString.match(dateRegex)

  if (match) {
    const day = match[1]
    const month = match[2]
    const year = match[3]
    const hour = match[4] || "00"
    const minute = match[5] || "00"
    const second = match[6] || "00"

    // Reconstruct in ISO format: YYYY-MM-DDTHH:MM:SS
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
    date = new Date(isoString)

    if (!isNaN(date.getTime())) return date
  }

  console.error("Failed to parse date:", dateString)
  return null
}

// Helper function to format dates in Lithuanian
const formatDate = (dateString: string): string => {
  const date = parseDateCorrectly(dateString)
  if (!date) return "Nenustatyta data"

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

// Helper function to format time
const formatTime = (dateString: string): string => {
  const date = parseDateCorrectly(dateString)
  if (!date) return "Nenustatytas laikas"

  return date.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
}

// Helper function to get transport icon
const getTransportIcon = (type: string) => {
  switch (type) {
    case "Flight":
      return <FlightIcon />
    case "Car":
      return <CarIcon />
    case "Bus":
      return <BusIcon />
    case "Cruise":
      return <BoatIcon />
    case "Train":
      return <DirectionsBusIcon sx={{ transform: "rotate(90deg)" }} />
    default:
      return <FlightIcon />
  }
}

// Helper function to get status chip color and label
const getStatusChip = (status: string) => {
  switch (status) {
    case "Active":
      return { color: "success" as const, label: "Aktyvus" }
    case "Expired":
      return { color: "error" as const, label: "Pasibaigęs" }
    case "ManuallyDisabled":
      return { color: "warning" as const, label: "Išjungtas" }
    default:
      return { color: "default" as const, label: status }
  }
}

// Helper function to get trip status chip color and label
const getTripStatusChip = (status: string) => {
  switch (status?.toLowerCase()) {
    case "draft":
      return { color: "warning" as const, label: "Juodraštis" }
    case "confirmed":
      return { color: "success" as const, label: "Patvirtintas" }
    default:
      return { color: "default" as const, label: status || "Nežinoma" }
  }
}

const AdminPublicOfferDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useContext(UserContext)
  const [offer, setOffer] = useState<PublicOfferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // Add these state variables inside the component
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  })

  // Function to check if current user is an admin
  const isAdmin = (): boolean => {
    return user?.role === "Admin"
  }

  // Function to check if current user is the creator of the offer
  const isCreator = (): boolean => {
    if (!offer || !user) return false
    return offer.agentId === user.id
  }

  // Function to check if user has permission to edit/delete/change status
  const hasPermission = (): boolean => {
    return isAdmin() || isCreator()
  }

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(`${API_URL}/PublicTripOfferFacade/agent/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        setOffer(response.data)
        console.log("Offer details:", response.data)
        console.log("Current user:", user)
        console.log("Is admin:", isAdmin())
        console.log("Is creator:", isCreator())
        console.log("Has permission:", hasPermission())
      } catch (err) {
        console.error("Failed to fetch offer details:", err)
        setError("Nepavyko gauti pasiūlymo detalių. Bandykite vėliau.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOfferDetails()
    }
  }, [id, user])

  const handleEdit = () => {
    navigate(`/public-offers/${id}/edit`)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/PublicTripOfferFacade/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      // Show success message before navigating
      setSnackbar({
        open: true,
        message: "Pasiūlymas sėkmingai ištrintas",
        severity: "success",
      })

      // Add a small delay before navigation to ensure the snackbar is seen
      setTimeout(() => {
        navigate("/public-offers")
      }, 1500)
    } catch (err) {
      console.error("Failed to delete offer:", err)
      setSnackbar({
        open: true,
        message: "Nepavyko ištrinti pasiūlymo. Bandykite dar kartą.",
        severity: "error",
      })
      setShowDeleteDialog(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
  }

  // Function to navigate to reservations
  const handleViewReservations = () => {
    navigate(`/public-offers/${id}/reservations`)
  }

  // Prepare images for gallery
  const galleryImages: ImageItem[] =
    offer?.files
      .filter((file) => file.type === "Image")
      .map((file) => ({
        id: file.id,
        url: file.url,
        altText: file.altText,
      })) || []

  // Add this function inside the component
  const handleChangeStatus = () => {
    setShowStatusDialog(true)
  }

  // Add this function inside the component
  const handleConfirmStatusChange = async (status: OfferStatus) => {
    try {
      const agentId = user?.id || ""

      console.log("Changing offer status:", {
        currentStatus: offer?.offerStatus,
        newStatus: status,
        offerId: id,
        agentId,
      })

      await axios.put(
        `${API_URL}/PublicTripOfferFacade/${id}/status`,
        { status, agentId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      // Update the local state if needed
      if (offer) {
        setOffer({
          ...offer,
          offerStatus: status, // Update offerStatus instead of status
        })
      }

      setSnackbar({
        open: true,
        message: "Pasiūlymo statusas sėkmingai pakeistas",
        severity: "success",
      })

      // Close the dialog after successful update
      setShowStatusDialog(false)
    } catch (error: any) {
      console.error("Failed to change status:", error)

      // Extract error message from response if available
      let errorMessage = "Nepavyko pakeisti pasiūlymo statuso"

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "Negalite redaguoti šio pasiūlymo statuso."
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data && typeof error.response.data === "string") {
          errorMessage = error.response.data
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      // Re-throw the error so the dialog can handle it
      throw error
    }
  }

  // Add this function inside the component
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} backUrl="/public-offers" showEditButton={false} showDeleteButton={false} />
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
            <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} backUrl="/public-offers" showEditButton={false} showDeleteButton={false} />
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!offer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} backUrl="/public-offers" showEditButton={false} showDeleteButton={false} />
        <Alert severity="info">Pasiūlymas nerastas.</Alert>
      </Container>
    )
  }

  // Get the first step which contains the offer details
  const offerStep = offer.itinerary.steps[0]

  // Debug information
  console.log("Rendering with permissions:", {
    isAdmin: isAdmin(),
    isCreator: isCreator(),
    hasPermission: hasPermission(),
    userRole: user?.role,
    userId: user?.id,
    offerAgentId: offer.agentId,
  })

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ActionBar
        showBackButton={true}
        backUrl="/public-offers"
        showEditButton={hasPermission()}
        showDeleteButton={hasPermission()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showPdfButtons={false}
        showChangeStatusButton={hasPermission()}
        onChangeStatus={handleChangeStatus}
        showReservationsButton={true}
        onViewReservations={handleViewReservations}
      />

      {/* Main Content */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
        {/* Hero Section with Image Slider */}
        {galleryImages.length > 0 && (
          <Box>
            <ImageSlider
              images={galleryImages}
              onImageClick={(index) => {
                console.log("Image clicked:", index)
              }}
            />
          </Box>
        )}

        {/* Offer Header */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ color: "#000000", fontWeight: 500 }}>
              {offer.tripName}
            </Typography>

            {/* Status Chips */}
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* Trip Status Chip */}
              {offer.status && (
                <Chip
                  label={getTripStatusChip(offer.status).label}
                  color={getTripStatusChip(offer.status).color}
                  icon={<AssignmentIcon />}
                  sx={{ fontWeight: "medium", fontSize: "0.875rem" }}
                />
              )}

              {/* Offer Status Chip */}
              {offer.offerStatus && (
                <Chip
                  label={getStatusChip(offer.offerStatus).label}
                  color={getStatusChip(offer.offerStatus).color}
                  sx={{ fontWeight: "medium", fontSize: "0.875rem" }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Chip
              icon={<CalendarIcon />}
              label={`${formatDate(offer.startDate)} - ${formatDate(offer.endDate)}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PersonIcon />}
              label={`${offer.adultsCount} suaugę${offer.adultsCount !== 1 ? "" : "s"}`}
              color="primary"
              variant="outlined"
            />
            {offer.childrenCount > 0 && (
              <Chip
                icon={<ChildIcon />}
                label={`${offer.childrenCount} vaik${offer.childrenCount === 1 ? "as" : "ai"}`}
                color="primary"
                variant="outlined"
              />
            )}
            {/* Only show category if it exists */}
            {offer.category && (
              <Chip
                icon={<InfoIcon />}
                label={`Kategorija: ${translateTripCategory(offer.category)}`}
                color="primary"
                variant="outlined"
              />
            )}
            <Chip
              icon={<ValidUntilIcon />}
              label={`Pasiūlymas galioja iki: ${formatDate(offer.validUntil)}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Typography variant="subtitle1" gutterBottom sx={{ color: "#000000", fontWeight: 500 }}>
            Apie kelionę
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: "#000000", textAlign: "left" }}>
            {offer.description}
          </Typography>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Typography variant="body1" sx={{ color: "#000000", mr: 1 }}>
              Kaina:
            </Typography>
            <Typography variant="h6" sx={{ color: "#000000", fontWeight: 500 }}>
              {new Intl.NumberFormat("lt-LT", {
                style: "currency",
                currency: "EUR",
              }).format(offer.price)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Offer Details */}
      <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ color: "#000000", fontWeight: 500, mb: 3 }}>
          Pasiūlymo detalės
        </Typography>

        <Grid container spacing={3}>
          {/* Transport Cards */}
          {offerStep.transports &&
            offerStep.transports.length > 0 &&
            offerStep.transports.map((transport, index) => (
              <Grid item xs={12} key={`transport-${index}`}>
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ mr: 1 }}>{getTransportIcon(transport.transportType)}</Box>
                      <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500 }}>
                        Transportas: {transport.companyName} - {transport.transportName}
                        {transport.transportCode && ` (${transport.transportCode})`}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 2,
                            border: "1px solid rgba(0, 0, 0, 0.12)",
                            borderRadius: 1,
                            backgroundColor: "rgba(0, 0, 0, 0.03)",
                          }}
                        >
                          <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                            Išvykimas:
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: "#000000" }} />
                            <Typography variant="body1" sx={{ color: "#000000" }}>
                              {transport.departurePlace}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <TimeIcon fontSize="small" sx={{ mr: 1, color: "#000000" }} />
                            <Typography variant="body1" sx={{ color: "#000000" }}>
                              {formatDate(transport.departureTime)}, {formatTime(transport.departureTime)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 2,
                            border: "1px solid rgba(0, 0, 0, 0.12)",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                            Atvykimas:
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: "#000000" }} />
                            <Typography variant="body1" sx={{ color: "#000000" }}>
                              {transport.arrivalPlace}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <TimeIcon fontSize="small" sx={{ mr: 1, color: "#000000" }} />
                            <Typography variant="body1" sx={{ color: "#000000" }}>
                              {formatDate(transport.arrivalTime)}, {formatTime(transport.arrivalTime)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {(transport.description || transport.cabinType) && (
                      <Box sx={{ mt: 2 }}>
                        {transport.description && (
                          <Typography variant="body1" sx={{ color: "#000000", textAlign: "left" }}>
                            {transport.description}
                          </Typography>
                        )}
                        {transport.cabinType && (
                          <Typography variant="body1" sx={{ color: "#000000", mt: 1 }}>
                            Klasė/Kabina: {transport.cabinType}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}

          {/* Accommodation Cards */}
          {offerStep.accommodations &&
            offerStep.accommodations.length > 0 &&
            offerStep.accommodations.map((accommodation, index) => (
              <Grid item xs={12} key={`accommodation-${index}`}>
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ mr: 1 }}>
                        <HotelIcon />
                      </Box>
                      <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500 }}>
                        Apgyvendinimas: {accommodation.hotelName}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, border: "1px solid rgba(0, 0, 0, 0.12)", borderRadius: 1 }}>
                              <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                                Įsiregistravimas:
                              </Typography>
                              <Typography variant="body1" sx={{ color: "#000000" }}>
                                {formatDate(accommodation.checkIn)}, {formatTime(accommodation.checkIn)}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, border: "1px solid rgba(0, 0, 0, 0.12)", borderRadius: 1 }}>
                              <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                                Išsiregistravimas:
                              </Typography>
                              <Typography variant="body1" sx={{ color: "#000000" }}>
                                {formatDate(accommodation.checkOut)}, {formatTime(accommodation.checkOut)}
                              </Typography>
                            </Box>
                          </Grid>

                          {accommodation.roomType && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, border: "1px solid rgba(0, 0, 0, 0.12)", borderRadius: 1 }}>
                                <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                                  Kambario tipas:
                                </Typography>
                                <Typography variant="body1" sx={{ color: "#000000" }}>
                                  {accommodation.roomType}
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          {accommodation.boardBasis && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, border: "1px solid rgba(0, 0, 0, 0.12)", borderRadius: 1 }}>
                                <Typography variant="body1" sx={{ color: "#000000", fontWeight: 500, mb: 1 }}>
                                  Maitinimas:
                                </Typography>
                                <Typography variant="body1" sx={{ color: "#000000" }}>
                                  {translateBoardBasisType(accommodation.boardBasis)}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>

                        {accommodation.description && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" sx={{ color: "#000000", textAlign: "left" }}>
                              {accommodation.description}
                            </Typography>
                          </Box>
                        )}
                      </Grid>

                      {accommodation.hotelLink && (
                        <Grid item xs={12} md={6}>
                          <Box sx={{ height: 250, borderRadius: 1, overflow: "hidden" }}>
                            <LeafletMapDisplay address={accommodation.hotelLink} />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Paper>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        title="Ištrinti pasiūlymą"
        message="Ar tikrai norite ištrinti šį pasiūlymą? Šio veiksmo nebus galima atšaukti."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <StatusChangeDialog
        open={showStatusDialog}
        currentStatus={offer?.offerStatus as OfferStatus} // Use offerStatus instead of status
        validUntil={offer?.validUntil}
        tripStatus={offer?.status}
        onClose={() => setShowStatusDialog(false)}
        onConfirm={handleConfirmStatusChange}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AdminPublicOfferDetailsPage
