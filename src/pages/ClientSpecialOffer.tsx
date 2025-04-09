"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Button,
  Grid,
  Chip,
  Container,
  Tabs,
  Tab,
} from "@mui/material"
import {
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
  FlightTakeoff as FlightTakeoffIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
} from "@mui/icons-material"
import { translateTripStatus, translateTripCategory } from "../Utils/translateEnums"
import { TripStatus } from "../types/Enums"
import ImageGallery from "../components/ImageGallery"
import ActionBar from "../components/ActionBar"
import { useNavigation } from "../contexts/NavigationContext"
import type { OfferEvent, SpecialOfferResponse, FileResponse } from "../types/OfferEvent"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import PdfViewerModal from "../components/PdfViewerModal"

const lithuanianMonths = [
  "", // index 0 unused for 1-based months
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio",
]

/**
 * If event starts and ends on the same day:
 *   e.g. "balandžio 20 d. 9:30–10:30"
 * Otherwise:
 *   e.g. "balandžio 20 d. 9:30 – balandžio 23 d. 14:30"
 */
function formatLithuanianDateRange(start?: string, end?: string): string | null {
  if (!start) return null
  const startDate = new Date(start)
  if (!end) {
    // no end => just show single
    return formatLithuanianMonthDayTime(startDate)
  }

  const endDate = new Date(end)
  // same day?
  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (sameDay) {
    // "balandžio 20 d. 9:30–10:30"
    return `${formatLithuanianMonthDayTime(startDate)}–${formatTime(endDate)}`
  } else {
    // "balandžio 20 d. 9:30 – balandžio 23 d. 14:30"
    return `${formatLithuanianMonthDayTime(startDate)} – ${formatLithuanianMonthDayTime(endDate)}`
  }
}

/** Format e.g. "balandžio 20 d. 9:30" */
function formatLithuanianMonthDayTime(date: Date): string {
  const day = date.getDate() // e.g. 20
  const month = date.getMonth() + 1 // e.g. 4 => "balandžio"
  const hour = date.getHours() // 0-23
  const min = date.getMinutes()

  const monthName = lithuanianMonths[month]
  // "balandžio 20 d. 9:30"
  return `${monthName} ${day} d. ${formatTimePart(hour)}:${formatTimePart(min)}`
}

