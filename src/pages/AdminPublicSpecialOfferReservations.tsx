"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type ReservationResponse, ReservationStatus } from "../types/Reservation"
import type { PaginatedResponse } from "../types/Pagination"
import type { ReservationQueryParams } from "../types/Reservation"
import ActionBar from "../components/ActionBar"
import ConfirmationDialog from "../components/ConfirmationDialog"
import ReservationReassignmentWizard from "../components/ReservationReassignmentWizard"
import ReservationFilterPanel, {
  type ReservationFilters,
  defaultReservationFilters,
} from "../components/filters/ReservationFilterPanel"
import PageSizeSelector from "../components/PageSizeSelector"
import Pagination from "../components/Pagination"
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Divider,
  Alert,
  Skeleton,
  Chip,
  Card,
  CardContent,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  useMediaQuery,
  CircularProgress,
} from "@mui/material"
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccessTime,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  CalendarMonth,
  LocationOn,
  Euro,
  EventAvailable,
  Person,
  MoreVert,
  Delete,
  Edit,
  PersonAdd,
  LocalOffer,
  FilterList,
} from "@mui/icons-material"
import CustomSnackbar from "../components/CustomSnackBar"
// Import the new dialog component
import ReservationStatusChangeDialog from "../components/status/ReservationStatusChangeModal"

// Helper function to format dates in Lithuanian
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

// Helper function to format date and time
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

// Helper function to get status chip color and icon
const getStatusChip = (status: string | number) => {
  // Handle string status values
  if (typeof status === "string") {
    switch (status) {
      case "New":
        return {
          color: "info" as const,
          icon: <HourglassEmpty fontSize="small" />,
          label: "Nauja",
        }
      case "Contacted":
        return {
          color: "primary" as const,
          icon: <EmailIcon fontSize="small" />,
          label: "Susisiekta",
        }
      case "InProgress":
        return {
          color: "warning" as const,
          icon: <HourglassEmpty fontSize="small" />,
          label: "Vykdoma",
        }
      case "Confirmed":
        return {
          color: "success" as const,
          icon: <CheckCircle fontSize="small" />,
          label: "Patvirtinta",
        }
      case "Cancelled":
        return {
          color: "error" as const,
          icon: <Cancel fontSize="small" />,
          label: "Atšaukta",
        }
      default:
        return {
          color: "default" as const,
          icon: <HourglassEmpty fontSize="small" />,
          label: String(status),
        }
    }
  }

  // Handle numeric status values
  switch (status) {
    case 0: // New
      return {
        color: "info" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Nauja",
      }
    case 1: // Contacted
      return {
        color: "primary" as const,
        icon: <EmailIcon fontSize="small" />,
        label: "Susisiekta",
      }
    case 2: // InProgress
      return {
        color: "warning" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Vykdoma",
      }
    case 3: // Confirmed
      return {
        color: "success" as const,
        icon: <CheckCircle fontSize="small" />,
        label: "Patvirtinta",
      }
    case 4: // Cancelled
      return {
        color: "error" as const,
        icon: <Cancel fontSize="small" />,
        label: "Atšaukta",
      }
    default:
      return {
        color: "default" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Nežinoma",
      }
  }
}

// Calculate trip duration in days
const calculateDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return null

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Helper function to check if status is cancelled
const isStatusCancelled = (status: string | number): boolean => {
  if (typeof status === "string") {
    return status === "Cancelled"
  }
  return status === 4 // Numeric value for Cancelled
}

// Helper function to check if status is new
const isStatusNew = (status: string | number): boolean => {
  if (typeof status === "string") {
    return status === "New"
  }
  return status === 0 // Numeric value for New
}

const SpecialOfferReservationsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offerDetails, setOfferDetails] = useState<any>(null)

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<ReservationResponse | null>(null)

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [reassignmentWizardOpen, setReassignmentWizardOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false)
  const [createOfferLoading, setCreateOfferLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filter state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<ReservationFilters>(defaultReservationFilters)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    if (selectedReservation) {
      console.log("Selected reservation:", selectedReservation)
      console.log("Status type:", typeof selectedReservation.status)
      console.log("Status value:", selectedReservation.status)
    }
  }, [selectedReservation])

  useEffect(() => {
    if (!offerId) return

    const fetchOfferDetails = async () => {
      try {
        const offerResponse = await axios.get(`${API_URL}/PublicTripOfferFacade/${offerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        setOfferDetails(offerResponse.data)
      } catch (offerErr) {
        console.error("Failed to fetch offer details:", offerErr)
      }
    }

    fetchOfferDetails()
    fetchReservations(currentPage, pageSize, selectedFilters)
  }, [offerId])

  const fetchReservations = async (page: number, size: number, filters: ReservationFilters) => {
    if (!offerId) return

    try {
      setLoading(true)

      // Prepare query params
      const queryParams: ReservationQueryParams = {
        pageNumber: page,
        pageSize: size,
      }

      // Add status filters if selected
      if (filters.statuses && filters.statuses.length > 0) {
        queryParams.statuses = filters.statuses.map((status) => ReservationStatus[status])
      }

      console.log("Fetching reservations with params:", queryParams)

      // Make API call
      const response = await axios.post<PaginatedResponse<ReservationResponse>>(
        `${API_URL}/Reservation/trips/${offerId}/paginated`,
        queryParams,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      // Update state with response data
      setReservations(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)
      setTotalCount(response.data.totalCount)
      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize))

      console.log("Pagination data:", {
        currentPage: response.data.pageNumber,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: Math.ceil(response.data.totalCount / response.data.pageSize),
      })
    } catch (err) {
      console.error("Failed to fetch reservations:", err)
      setError("Nepavyko gauti rezervacijų duomenų. Bandykite vėliau.")
    } finally {
      setLoading(false)
    }
  }

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    setMenuAnchorEl(event.currentTarget)
    setSelectedReservationId(reservationId)
    setSelectedReservation(reservation || null)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  // Action handlers
  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedReservationId) return

    try {
      // Set loading state to true
      setDeleteLoading(true)

      // Make API request to delete the reservation
      await axios.delete(`${API_URL}/Reservation/${selectedReservationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      // Show success message
      setSnackbar({
        open: true,
        message: "Rezervacija sėkmingai ištrinta",
        severity: "success",
      })

      // Close the dialog after success
      setDeleteDialogOpen(false)

      // Refresh the reservations list
      fetchReservations(currentPage, pageSize, selectedFilters)
    } catch (err: any) {
      console.error("Failed to delete reservation:", err)

      let errorMessage = "Nepavyko ištrinti rezervacijos. Bandykite dar kartą."

      // Extract error message from different response formats
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Rezervacija nerasta. Ji gali būti jau ištrinta."
        } else if (err.response.status === 403) {
          errorMessage = "Jūs neturite teisių ištrinti šios rezervacijos."
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data && err.response.data.Message) {
          errorMessage = err.response.data.Message
        } else if (err.response.data && typeof err.response.data === "object") {
          errorMessage = JSON.stringify(err.response.data)
        }
      }

      // Show error message
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      // Close the dialog on error
      setDeleteDialogOpen(false)
    } finally {
      // Always set loading state back to false
      setDeleteLoading(false)
    }
  }

  const handleReassignClick = () => {
    handleMenuClose()
    setConfirmDialogOpen(true)
  }

  const handleConfirmReassign = () => {
    setConfirmDialogOpen(false)
    setReassignmentWizardOpen(true)
  }

  // Status change handlers
  const handleStatusChangeClick = (reservation: ReservationResponse) => {
    if (!reservation) {
      setSnackbar({
        open: true,
        message: "Nepavyko rasti rezervacijos duomenų",
        severity: "error",
      })
      return
    }

    console.log("Opening status dialog for reservation:", reservation)
    console.log("Status type:", typeof reservation.status)
    console.log("Status value:", reservation.status)

    setSelectedReservation(reservation)
    setStatusDialogOpen(true)
    handleMenuClose()
  }

  const handleStatusChangeSuccess = () => {
    setSnackbar({
      open: true,
      message: "Rezervacijos statusas sėkmingai pakeistas",
      severity: "success",
    })
    // Refresh the reservations list
    fetchReservations(currentPage, pageSize, selectedFilters)
  }

  // Create offer handlers
  const handleCreateOfferClick = () => {
    handleMenuClose()
    setCreateOfferDialogOpen(true)
  }

  const handleCreateOfferConfirm = async () => {
    if (!selectedReservationId) return

    try {
      // Set loading state to true
      setCreateOfferLoading(true)

      // Make API request to convert reservation to offer
      const response = await axios.post(
        `${API_URL}/ClientTripOfferFacade/${selectedReservationId}/convert`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      // Show success message
      setSnackbar({
        open: true,
        message: "Pasiūlymas sėkmingai sukurtas",
        severity: "success",
      })

      // Close the dialog after success
      setCreateOfferDialogOpen(false)

      // Navigate to the newly created offer after a short delay
      const newOfferId = response.data.id
      setTimeout(() => {
        navigate(`/special-offers/${newOfferId}`)
      }, 1000) // Short delay to allow user to see the success message
    } catch (err: any) {
      console.error("Failed to create offer:", err)

      let errorMessage = "Nepavyko sukurti pasiūlymo. Bandykite dar kartą."

      // Extract error message from different response formats
      if (err.response) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data && err.response.data.Message) {
          errorMessage = err.response.data.Message
        } else if (err.response.data && typeof err.response.data === "object") {
          errorMessage = JSON.stringify(err.response.data)
        }
      }

      // Show error message
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      // Close the dialog on error
      setCreateOfferDialogOpen(false)
    } finally {
      // Always set loading state back to false
      setCreateOfferLoading(false)
    }
  }

  // Filter handlers
  const handleApplyFilters = (filters: ReservationFilters) => {
    console.log("Applied filters:", filters)
    setSelectedFilters(filters)
    setCurrentPage(1) // Reset to first page when filtering
    fetchReservations(1, pageSize, filters)
    setIsFilterDrawerOpen(false)
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    fetchReservations(newPage, pageSize, selectedFilters)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    console.log(`Changing page size to ${newPageSize}`)
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
    fetchReservations(1, newPageSize, selectedFilters)
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    return selectedFilters.statuses.length
  }

  if (loading && !reservations.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} onBackClick={() => navigate(-1)} />
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Paper>
      </Container>
    )
  }

  if (error && !reservations.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} onBackClick={() => navigate(-1)} />
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    )
  }

  const duration = calculateDuration(offerDetails?.startDate, offerDetails?.endDate)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ActionBar showBackButton={true} onBackClick={() => navigate(-1)} />

      {/* Improved Offer Details Card */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary.main">
              {offerDetails?.tripName || "Pasiūlymo rezervacijos"}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 2 }}>
              {offerDetails?.destination && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn sx={{ color: "primary.main", mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {offerDetails.destination}
                  </Typography>
                </Box>
              )}

              {offerDetails?.startDate && offerDetails?.endDate && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarMonth sx={{ color: "primary.main", mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(offerDetails.startDate)} - {formatDate(offerDetails.endDate)}
                    {duration && ` (${duration} ${duration === 1 ? "diena" : duration < 10 ? "dienos" : "dienų"})`}
                  </Typography>
                </Box>
              )}

              {offerDetails?.validUntil && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <EventAvailable sx={{ color: "primary.main", mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Galioja iki: {formatDate(offerDetails.validUntil)}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              {offerDetails?.price && (
                <Chip
                  icon={<Euro />}
                  label={new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
                    offerDetails.price,
                  )}
                  color="success"
                  sx={{ fontWeight: "bold", fontSize: "1rem", height: "32px", px: 1 }}
                />
              )}
            </Box>
          </Box>

          <Box>
            <Chip
              icon={<Person />}
              label={`Rezervacijų: ${totalCount}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: "bold", fontSize: "1rem", height: "32px", px: 1 }}
            />
          </Box>
        </Box>

        {offerDetails?.description && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {offerDetails.description}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Filters and Pagination Controls */}
      <Box
        sx={{
          mt: 2,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setIsFilterDrawerOpen(true)}
              endIcon={
                getActiveFilterCount() > 0 && <Chip size="small" label={getActiveFilterCount()} color="primary" />
              }
            >
              Filtrai
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} options={[25, 50, 100]} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        {!isMobile && (
          <Box sx={{ width: "300px", flexShrink: 0 }}>
            <ReservationFilterPanel
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={selectedFilters}
            />
          </Box>
        )}

        <Box sx={{ flex: 1 }}>
          {reservations.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              Šiam pasiūlymui nėra rezervacijų.
            </Alert>
          ) : (
            <>
              {loading && (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}

              <Grid container spacing={3}>
                {reservations.map((reservation) => (
                  <Grid item xs={12} key={reservation.id}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Contact Information - Now with clickable email and phone */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <EmailIcon sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }} />
                              <Link
                                href={`mailto:${reservation.email}`}
                                variant="h6"
                                sx={{ fontWeight: 500, textDecoration: "none" }}
                              >
                                {reservation.email || "Nėra el. pašto"}
                              </Link>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <PhoneIcon sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }} />
                              <Link
                                href={`tel:${reservation.phoneNumber}`}
                                variant="h6"
                                sx={{ fontWeight: 500, textDecoration: "none" }}
                              >
                                {reservation.phoneNumber || "Nėra telefono numerio"}
                              </Link>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <AccessTime sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }} />
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {formatDateTime(reservation.createdAt)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Chip
                              icon={getStatusChip(reservation.status).icon}
                              label={getStatusChip(reservation.status).label}
                              color={getStatusChip(reservation.status).color}
                              sx={{ fontWeight: "medium", fontSize: "1rem", height: "32px", px: 1 }}
                            />

                            {/* Actions Menu - Disable if status is cancelled */}
                            <IconButton
                              aria-label="more"
                              aria-controls="reservation-menu"
                              aria-haspopup="true"
                              onClick={(e) => handleMenuOpen(e, reservation.id)}
                              disabled={isStatusCancelled(reservation.status)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Participants Table - Larger font, no heading */}
                        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "background.default" }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell width="5%" sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                                  #
                                </TableCell>
                                <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Vardas</TableCell>
                                <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Pavardė</TableCell>
                                <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Gimimo data</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reservation.participants.map((participant, index) => (
                                <TableRow key={participant.id}>
                                  <TableCell sx={{ fontSize: "1rem" }}>{index + 1}.</TableCell>
                                  <TableCell sx={{ fontSize: "1rem" }}>{participant.name}</TableCell>
                                  <TableCell sx={{ fontSize: "1rem" }}>{participant.surname}</TableCell>
                                  <TableCell sx={{ fontSize: "1rem" }}>{formatDate(participant.birthDate)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 3,
                  }}
                >
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Reservation Actions Menu */}
      <Menu
        id="reservation-menu"
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {/* Update the menu items based on status */}
        {selectedReservation && !isStatusCancelled(selectedReservation.status) && (
          <MenuItem onClick={() => handleStatusChangeClick(selectedReservation)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Keisti statusą" />
          </MenuItem>
        )}

        {/* Only show "Perduoti kitam agentui" if status is New */}
        {selectedReservation && isStatusNew(selectedReservation.status) && (
          <MenuItem onClick={handleReassignClick}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Perduoti kitam agentui" />
          </MenuItem>
        )}

        {/* Create offer - available for all non-cancelled statuses */}
        {selectedReservation && !isStatusCancelled(selectedReservation.status) && (
          <MenuItem onClick={handleCreateOfferClick} disabled={createOfferLoading}>
            <ListItemIcon>
              {createOfferLoading ? <CircularProgress size={20} /> : <LocalOffer fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={createOfferLoading ? "Kuriamas..." : "Sukurti pasiūlymą"} />
          </MenuItem>
        )}

        {/* Delete option - available for all non-cancelled statuses */}
        {selectedReservation && !isStatusCancelled(selectedReservation.status) && (
          <MenuItem onClick={handleDeleteClick} disabled={deleteLoading}>
            <ListItemIcon>{deleteLoading ? <CircularProgress size={20} /> : <Delete fontSize="small" />}</ListItemIcon>
            <ListItemText primary={deleteLoading ? "Trinama..." : "Ištrinti"} />
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialog for Reassignment */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Rezervacijos perdavimas"
        message="Ar tikrai norite perduoti šią rezervaciją kitam agentui? Jūs nebegalėsite jos matyti ar valdyti."
        onConfirm={handleConfirmReassign}
        onCancel={() => setConfirmDialogOpen(false)}
      />

      {/* Reassignment Wizard */}
      {selectedReservationId && (
        <ReservationReassignmentWizard
          open={reassignmentWizardOpen}
          onClose={() => setReassignmentWizardOpen(false)}
          reservationId={selectedReservationId}
        />
      )}

      {/* Create Offer Confirmation Dialog */}
      <ConfirmationDialog
        open={createOfferDialogOpen}
        title="Sukurti pasiūlymą"
        message="Ar tikrai norite sukurti naują pasiūlymą?"
        onConfirm={handleCreateOfferConfirm}
        onCancel={() => setCreateOfferDialogOpen(false)}
        loading={createOfferLoading}
        loadingText="Kuriamas pasiūlymas..."
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Ištrinti rezervaciją"
        message="Ar tikrai norite ištrinti šią rezervaciją? Šio veiksmo negalima atšaukti."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        loadingText="Trinama rezervacija..."
      />

      {/* Mobile Filter Panel */}
      {isMobile && (
        <ReservationFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Status Change Dialog */}
      {selectedReservation && (
        <ReservationStatusChangeDialog
          open={statusDialogOpen}
          reservationId={selectedReservation.id}
          currentStatus={selectedReservation.status} // Pass the status as-is, the dialog will handle conversion
          onClose={() => setStatusDialogOpen(false)}
          onSuccess={handleStatusChangeSuccess}
        />
      )}
    </Container>
  )
}

export default SpecialOfferReservationsPage
