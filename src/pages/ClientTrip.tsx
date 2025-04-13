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
import TripDetailsCard from "../components/TripDetailsCard"
import ItineraryDisplay from "../components/ItineraryDisplay"
import DocumentGallery from "../components/DocumentGallery"
import PdfViewerModal from "../components/PdfViewerModal"

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

// Updated file response interface to match the backend model
interface FileResponse {
  id: string
  urlInline?: string // Inline SAS URL (for <img> or <iframe>)
  url?: string // Attachment SAS URL (forces browser to download)
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

  // State for clone functionality
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  // State for delete confirmation
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // State for PDF functionality
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

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
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTripImages(response.data)
      } catch (err) {
        console.error("Nepavyko gauti nuotraukų:", err)
      }
    }

    // Fetch documents (type = Document)
    const fetchTripDocuments = async () => {
      try {
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Document`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTripDocuments(response.data)
      } catch (err) {
        console.error("Nepavyko gauti dokumentų:", err)
      }
    }

    if (tripId) {
      fetchTrip()
      fetchTripImages()
      fetchTripDocuments()
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

  // Handlers for clone functionality
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
        if (response.data && response.data.id) {
          navigate(`/admin-trip-list/${response.data.id}`)
        }
      }, 1500)
    } catch (err: any) {
      console.error("Failed to clone trip:", err)

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Nepavyko klonuoti kelionės.",
        severity: "error",
      })
    } finally {
      setCloneLoading(false)
    }
  }

  // Handlers for delete functionality
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // New function to handle PDF download
  const handleDownloadPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      // Make a request to the PDF generation endpoint
      const response = await axios.get(`${API_URL}/Pdf/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important: we need to receive the response as a blob
      })

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element to trigger the download
      const link = document.createElement("a")
      link.href = url
      link.download = `kelione-${tripId}.pdf` // Set the filename
      document.body.appendChild(link)
      link.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      // Show success message
      setSnackbar({
        open: true,
        message: "PDF dokumentas sėkmingai atsisiųstas!",
        severity: "success",
      })
    } catch (err: any) {
      console.error("Failed to download PDF:", err)
      setSnackbar({
        open: true,
        message: "Nepavyko atsisiųsti PDF dokumento.",
        severity: "error",
      })
    } finally {
      setPdfLoading(false)
    }
  }

  // Function to preview PDF in a modal
  const handlePreviewPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    setPdfViewerOpen(true)
    setPdfUrl(null) // Reset URL while loading

    try {
      // Make a request to the PDF generation endpoint
      const response = await axios.get(`${API_URL}/Pdf/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important: we need to receive the response as a blob
      })

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err: any) {
      console.error("Failed to generate PDF for viewer:", err)
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

  // Clean up blob URLs when component unmounts
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
      {/* Action Bar with Back Button and Action Buttons */}
      <ActionBar
        backUrl={getBackNavigationUrl(tripId)}
        showBackButton={true}
        showEditButton={true}
        showDeleteButton={true}
        showCloneButton={true}
        showChangeStatusButton={true}
        showPdfButtons={true}
        pdfLoading={pdfLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onClone={handleCloneClick}
        onChangeStatus={() => {
          /* Non-functioning for now */
        }}
        onPreviewPdf={handlePreviewPdf}
        onDownloadPdf={handleDownloadPdf}
        onBackClick={navigateBack}
      />

      {/* Trip Details Card */}
      <TripDetailsCard trip={trip} />

      {/* Tabs for different sections */}
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

        {/* Itinerary Tab */}
        <TabPanel value={activeTab} index={0}>
          <ItineraryDisplay itinerary={trip.itinerary} isDayByDay={isDayByDay} />
        </TabPanel>

        {/* Images Tab */}
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

        {/* Documents Tab */}
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

      {/* PDF Viewer Modal */}
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
