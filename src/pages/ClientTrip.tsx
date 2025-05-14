"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import { Box, Typography, CircularProgress, Container, Tabs, Tab, Paper } from "@mui/material"
import { Photo as PhotoIcon, Map as MapIcon, Article as ArticleIcon } from "@mui/icons-material"
import type { TripResponse } from "../types/ClientTrip"
import ImageGallery from "../components/ImageGallery"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CloneTripModal, { type CloneTripOptions } from "../components/CloneTripModal"
import CustomSnackbar from "../components/CustomSnackBar"
import ActionBar from "../components/ActionBar"
import { useNavigation } from "../contexts/NavigationContext"
import TripInfoCard from "../components/TripInfoCard"
import ItineraryDisplay from "../components/ItineraryDisplay"
import DocumentGallery from "../components/DocumentGallery"
import PdfViewerModal from "../components/PdfViewerModal"
import TripReviewModal from "../components/TripReviewModal"
import type { TripReviewResponse } from "../types/TripReview"
import TripStatusChangeDialog from "../components/status/ClientTripStatusChangeModal"
import type { TripStatus, PaymentStatus } from "../types/ClientTrip"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trip-tabpanel-${index}`}
      aria-labelledby={`trip-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface FileResponse {
  id: string
  urlInline?: string 
  url?: string 
  container?: string
  type?: string
  altText?: string
  tripId?: string
  fileName?: string
}

const ClientTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [trip, setTrip] = useState<TripResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripImages, setTripImages] = useState<FileResponse[]>([])
  const [tripDocuments, setTripDocuments] = useState<FileResponse[]>([])
  const [canEdit, setCanEdit] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [tripStatus, setTripStatus] = useState<"started" | "ended" | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [hasReview, setHasReview] = useState(false)
  const [reviewData, setReviewData] = useState<TripReviewResponse | null>(null)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  const user = useContext(UserContext)
  const token = localStorage.getItem("accessToken")
  const { navigationSource, getBackNavigationUrl, navigateBack } = useNavigation()

  useEffect(() => {
    const state = location.state as { fromEdit?: boolean } | null
    if (state?.fromEdit && tripId) {
      window.history.replaceState(null, "", window.location.href)

      const savedState = localStorage.getItem(`trip-detail-${tripId}`)
      if (savedState) {
        const { scrollPosition } = JSON.parse(savedState)
        window.scrollTo(0, scrollPosition)
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
        setError(err.response?.data?.message || "Nepavyko gauti kelionės informacijos.")
      } finally {
        setLoading(false)
      }
    }

    const fetchTripImages = async () => {
      try {
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTripImages(response.data)
      } catch (err) {
        setError("Nepavyko gauti nuotraukų.")
      }
    }

    const fetchTripDocuments = async () => {
      try {
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Document`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTripDocuments(response.data)
      } catch (err) {
        setError("Nepavyko gauti dokumentų.")
      }
    }

    if (tripId) {
      fetchTrip()
      fetchTripImages()
      fetchTripDocuments()
      checkReviewExists()
    }
  }, [tripId, token])

  const checkReviewExists = async () => {
    if (!tripId) return

    try {
      const response = await axios.get<TripReviewResponse>(`${API_URL}/TripReview/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setHasReview(true)
      setReviewData(response.data)
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Nepavyko patikrinti atsiliepimo.")
      }
      setHasReview(false)
      setReviewData(null)
    }
  }

  const handleEditClick = () => {
    if (tripStatus) {
      setShowConfirmDialog(true)
    } else if (trip?.id) {
      const state = {
        tripId: trip.id,
        scrollPosition: window.scrollY,
        navigationSource, 
      }
      localStorage.setItem(`trip-detail-${trip.id}`, JSON.stringify(state))
      navigate(`/admin-trip-list/${trip.id}/edit`)
    }
  }

  const handleConfirmEdit = () => {
    setShowConfirmDialog(false)
    if (trip?.id) {
      const state = {
        tripId: trip.id,
        scrollPosition: window.scrollY,
        navigationSource, 
      }
      localStorage.setItem(`trip-detail-${trip.id}`, JSON.stringify(state))
      navigate(`/admin-trip-list/${trip.id}/edit`)
    }
  }

  const handleCancelEdit = () => {
    setShowConfirmDialog(false)
  }

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
      const response = await axios.post<TripResponse>(`${API_URL}/client-trips/${tripId}/clone`, options, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      setSnackbar({
        open: true,
        message: "Kelionė sėkmingai klonuota!",
        severity: "success",
      })

      setShowCloneModal(false)

      setTimeout(() => {
        navigate(`/admin-trip-list/${response.data.id}`)
      }, 1500)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Nepavyko klonuoti kelionės.",
        severity: "error",
      })
    } finally {
      setCloneLoading(false)
    }
  }

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

      setSnackbar({
        open: true,
        message: "Kelionė sėkmingai ištrinta!",
        severity: "success",
      })

      setShowDeleteConfirmDialog(false)

      setTimeout(() => {
        navigate("/admin-trip-list")
      }, 1500)
    } catch (err: any) {
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleChangeStatus = () => {
    setStatusDialogOpen(true)
  }

  const handleStatusChangeSuccess = () => {
    setStatusDialogOpen(false)
    setSnackbar({
      open: true,
      message: "Kelionės būsena sėkmingai atnaujinta!",
      severity: "success",
    })
  }

  const handleDownloadPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      const response = await axios.get(`${API_URL}/Pdf/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `kelione-${tripId}.pdf`
      document.body.appendChild(link)
      link.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      setSnackbar({
        open: true,
        message: "PDF dokumentas sėkmingai atsisiųstas!",
        severity: "success",
      })
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: "Nepavyko atsisiųsti PDF dokumento.",
        severity: "error",
      })
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePreviewPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    setPdfViewerOpen(true)
    setPdfUrl(null)

    try {
      const response = await axios.get(`${API_URL}/Pdf/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: "Nepavyko sugeneruoti PDF dokumento.",
        severity: "error",
      })
      setPdfViewerOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleOpenPdfViewer = async () => {
    if (!tripId) return

    setPdfLoading(true)
    setPdfViewerOpen(true)
    setPdfUrl(null)

    try {
      const response = await axios.get(`${API_URL}/Pdf/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: "Nepavyko sugeneruoti PDF dokumento.",
        severity: "error",
      })
      setPdfViewerOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleCreateReview = () => {
    setReviewModalOpen(true)
  }

  const handleViewReview = () => {
    setReviewModalOpen(true)
  }

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false)
  }

  const handleReviewSuccess = () => {
    checkReviewExists()
    setSnackbar({
      open: true,
      message: "Atsiliepimas sėkmingai pateiktas!",
      severity: "success",
    })
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

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

  const isDayByDay = trip.dayByDayItineraryNeeded

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ActionBar
        backUrl={getBackNavigationUrl(tripId)}
        showBackButton={true}
        showEditButton={true}
        showDeleteButton={true}
        showCloneButton={true}
        showChangeStatusButton={true}
        showPdfButtons={true}
        showReviewButton={tripStatus === "ended" && trip?.status === "Confirmed"}
        hasReview={hasReview}
        pdfLoading={pdfLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onClone={handleCloneClick}
        onChangeStatus={handleChangeStatus}
        onCreateReview={handleCreateReview}
        onViewReview={handleViewReview}
        onPreviewPdf={handlePreviewPdf}
        onDownloadPdf={handleDownloadPdf}
        onBackClick={navigateBack}
      />

      <TripInfoCard trip={trip} variant="trip" images={tripImages} />

      <Paper sx={{ borderRadius: 2, mb: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 2,
            },
          }}
        >
          <Tab
            icon={<MapIcon />}
            iconPosition="start"
            label="Kelionės planas"
            id="trip-tab-0"
            aria-controls="trip-tabpanel-0"
          />
          <Tab
            icon={<PhotoIcon />}
            iconPosition="start"
            label="Nuotraukos"
            id="trip-tab-1"
            aria-controls="trip-tabpanel-1"
          />
          <Tab
            icon={<ArticleIcon />}
            iconPosition="start"
            label="Dokumentai"
            id="trip-tab-2"
            aria-controls="trip-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ItineraryDisplay itinerary={trip.itinerary} isDayByDay={isDayByDay} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {tripImages.length > 0 ? (
            <ImageGallery images={tripImages} thumbnailSize={180} />
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nėra įkeltų nuotraukų
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {tripDocuments.length > 0 ? (
            <DocumentGallery documents={tripDocuments} />
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nėra įkeltų dokumentų
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      <ConfirmationDialog
        open={showConfirmDialog}
        title="Patvirtinti redagavimą"
        message={`Kelionė jau ${tripStatus === "started" ? "prasidėjo" : "pasibaigė"}. Ar tikrai norite ją redaguoti?`}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />

      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        title="Ištrinti kelionę"
        message="Ar tikrai norite ištrinti šią kelionę? Šis veiksmas yra negrįžtamas, bus ištrinta visa susijusi informacija."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <CloneTripModal
        open={showCloneModal}
        onClose={handleCloseCloneModal}
        onConfirm={handleCloneConfirm}
        initialStartDate={trip.startDate}
        initialEndDate={trip.endDate}
        loading={cloneLoading}
      />

      <PdfViewerModal
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false)
          if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }
        }}
        pdfUrl={pdfUrl}
        loading={pdfLoading}
        onDownload={handleDownloadPdf}
      />

      <TripReviewModal
        open={reviewModalOpen}
        onClose={handleCloseReviewModal}
        tripId={tripId}
        onSuccess={handleReviewSuccess}
      />

      <TripStatusChangeDialog
        open={statusDialogOpen}
        tripId={tripId || ""}
        currentTripStatus={trip?.status as TripStatus}
        currentPaymentStatus={trip?.paymentStatus as PaymentStatus}
        onClose={() => setStatusDialogOpen(false)}
        onSuccess={handleStatusChangeSuccess}
      />

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
