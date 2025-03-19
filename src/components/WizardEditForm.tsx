"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Container, Typography, Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import { API_URL } from "../Utils/Configuration"

import Step1TripInfo from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../components/CustomSnackBar"
import UnifiedFileUploadStep from "./UnifiedFileUploadStep"

// ---------- Types ----------
import {
  type TripFormData,
  type ItineraryDay,
  type ValidationWarning,
  type TripEvent,
  type CreateTripRequest,
  type SnackbarState,
  type WizardFormState,
  type TripResponse,
  TransportType,
} from "../types"

// Example shape for an existing image from the server
export interface ExistingFile {
  id: string // File DB ID
  url: string // Public or SAS link
  fileName: string // For display
}

// The steps for the wizard
const steps = ["Kelionės informacija", "Kelionės planas", "Nuotraukos ir dokumentai", "Peržiūrėti ir atnaujinti"]

function WizardEditForm() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  // Wizard step index
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  // ---------- Wizard Data State ----------
  const [formState, setFormState] = useState<WizardFormState>({
    tripData: {} as TripFormData,
    itinerary: [],
    validationWarnings: [],
    images: [], // newly added images
    documents: [], // newly added documents
  })

  // ---------- Existing files from server ----------
  const [existingImages, setExistingImages] = useState<ExistingFile[]>([])
  const [existingDocuments, setExistingDocuments] = useState<ExistingFile[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // array of existing image IDs
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]) // array of existing document IDs

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!tripId) return
    fetchTripData(tripId)
  }, [tripId])

  // ----------------------------------------------------------------
  // 1) FETCH the existing Trip + Images + Documents
  // ----------------------------------------------------------------
  async function fetchTripData(id: string) {
    try {
      // A) Load the trip (like your existing code)
      const response = await axios.get<TripResponse>(`${API_URL}/client-trips/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (response.status === 200) {
        const trip = response.data
        const normalized = mapServerResponseToWizardState(trip)
        setFormState((prev) => ({
          ...prev,
          tripData: normalized.tripData,
          itinerary: normalized.itinerary,
        }))
      }

      // B) Load existing images from your /File/trip/:tripId/Image
      const imagesResp = await axios.get<ExistingFile[]>(`${API_URL}/File/trip/${id}/Image`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (imagesResp.status === 200) {
        setExistingImages(imagesResp.data)
      }

      // C) Load existing documents from your /File/trip/:tripId/Document
      const documentsResp = await axios.get<ExistingFile[]>(`${API_URL}/File/trip/${id}/Document`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (documentsResp.status === 200) {
        setExistingDocuments(documentsResp.data)
      }

      setLoading(false)
    } catch (error) {
      console.error("Failed to load trip or files:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko įkelti kelionės duomenų ar failų.",
        severity: "error",
      })
      setLoading(false)
    }
  }

  // Minimal translator from server response to wizard fields
  function mapServerResponseToWizardState(tripResponse: TripResponse) {
    const {
      tripName,
      description,
      startDate,
      endDate,
      category,
      status,
      paymentStatus,
      insuranceTaken,
      adultsCount,
      childrenCount,
      dayByDayItineraryNeeded,
      price,
      itinerary,
      clientId,
    } = tripResponse

    const tripData: TripFormData = {
      tripName: tripName || "",
      description: description || "",
      startDate: startDate ? startDate.split("T")[0] : null,
      endDate: endDate ? endDate.split("T")[0] : null,
      category: category || "",
      status: status || "Draft",
      paymentStatus: paymentStatus || "Unpaid",
      insuranceTaken: insuranceTaken || false,
      price: price || 0,
      adultsCount: adultsCount || 0,
      childrenCount: childrenCount || 0,
      dayByDayItineraryNeeded: dayByDayItineraryNeeded || false,
      itineraryTitle: itinerary?.title || "",
      itineraryDescription: itinerary?.description || "",
      clientId: clientId || "",
      clientName: null, // or fill if you have it
    }

    // Build wizard itinerary from steps
    let wizardItinerary: ItineraryDay[] = []
    if (dayByDayItineraryNeeded && itinerary && itinerary.itinerarySteps) {
      wizardItinerary = buildWizardItineraryFromSteps(itinerary.itinerarySteps, tripData.startDate)
    } else {
      // single day approach
      wizardItinerary = [
        {
          dayLabel: tripData.startDate || "",
          dayDescription: itinerary?.description || "",
          events: flattenStepsToEvents(itinerary?.itinerarySteps ?? []),
        },
      ]
    }

    return {
      tripData,
      itinerary: wizardItinerary,
    }
  }

  function buildWizardItineraryFromSteps(steps: any[], startDate: string | null) {
    if (!startDate) return []
    const results: ItineraryDay[] = []
    const start = dayjs(startDate)

    steps.forEach((step: any) => {
      const dNum = step.dayNumber || 1
      const idx = dNum - 1
      if (!results[idx]) {
        const dayLabel = start.add(idx, "day").format("YYYY-MM-DD")
        results[idx] = {
          dayLabel,
          dayDescription: step.description || "",
          events: [],
        }
      }
      const evts = convertOneStepToEvents(step)
      results[idx].events.push(...evts)
    })
    return results
  }

  function flattenStepsToEvents(steps: any[]) {
    let out: TripEvent[] = []
    steps.forEach((s: any) => {
      out = out.concat(convertOneStepToEvents(s))
    })
    return out
  }

  function convertOneStepToEvents(step: any): TripEvent[] {
    const events: TripEvent[] = []
    if (step.transports) {
      step.transports.forEach((t: any) => {
        events.push({
          type: t.transportType?.toLowerCase() === "cruise" ? "cruise" : "transport",
          transportType: t.transportType || TransportType.Flight,
          departureTime: t.departureTime || "",
          arrivalTime: t.arrivalTime || "",
          departurePlace: t.departurePlace || "",
          arrivalPlace: t.arrivalPlace || "",
          description: t.description || "",
          companyName: t.companyName || "",
          transportName: t.transportName || "",
          transportCode: t.transportCode || "",
          cabinType: t.cabinType || "",
        })
      })
    }
    if (step.accommodations) {
      step.accommodations.forEach((a: any) => {
        events.push({
          type: "accommodation",
          hotelName: a.hotelName || "",
          hotelLink: a.hotelLink || "",
          checkIn: a.checkIn || "",
          checkOut: a.checkOut || "",
          description: a.description || "",
          boardBasis: a.boardBasis || "",
          roomType: a.roomType || "",
        })
      })
    }
    if (step.activities) {
      step.activities.forEach((act: any) => {
        events.push({
          type: "activity",
          description: act.description || "",
          activityTime: act.activityTime || "",
        })
      })
    }
    return events
  }

  // -----------------------------------------------------------
  // WIZARD NAV
  // -----------------------------------------------------------
  function handleNext() {
    setActiveStep((prev) => prev + 1)
  }
  function handleBack() {
    setActiveStep((prev) => prev - 1)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Įkeliama...</Typography>
      </Container>
    )
  }
  if (!tripId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Trūksta kelionės ID</Typography>
      </Container>
    )
  }

  // -----------------------------------------------------------
  // Step 2.5: Files handling with the unified component
  // -----------------------------------------------------------
  const handleFileUploadsSubmit = (
    newImages: File[],
    newDocuments: File[],
    imagesToDeleteIds?: string[],
    documentsToDeleteIds?: string[],
  ) => {
    // Update the form state with the new files
    setFormState((prev) => ({
      ...prev,
      images: newImages,
      documents: newDocuments,
    }))

    // Update the lists of files to delete
    if (imagesToDeleteIds) {
      setImagesToDelete(imagesToDeleteIds)
    }
    if (documentsToDeleteIds) {
      setDocumentsToDelete(documentsToDeleteIds)
    }

    // Move to the next step
    handleNext()
  }

  // -----------------------------------------------------------
  // Step 3 final: handle PUT with newImages + imagesToDelete
  // -----------------------------------------------------------
  async function handleSaveTrip(status: "Draft" | "Confirmed") {
    // Basic validation from Step2
    const validationResult = validateTrip(formState.tripData, formState.itinerary, status === "Confirmed")
    if (!validationResult.isValid) {
      return
    }
    setFormState((prev) => ({
      ...prev,
      validationWarnings: validationResult.warnings,
    }))

    // Set saving state to true when starting the save operation
    setIsSaving(true)

    try {
      // 1) Build a normal request body for everything except images
      const finalData = buildFinalData(status)

      // 2) We'll pass images in a FormData
      const formData = new FormData()

      // A) Append top-level trip data to FormData
      const fd = formState.tripData
      formData.append("clientId", fd.clientId || "")
      formData.append("tripName", fd.tripName || "")
      formData.append("description", fd.description || "")
      formData.append("category", fd.category || "")
      formData.append("status", status)
      formData.append("paymentStatus", fd.paymentStatus || "Unpaid")
      formData.append("insuranceTaken", String(fd.insuranceTaken || false))

      if (fd.startDate) {
        formData.append("startDate", new Date(fd.startDate).toISOString())
      }

      if (fd.endDate) {
        formData.append("endDate", new Date(fd.endDate).toISOString())
      }

      formData.append("price", String(fd.price || 0))
      formData.append("dayByDayItineraryNeeded", String(fd.dayByDayItineraryNeeded))
      formData.append("adultsCount", String(fd.adultsCount || 0))
      formData.append("childrenCount", String(fd.childrenCount || 0))

      // B) Append itinerary data
      const itineraryData = {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        itinerarySteps: convertWizardItineraryToSteps(formState.itinerary, fd.dayByDayItineraryNeeded),
      }
      formData.append("itinerary", JSON.stringify(itineraryData))

      // C) Append editRequestJson as a backup
      formData.append(
        "editRequestJson",
        JSON.stringify(finalData), // We'll parse it on the .NET side
      )

      // D) Append newly added images
      formState.images.forEach((file) => {
        formData.append("NewImages", file)
      })

      // E) Append newly added documents
      formState.documents.forEach((file) => {
        formData.append("NewDocuments", file)
      })

      // F) Append IDs of images to delete
      imagesToDelete.forEach((id) => {
        formData.append("ImagesToDelete", id)
      })

      // G) Append IDs of documents to delete
      documentsToDelete.forEach((id) => {
        formData.append("DocumentsToDelete", id)
      })

      // 3) Send PUT
      const resp = await axios.put(`${API_URL}/client-trips/${tripId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      if (resp.status >= 200 && resp.status < 300) {
        setSnackbar({
          open: true,
          message: "Kelionė sėkmingai atnaujinta!",
          severity: "success",
        })
        setTimeout(() => navigate(`/trips/${tripId}`), 1500)
      } else {
        setSnackbar({
          open: true,
          message: `Nepavyko atnaujinti kelionės (HTTP ${resp.status}).`,
          severity: "error",
        })
        // Set saving state to false on error
        setIsSaving(false)
      }
    } catch (err) {
      console.error(err)
      setSnackbar({
        open: true,
        message: "Nepavyko atnaujinti kelionės (server error).",
        severity: "error",
      })
      // Set saving state to false on error
      setIsSaving(false)
    }
  }

  // "Flatten" the wizard data into your typical request body
  function buildFinalData(status: "Draft" | "Confirmed"): CreateTripRequest {
    const fd = formState.tripData
    return {
      agentId: null,
      clientId: fd.clientId || null,
      tripName: fd.tripName || null,
      description: fd.description || null,
      category: fd.category || null,
      status: status,
      paymentStatus: fd.paymentStatus || "Unpaid",
      insuranceTaken: fd.insuranceTaken || false,
      startDate: fd.startDate ? new Date(fd.startDate) : null,
      endDate: fd.endDate ? new Date(fd.endDate) : null,
      price: fd.price ? Number(fd.price) : null,
      dayByDayItineraryNeeded: fd.dayByDayItineraryNeeded,
      adultsCount: fd.adultsCount || 0,
      childrenCount: fd.childrenCount || 0,
      itinerary: {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        itinerarySteps: convertWizardItineraryToSteps(formState.itinerary, fd.dayByDayItineraryNeeded),
      },
    }
  }

  // Reuse your existing logic to flatten wizard itinerary -> steps
  function convertWizardItineraryToSteps(wizardItinerary: ItineraryDay[], dayByDay: boolean) {
    return wizardItinerary.map((dayObj, idx) => {
      const dayNumber = dayByDay ? idx + 1 : null
      // separate events by type, etc.
      // same approach from your existing code
      const transports = dayObj.events
        .filter((e) => e.type === "transport" || e.type === "cruise")
        .map((t: any) => ({
          transportType: t.type === "cruise" ? TransportType.Cruise : t.transportType || null,
          departureTime: t.departureTime || null,
          arrivalTime: t.arrivalTime || null,
          departurePlace: t.departurePlace || null,
          arrivalPlace: t.arrivalPlace || null,
          description: t.description || null,
          companyName: t.companyName || null,
          transportName: t.transportName || null,
          transportCode: t.transportCode || null,
          cabinType: t.cabinType || null,
        }))
      const accommodations = dayObj.events
        .filter((e) => e.type === "accommodation")
        .map((a: any) => ({
          hotelName: a.hotelName || null,
          hotelLink: a.hotelLink || null,
          checkIn: a.checkIn || null,
          checkOut: a.checkOut || null,
          description: a.description || null,
          boardBasis: a.boardBasis || null,
          roomType: a.roomType || null,
        }))
      const activities = dayObj.events
        .filter((e) => e.type === "activity")
        .map((act: any) => ({
          description: act.description || null,
          activityTime: act.activityTime || null,
        }))

      return {
        dayNumber,
        description: dayObj.dayDescription || null,
        transports,
        accommodations,
        activities,
      }
    })
  }

  // ---------------- VALIDATION UTILS ----------------
  function isEventValid(event: TripEvent): boolean {
    // same logic as your code
    switch (event.type) {
      case "transport":
      case "cruise":
        return !!(event.departureTime && event.arrivalTime && event.departurePlace && event.arrivalPlace)
      case "accommodation":
        return !!(event.hotelName && event.checkIn && event.checkOut)
      case "activity":
        return !!(event.activityTime && event.description)
      default:
        return true
    }
  }

  function getEventTypeName(type: string): string {
    switch (type) {
      case "transport":
        return "Transportas"
      case "accommodation":
        return "Nakvynė"
      case "activity":
        return "Veikla"
      case "cruise":
        return "Kruizas"
      default:
        return "Įvykis"
    }
  }

  function validateTrip(
    tripData: TripFormData,
    itinerary: ItineraryDay[],
    isConfirmed: boolean,
  ): { isValid: boolean; warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = []

    if (isConfirmed) {
      if (!tripData.tripName || !tripData.clientId || !tripData.startDate || !tripData.endDate || !tripData.category) {
        setSnackbar({
          open: true,
          message: "Prašome užpildyti laukus: pavadinimas, klientas, datos, kategorija.",
          severity: "error",
        })
        return { isValid: false, warnings }
      }
      if (!tripData.adultsCount && !tripData.childrenCount) {
        setSnackbar({
          open: true,
          message: "Prašome nurodyti bent vieną keliautoją (suaugusį ar vaiką).",
          severity: "error",
        })
        return { isValid: false, warnings }
      }
      // Validate each event
      for (const day of itinerary) {
        for (const event of day.events) {
          if (!isEventValid(event)) {
            setSnackbar({
              open: true,
              message: "Visi įvykiai turi būti pilnai užpildyti prieš patvirtinant kelionę.",
              severity: "error",
            })
            return { isValid: false, warnings }
          }
        }
      }
    }

    // Optional warnings (accommodation < 24h, only kids traveling, event overlaps, etc.)
    // same logic you already have

    return { isValid: true, warnings }
  }

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%", py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Redaguoti kelionę
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* STEP 0: Trip Info */}
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              currentItinerary={formState.itinerary}
              onSubmit={(updatedData, updatedItinerary) => {
                setFormState((prev) => ({
                  ...prev,
                  tripData: updatedData,
                  itinerary: updatedItinerary,
                }))
                handleNext()
              }}
            />
          )}

          {/* STEP 1: Itinerary */}
          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={(updatedItinerary) => {
                // run partial validation
                const validationResult = validateTrip(formState.tripData, updatedItinerary, false)
                setFormState((prev) => ({
                  ...prev,
                  itinerary: updatedItinerary,
                  validationWarnings: validationResult.warnings,
                }))
                handleNext()
              }}
              onBack={handleBack}
            />
          )}

          {/* STEP 2: Files - Using the unified component */}
          {activeStep === 2 && (
            <UnifiedFileUploadStep
              initialImages={formState.images}
              initialDocuments={formState.documents}
              existingImages={existingImages}
              existingDocuments={existingDocuments}
              onSubmit={handleFileUploadsSubmit}
              onBack={handleBack}
              isEditMode={true}
            />
          )}

          {/* STEP 3: Review & confirm */}
          {activeStep === 3 && (
            <Step3ReviewConfirm
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              validationWarnings={formState.validationWarnings}
              onBack={handleBack}
              onConfirm={() => handleSaveTrip("Confirmed")}
              onSaveDraft={() => handleSaveTrip("Draft")}
              isSaving={isSaving}
            />
          )}
        </Paper>

        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Box>
    </LocalizationProvider>
  )
}

export default WizardEditForm

