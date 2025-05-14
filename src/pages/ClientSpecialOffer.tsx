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
  Container,
  Tabs,
  Tab,
} from "@mui/material"

import ImageGallery from "../components/ImageGallery"
import ActionBar from "../components/ActionBar"
import { useNavigation } from "../contexts/NavigationContext"
import type { OfferEvent, SpecialOfferResponse, FileResponse } from "../types/OfferEvent"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import PdfViewerModal from "../components/PdfViewerModal"
import ConvertOfferToTripPopup from "../components/ConvertOfferToTripPopup"
import TripInfoCard from "../components/TripInfoCard"

const lithuanianMonths = [
  "",
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

function formatLithuanianDateRange(start?: string, end?: string): string | null {
  if (!start) return null
  const startDate = new Date(start)
  if (!end) {
    return formatLithuanianMonthDayTime(startDate)
  }

  const endDate = new Date(end)
  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (sameDay) {
    return `${formatLithuanianMonthDayTime(startDate)}–${formatTime(endDate)}`
  } else {
    return `${formatLithuanianMonthDayTime(startDate)} – ${formatLithuanianMonthDayTime(endDate)}`
  }
}

function formatLithuanianMonthDayTime(date: Date): string {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const hour = date.getHours()
  const min = date.getMinutes()

  const monthName = lithuanianMonths[month]
  return `${monthName} ${day} d. ${formatTimePart(hour)}:${formatTimePart(min)}`
}

function formatTimePart(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

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
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(true)
  const [offerImages, setOfferImages] = useState<FileResponse[]>([])
  const [selectedTab, setSelectedTab] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)

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
  const [showConvertPopup, setShowConvertPopup] = useState(false)

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

        if (response.data.startDate) {
          const startDate = new Date(response.data.startDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          setCanEdit(startDate > today)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Nepavyko gauti pasiūlymo informacijos.")
      } finally {
        setLoading(false)
        setTimeout(() => {
          setIsInitialLoading(false)
        }, 1000)
      }
    }

    const fetchOfferImages = async () => {
      try {
        const response = await axios.get<FileResponse[]>(`${API_URL}/File/trip/${tripId}/Image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setOfferImages(response.data)
      } catch (err) {
        setError("Nepavyko gauti nuotraukų.")
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

      setSnackbarMessage("Pasiūlymas sėkmingai ištrintas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      setShowDeleteConfirmDialog(false)

      setTimeout(() => {
        navigate("/special-offers")
      }, 1500)
    } catch (err: any) {
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
    setShowConvertPopup(true)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }

  const handleDownloadPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `pasiulymas-${tripId}.pdf`
      document.body.appendChild(link)
      link.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      setSnackbarMessage("PDF dokumentas sėkmingai atsisiųstas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)
    } catch (err: any) {
      setSnackbarMessage("Nepavyko atsisiųsti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePreviewPdf = async () => {
    if (!tripId) return

    setPdfLoading(true)
    try {
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      window.open(url, "_blank")

      setSnackbarMessage("PDF dokumentas sėkmingai sugeneruotas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)
    } catch (err: any) {
      setSnackbarMessage("Nepavyko sugeneruoti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
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
      const response = await axios.get(`${API_URL}/Pdf/offer/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err: any) {
      setSnackbarMessage("Nepavyko sugeneruoti PDF dokumento.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      setPdfViewerOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  if (isInitialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
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

  function formatDate(dateString?: string) {
    if (!dateString) return "—"
    const d = new Date(dateString)
    return d.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getOptionTitle = (optionKey: number): string => {
    const events = eventsByOption[optionKey] || []
    const headerEvent = events.find((ev) => ev.eventType === "OptionHeader")
    return headerEvent?.title || `Pasiūlymas ${optionKey + 1}`
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <ActionBar
          backUrl="/special-offers"
          showBackButton={true}
          showEditButton={true}
          showDeleteButton={true}
          showConvertToTripButton={true}
          showPdfButtons={true}
          pdfLoading={pdfLoading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onConvertToTrip={handleConvertToTripClick}
          onPreviewPdf={handleOpenPdfViewer}
          onDownloadPdf={handleDownloadPdf}
          onBackClick={navigateBack}
        />
      </Box>

      <TripInfoCard trip={offer} variant="offer" images={offerImages} />

      {!offer.itinerary?.sortedEvents || offer.itinerary.sortedEvents.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="body1">Nėra maršruto / pasiūlymo elementų.</Typography>
        </Paper>
      ) : (
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
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
                    minWidth: 120,
                  },
                  "& .MuiTabs-scrollButtons": {
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

            {sortedOptionKeys.map((optionKey, i) => {
              const events = eventsByOption[optionKey].filter((ev) => ev.eventType !== "OptionHeader")

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

      <ConvertOfferToTripPopup
        open={showConvertPopup}
        onClose={() => setShowConvertPopup(false)}
        offer={offer}
      />

      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        title="Ištrinti pasiūlymą"
        message="Ar tikrai norite ištrinti šį pasiūlymą? Šis veiksmas negali būti atšauktas."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

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