/** Minimal zero-padding for hour/minute */
function formatTimePart(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

/** If we only need e.g. "9:30" from a date */
function formatTime(date: Date): string {
  const h = formatTimePart(date.getHours())
  const m = formatTimePart(date.getMinutes())
  return `${h}:${m}`
}

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
      id={`offer-tabpanel-${index}`}
      aria-labelledby={`offer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const ClientSpecialOffer: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<SpecialOfferResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(true)
  const [offerImages, setOfferImages] = useState<FileResponse[]>([])
  const [selectedTab, setSelectedTab] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)

  // New state for delete confirmation
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  const user = useContext(UserContext)
  const token = localStorage.getItem("accessToken")
  const { navigateBack } = useNavigation()

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true)
        const response = await axios.get<SpecialOfferResponse>(`${API_URL}/ClientTripOfferFacade/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setOffer(response.data)

        // Check if can edit
        if (response.data.startDate) {
          const startDate = new Date(response.data.startDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          setCanEdit(startDate > today)
        }
      } catch (err: any) {
        console.error("Failed to fetch special offer:", err)
        setError(err.response?.data?.message || "Nepavyko gauti pasiūlymo informacijos.")
      } finally {
        setLoading(false)
      }
    }

    // Fetch images (type = Image) for the offer
    const fetchOfferImages = async () => {
      try {
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setOfferImages(response.data)
      } catch (err) {
        console.error("Nepavyko gauti nuotraukų:", err)
      }
    }

    if (tripId) {
      fetchOffer()
      fetchOfferImages()
    }
  }, [tripId, token])

  const handleEditClick = () => {
    if (tripId) {
      navigate(`/special-offers/${tripId}/edit`)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!tripId) return

    setDeleteLoading(true)
    try {
      await axios.delete(`${API_URL}/ClientTripOfferFacade/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Show success message
      setSnackbarMessage("Pasiūlymas sėkmingai ištrintas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Close the dialog
      setShowDeleteConfirmDialog(false)

      // Add a small delay before navigation to ensure the snackbar is seen
      setTimeout(() => {
        navigate("/special-offers")
      }, 1500) // 1.5 second delay
    } catch (err: any) {
      console.error("Failed to delete special offer:", err)

      setSnackbarMessage(err.response?.data?.message || "Nepavyko ištrinti pasiūlymo.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      setShowDeleteConfirmDialog(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const handleConvertToTripClick = () => {
    // This is a placeholder - no functionality for now
    console.log("Convert to trip button clicked")
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }

  // New function to handle PDF download
  const handleDownloadPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      // Make a request to the PDF generation endpoint
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
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
      link.download = `pasiulymas-${tripId}.pdf` // Set the filename
      document.body.appendChild(link)
      link.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      // Show success message
      setSnackbarMessage("PDF dokumentas sėkmingai atsisiųstas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error("Failed to download PDF:", err)
      setSnackbarMessage("Nepavyko atsisiųsti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setPdfLoading(false)
    }
  }

  // Function to preview PDF in a new tab
  const handlePreviewPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      // Make a request to the PDF generation endpoint
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important: we need to receive the response as a blob
      })

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      // Open the PDF in a new tab
      window.open(url, "_blank")

      // Show success message
      setSnackbarMessage("PDF dokumentas sėkmingai sugeneruotas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error("Failed to preview PDF:", err)
      setSnackbarMessage("Nepavyko sugeneruoti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setPdfLoading(false)
    }
  }

  // Function to open PDF in the embedded viewer
  const handleOpenPdfViewer = async () => {
    if (!tripId) return

    setPdfLoading(true)
    setPdfViewerOpen(true)
    setPdfUrl(null) // Reset URL while loading

    try {
      // Make a request to the PDF generation endpoint
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
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
      setSnackbarMessage("Nepavyko sugeneruoti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
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
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff9f9" }}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        </Paper>
      </Container>
    )
  }

  if (!offer) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" align="center">
            Specialus pasiūlymas nerastas.
          </Typography>
        </Paper>
      </Container>
    )
  }

  // Group events by step number to create different "options"
  const eventsByOption: { [key: number]: OfferEvent[] } = {}
  offer.itinerary?.sortedEvents?.forEach((ev: OfferEvent) => {
    const optionNum = ev.stepDayNumber
    if (!eventsByOption[optionNum]) {
      eventsByOption[optionNum] = []
    }
    eventsByOption[optionNum].push(ev)
  })

  const sortedOptionKeys = Object.keys(eventsByOption)
    .map(Number)
    .sort((a, b) => a - b)

  // A simple date-locale function for the overall offer
  function formatDate(dateString?: string) {
    if (!dateString) return "—"
    const d = new Date(dateString)
    // E.g. "2025-04-20"
    return d.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Find option title for each variant
  const getOptionTitle = (optionKey: number): string => {
    const events = eventsByOption[optionKey] || []
    const headerEvent = events.find((ev) => ev.eventType === "OptionHeader")
    return headerEvent?.title || `Pasiūlymas ${optionKey + 1}`
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Action Bar */}
      <ActionBar backUrl="/special-offers" showBackButton={true} onBackClick={navigateBack}>
        {/* PDF Buttons */}
        <Box sx={{ display: "flex" }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenPdfViewer}
            startIcon={<PdfIcon />}
            disabled={pdfLoading}
            sx={{
              textTransform: "none",
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: "none",
            }}
          >
            {pdfLoading && pdfViewerOpen ? "Ruošiamas..." : "Peržiūrėti PDF"}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleDownloadPdf}
            startIcon={<DownloadIcon />}
            disabled={pdfLoading}
            sx={{
              textTransform: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            {pdfLoading && !pdfViewerOpen ? "Ruošiamas..." : "Atsisiųsti"}
          </Button>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleConvertToTripClick}
          startIcon={<FlightTakeoffIcon />}
          sx={{
            textTransform: "none",
          }}
        >
          Paversti į kelionę
        </Button>
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
          {/* Header with trip name, edit button and status */}
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
              {offer.tripName}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {offer.status !== undefined && (
                <Chip
                  label={translateTripStatus(offer.status)}
                  color={offer.status === TripStatus.Confirmed ? "success" : "primary"}
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
                  {offer.category && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CategoryIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Kategorija:</span>{" "}
                          {translateTripCategory(offer.category)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Price */}
                  {offer.price !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EuroIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Kaina:</span> €{offer.price}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* StartDate */}
                  {offer.startDate && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Pradžios data:</span> {formatDate(offer.startDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* EndDate */}
                  {offer.endDate && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Pabaigos data:</span> {formatDate(offer.endDate)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Adults */}
                  {offer.adultsCount !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Suaugusiųjų:</span> {offer.adultsCount}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Children */}
                  {offer.childrenCount !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ChildIcon color="primary" />
                        <Typography variant="body1">
                          <span style={{ color: "text.secondary" }}>Vaikų:</span> {offer.childrenCount}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Right column: Description and client wishes */}
              <Grid item xs={12} md={6}>
                {/* Description */}
                {offer.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
                      Aprašymas
                    </Typography>
                    <Typography variant="body2">{offer.description}</Typography>
                  </Box>
                )}

                {/* Client wishes */}
                {offer.clientWishes && (
                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
                      Kliento pageidavimai
                    </Typography>
                    <Typography variant="body2">{offer.clientWishes}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            {/* Main offer images */}
            {offerImages.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
                  Nuotraukos
                </Typography>
                <ImageGallery images={offerImages} thumbnailSize={120} />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Offer options section */}
      {!offer.itinerary?.sortedEvents || offer.itinerary.sortedEvents.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="body1">Nėra maršruto / pasiūlymo elementų.</Typography>
        </Paper>
      ) : (
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Tabs for different offer options */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: "bold",
                    py: 2,
                    minWidth: 120, // Ensure tabs have a minimum width
                  },
                  "& .MuiTabs-scrollButtons": {
                    // Make scroll buttons more visible
                    color: "primary.main",
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  },
                }}
              >
                {sortedOptionKeys.map((optionKey, i) => (
                  <Tab
                    key={optionKey}
                    label={getOptionTitle(optionKey)}
                    id={`offer-tab-${i}`}
                    aria-controls={`offer-tabpanel-${i}`}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Tab panels for each offer option */}
            {sortedOptionKeys.map((optionKey, i) => {
              const events = eventsByOption[optionKey].filter((ev) => ev.eventType !== "OptionHeader") // Skip the header event since we're using it in the tab

              return (
                <TabPanel key={optionKey} value={selectedTab} index={i}>
                  <Box sx={{ px: 3, pb: 3 }}>
                    {events.length === 0 ? (
                      <Typography variant="body1" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                        Nėra įvykių šiame pasiūlyme.
                      </Typography>
                    ) : (
                      <Box>
                        {events.map((ev, idx) => {
                          // We'll build e.g. "balandžio 20 d. 9:30–10:30" or "balandžio 20 d. 9:30 – balandžio 22 d. 12:00"
                          const timeDisplay = formatLithuanianDateRange(ev.startDate, ev.endDate)

                          return (
                            <Box
                              key={idx}
                              sx={{
                                mb: 4,
                                pb: 3,
                                borderBottom: idx < events.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                {ev.title}
                              </Typography>

                              {timeDisplay && (
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                                  {timeDisplay}
                                </Typography>
                              )}

                              {ev.details && (
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                  {ev.details}
                                </Typography>
                              )}

                              {/* Add image gallery for event images */}
                              {ev.images && ev.images.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <ImageGallery images={ev.images} thumbnailSize={100} />
                                </Box>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                </TabPanel>
              )
            })}
          </CardContent>
        </Card>
      )}
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
      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        title="Ištrinti pasiūlymą"
        message="Ar tikrai norite ištrinti šį pasiūlymą? Šis veiksmas yra negrįžtamas, bus ištrinta visa susijusi informacija."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default ClientSpecialOffer

