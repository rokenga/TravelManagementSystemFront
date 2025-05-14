"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
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
import { UserContext } from "../contexts/UserContext" 
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
  Tooltip,
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
  Check,
  Close,
  Lock,
} from "@mui/icons-material"
import CustomSnackbar from "../components/CustomSnackBar"
import ReservationStatusChangeDialog from "../components/status/ReservationStatusChangeModal"

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

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

const getStatusChip = (status: string | number) => {
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
      case "PendingReassignment":
        return {
          color: "warning" as const,
          icon: <PersonAdd fontSize="small" />,
          label: "Laukiama perdavimo",
        }
      default:
        return {
          color: "default" as const,
          icon: <HourglassEmpty fontSize="small" />,
          label: String(status),
        }
    }
  }

  switch (status) {
    case 0: 
      return {
        color: "info" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Nauja",
      }
    case 1: 
      return {
        color: "primary" as const,
        icon: <EmailIcon fontSize="small" />,
        label: "Susisiekta",
      }
    case 2:
      return {
        color: "warning" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Vykdoma",
      }
    case 3:
      return {
        color: "success" as const,
        icon: <CheckCircle fontSize="small" />,
        label: "Patvirtinta",
      }
    case 4:
      return {
        color: "error" as const,
        icon: <Cancel fontSize="small" />,
        label: "Atšaukta",
      }
    case 5: 
      return {
        color: "warning" as const,
        icon: <PersonAdd fontSize="small" />,
        label: "Laukiama perdavimo",
      }
    default:
      return {
        color: "default" as const,
        icon: <HourglassEmpty fontSize="small" />,
        label: "Nežinoma",
      }
  }
}

const calculateDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return null

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

const isStatusCancelled = (status: string | number): boolean => {
  if (typeof status === "string") {
    return status === "Cancelled"
  }
  return status === 4 
}

const isStatusNew = (status: string | number): boolean => {
  if (typeof status === "string") {
    return status === "New"
  }
  return status === 0
}

const isStatusPendingReassignment = (status: string | number): boolean => {
  if (typeof status === "string") {
    return status === "PendingReassignment"
  }
  return status === 5 
}

const SpecialOfferReservationsPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const user = useContext(UserContext) 
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offerDetails, setOfferDetails] = useState<any>(null)

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<ReservationResponse | null>(null)

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [reassignmentWizardOpen, setReassignmentWizardOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false)
  const [createOfferLoading, setCreateOfferLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [acceptLoading, setAcceptLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<ReservationFilters>(defaultReservationFilters)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning",
  })

  const handleBackClick = () => {
    if (offerId) {
      navigate(`/public-offers/${offerId}`)
    } else {
      navigate("/public-offers")
    }
  }

  useEffect(() => {
    if (selectedReservation) {
    }
  }, [selectedReservation])

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/PublicTripOfferFacade/${offerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        setOfferDetails(response.data)
      } catch (err) {
        setError("Nepavyko gauti pasiūlymo detalių.")
      } finally {
        setLoading(false)
        setTimeout(() => {
          setIsInitialLoading(false)
        }, 1000)
      }
    }

    if (offerId) {
      fetchOfferDetails()
      fetchReservations(1, pageSize, defaultReservationFilters)
    }
  }, [offerId])

  const fetchReservations = async (page: number, size: number, filters: ReservationFilters) => {
    if (!offerId) return

    try {
      setLoading(true)

      const queryParams: ReservationQueryParams = {
        pageNumber: page,
        pageSize: size,
      }

      if (filters.statuses && filters.statuses.length > 0) {
        queryParams.statuses = filters.statuses.map((status) => ReservationStatus[status])
      }


      const response = await axios.post<PaginatedResponse<ReservationResponse>>(
        `${API_URL}/Reservation/trips/${offerId}/paginated`,
        queryParams,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      setReservations(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)
      setTotalCount(response.data.totalCount)
      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize))

    } catch (err) {
      setError("Nepavyko gauti rezervacijų duomenų. Bandykite vėliau.")
    } finally {
      setLoading(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    setMenuAnchorEl(event.currentTarget)
    setSelectedReservationId(reservationId)
    setSelectedReservation(reservation || null)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedReservationId) return

    try {
      setDeleteLoading(true)

      await axios.delete(`${API_URL}/Reservation/${selectedReservationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSnackbar({
        open: true,
        message: "Rezervacija sėkmingai ištrinta",
        severity: "success",
      })

      setDeleteDialogOpen(false)

      fetchReservations(currentPage, pageSize, selectedFilters)
    } catch (err: any) {

      let errorMessage = "Nepavyko ištrinti rezervacijos. Bandykite dar kartą."

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

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      setDeleteDialogOpen(false)
    } finally {
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

  const handleStatusChangeClick = (reservation: ReservationResponse) => {
    if (!reservation) {
      setSnackbar({
        open: true,
        message: "Nepavyko rasti rezervacijos duomenų",
        severity: "error",
      })
      return
    }

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
    fetchReservations(currentPage, pageSize, selectedFilters)
  }

  const handleCreateOfferClick = () => {
    handleMenuClose()
    setCreateOfferDialogOpen(true)
  }

  const handleCreateOfferConfirm = async () => {
    if (!selectedReservationId) return

    try {
      setCreateOfferLoading(true)

      const response = await axios.post(
        `${API_URL}/ClientTripOfferFacade/${selectedReservationId}/convert`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      setSnackbar({
        open: true,
        message: "Pasiūlymas sėkmingai sukurtas",
        severity: "success",
      })

      setCreateOfferDialogOpen(false)

      const newOfferId = response.data.id
      setTimeout(() => {
        navigate(`/special-offers/${newOfferId}`)
      }, 1000) 
    } catch (err: any) {

      let errorMessage = "Nepavyko sukurti pasiūlymo. Bandykite dar kartą."

      if (err.response) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data && err.response.data.Message) {
          errorMessage = err.response.data.Message
        } else if (err.response.data && typeof err.response.data === "object") {
          errorMessage = JSON.stringify(err.response.data)
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })

      setCreateOfferDialogOpen(false)
    } finally {
      setCreateOfferLoading(false)
    }
  }

  const handleAcceptReservation = async (reservationId: string) => {
    try {
      setAcceptLoading(true)

      await axios.put(`${API_URL}/Reservation/${reservationId}/accept`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSnackbar({
        open: true,
        message: "Rezervacija sėkmingai perimta",
        severity: "success",
      })

      fetchReservations(currentPage, pageSize, selectedFilters)
    } catch (err: any) {

      let errorMessage = "Nepavyko perimti rezervacijos. Bandykite dar kartą."

      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Rezervacija nerasta."
        } else if (err.response.status === 403) {
          errorMessage = "Jūs neturite teisių perimti šios rezervacijos."
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setAcceptLoading(false)
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    try {
      setRejectLoading(true)

      await axios.put(`${API_URL}/Reservation/${reservationId}/reject`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSnackbar({
        open: true,
        message: "Rezervacijos perdavimas atmestas",
        severity: "success",
      })

      fetchReservations(currentPage, pageSize, selectedFilters)
    } catch (err: any) {

      let errorMessage = "Nepavyko atmesti rezervacijos perdavimo. Bandykite dar kartą."

      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = "Rezervacija nerasta."
        } else if (err.response.status === 403) {
          errorMessage = "Jūs neturite teisių atmesti šios rezervacijos perdavimo."
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setRejectLoading(false)
    }
  }

  const handleApplyFilters = (filters: ReservationFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) 
    fetchReservations(1, pageSize, filters)
    setIsFilterDrawerOpen(false)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchReservations(newPage, pageSize, selectedFilters)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) 
    fetchReservations(1, newPageSize, selectedFilters)
  }

  const getActiveFilterCount = () => {
    return selectedFilters.statuses.length
  }

  const isPendingAgent = (reservation: ReservationResponse): boolean => {
    return isStatusPendingReassignment(reservation.status) && reservation.pendingAgentId === user?.id
  }

  const isReservationOwner = (reservation: ReservationResponse): boolean => {
    return reservation.agentId === user?.id
  }

  const shouldDisableMenu = (reservation: ReservationResponse): boolean => {
    if (isStatusCancelled(reservation.status)) return true

    if (isPendingAgent(reservation)) return true

    if (!isReservationOwner(reservation)) return true

    return false
  }

  const getMenuTooltipText = (reservation: ReservationResponse): string => {
    if (isStatusCancelled(reservation.status)) {
      return "Atšauktos rezervacijos negalima redaguoti"
    }

    if (isPendingAgent(reservation)) {
      return "Pirmiausia priimkite arba atmeskite rezervaciją"
    }

    if (!isReservationOwner(reservation)) {
      return "Tik rezervacijos savininkas gali atlikti veiksmus"
    }

    return "Veiksmai"
  }

  if (isInitialLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error && !reservations.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ActionBar showBackButton={true} onBackClick={handleBackClick} />
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    )
  }

  const duration = calculateDuration(offerDetails?.startDate, offerDetails?.endDate)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ActionBar showBackButton={true} onBackClick={handleBackClick} />

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

                            <Tooltip title={getMenuTooltipText(reservation)}>
                              <span>
                                <IconButton
                                  aria-label="more"
                                  aria-controls="reservation-menu"
                                  aria-haspopup="true"
                                  onClick={(e) => handleMenuOpen(e, reservation.id)}
                                  disabled={shouldDisableMenu(reservation)}
                                >
                                  {shouldDisableMenu(reservation) && !isStatusCancelled(reservation.status) ? (
                                    <Lock fontSize="small" color="disabled" />
                                  ) : (
                                    <MoreVert />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>

                        {isPendingAgent(reservation) && (
                          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                            <Box sx={{ display: "flex", gap: 2 }}>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Check />}
                                onClick={() => handleAcceptReservation(reservation.id)}
                                disabled={acceptLoading || rejectLoading}
                                sx={{
                                  minWidth: "140px",
                                  fontWeight: 500,
                                  boxShadow: 2,
                                  "&:hover": { boxShadow: 4 },
                                }}
                              >
                                {acceptLoading ? <CircularProgress size={24} /> : "Patvirtinti"}
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Close />}
                                onClick={() => handleRejectReservation(reservation.id)}
                                disabled={acceptLoading || rejectLoading}
                                sx={{
                                  minWidth: "140px",
                                  fontWeight: 500,
                                  borderWidth: "1.5px",
                                  "&:hover": { borderWidth: "1.5px" },
                                }}
                              >
                                {rejectLoading ? <CircularProgress size={24} /> : "Atmesti"}
                              </Button>
                            </Box>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

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

      <Menu
        id="reservation-menu"
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedReservation && isReservationOwner(selectedReservation) && (
          <>
            {!isStatusCancelled(selectedReservation.status) && (
              <MenuItem onClick={() => handleStatusChangeClick(selectedReservation)}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Keisti statusą" />
              </MenuItem>
            )}

            {isStatusNew(selectedReservation.status) && (
              <MenuItem onClick={handleReassignClick}>
                <ListItemIcon>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Perduoti kitam agentui" />
              </MenuItem>
            )}

            {!isStatusCancelled(selectedReservation.status) && (
              <MenuItem onClick={handleCreateOfferClick} disabled={createOfferLoading}>
                <ListItemIcon>
                  {createOfferLoading ? <CircularProgress size={20} /> : <LocalOffer fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary={createOfferLoading ? "Kuriamas..." : "Sukurti pasiūlymą"} />
              </MenuItem>
            )}

            {!isStatusCancelled(selectedReservation.status) && (
              <MenuItem onClick={handleDeleteClick} disabled={deleteLoading}>
                <ListItemIcon>
                  {deleteLoading ? <CircularProgress size={20} /> : <Delete fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary={deleteLoading ? "Trinama..." : "Ištrinti"} />
              </MenuItem>
            )}
          </>
        )}

        {selectedReservation &&
          (!isReservationOwner(selectedReservation) || isStatusCancelled(selectedReservation.status)) && (
            <MenuItem disabled>
              <ListItemText primary="Nėra galimų veiksmų" />
            </MenuItem>
          )}
      </Menu>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Rezervacijos perdavimas"
        message="Ar tikrai norite perduoti šią rezervaciją kitam agentui? Jūs nebegalėsite jos matyti ar valdyti."
        onConfirm={handleConfirmReassign}
        onCancel={() => setConfirmDialogOpen(false)}
      />

      {selectedReservationId && (
        <ReservationReassignmentWizard
          open={reassignmentWizardOpen}
          onClose={() => setReassignmentWizardOpen(false)}
          reservationId={selectedReservationId}
          onSuccess={() => {
            setReassignmentWizardOpen(false)
            fetchReservations(currentPage, pageSize, selectedFilters)
          }}
        />
      )}

      <ConfirmationDialog
        open={createOfferDialogOpen}
        title="Sukurti pasiūlymą"
        message="Ar tikrai norite sukurti naują pasiūlymą?"
        onConfirm={handleCreateOfferConfirm}
        onCancel={() => setCreateOfferDialogOpen(false)}
        loading={createOfferLoading}
        loadingText="Kuriamas pasiūlymas..."
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Ištrinti rezervaciją"
        message="Ar tikrai norite ištrinti šią rezervaciją? Šio veiksmo negalima atšaukti."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        loadingText="Trinama rezervacija..."
      />

      {isMobile && (
        <ReservationFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {selectedReservation && (
        <ReservationStatusChangeDialog
          open={statusDialogOpen}
          reservationId={selectedReservation.id}
          currentStatus={selectedReservation.status}
          onClose={() => setStatusDialogOpen(false)}
          onSuccess={handleStatusChangeSuccess}
        />
      )}
    </Container>
  )
}

export default SpecialOfferReservationsPage
