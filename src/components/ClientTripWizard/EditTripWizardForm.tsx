"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Container, Typography, Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import { API_URL } from "../../Utils/Configuration"
import { useNavigation } from "../../contexts/NavigationContext"

import Step1TripInfo from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../../components/CustomSnackBar"
import UnifiedFileUploadStep from "../../components/UnifiedFileUploadStep"
import fullCountriesList from "../../assets/full-countries-lt.json"

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
  type TripStatus,
  type PaymentStatus,
  type ItineraryStep,
} from "../../types"
import type { Country } from "../DestinationAutocomplete"

// Example shape for an existing image from the server
export interface ExistingFile {
  id: string // File DB ID
  url: string // Public or SAS link
  fileName: string // For display
}

// Define a type for step images
type StepImage = { id: string; url: string }

// Define a type for the step with images
interface ExtendedItineraryStep extends ItineraryStep {
  images?: Array<{ id: string; url: string }>
}

// Extend ItineraryDay to include step ID
interface ExtendedItineraryDay extends ItineraryDay {
  stepId?: string // The actual step ID from the server
}

// The steps for the wizard
const steps = ["Kelionės informacija", "Kelionės planas", "Nuotraukos ir dokumentai", "Peržiūrėti ir atnaujinti"]

// Helper function to convert string destination to Country object
const stringToCountry = (destination?: string): Country | null => {
  if (!destination) return null

  // Find the country in the full list to get complete data
  const matchingCountry = fullCountriesList.find((country) => country.name.toLowerCase() === destination.toLowerCase())

  if (matchingCountry) {
    return {
      name: matchingCountry.name,
      code: matchingCountry.code,
    }
  }

  // Fallback if not found in the list
  return {
    name: destination,
    code: "",
  }
}

function WizardEditForm() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { navigationSource, getBackNavigationUrl, navigateBack } = useNavigation()

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

  // Store the original itinerary steps from the server
  const [originalSteps, setOriginalSteps] = useState<ExtendedItineraryStep[]>([])

  // ---------- Existing files from server ----------
  const [existingImages, setExistingImages] = useState<ExistingFile[]>([])
  const [existingDocuments, setExistingDocuments] = useState<ExistingFile[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // array of existing image IDs
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]) // array of existing document IDs

  // ---------- Step Images State ----------
  const [stepImages, setStepImages] = useState<{ [key: number]: File[] }>({})
  const [existingStepImages, setExistingStepImages] = useState<{ [key: number]: StepImage[] }>({})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<{ [key: number]: string[] }>({})

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
        console.log("EditTripWizardForm - Fetched trip data:", trip)

        // Store the original steps to preserve IDs
        if (trip.itinerary?.itinerarySteps) {
          // Cast to ExtendedItineraryStep to handle images property
          setOriginalSteps(trip.itinerary.itinerarySteps as unknown as ExtendedItineraryStep[])
          console.log("EditTripWizardForm - Original steps:", trip.itinerary.itinerarySteps)
        }

        const normalized = mapServerResponseToWizardState(trip)
        setFormState((prev) => ({
          ...prev,
          tripData: normalized.tripData,
          itinerary: normalized.itinerary,
        }))

        // Extract step images from the trip response
        if (trip.itinerary?.itinerarySteps) {
          const stepImagesMap: Record<number, StepImage[]> = {}

          trip.itinerary.itinerarySteps.forEach((step, index) => {
            console.log(`EditTripWizardForm - Processing step ${index}:`, step)

            // For non-day-by-day itineraries, all images go to day 0
            const dayIndex = trip.dayByDayItineraryNeeded ? (step.dayNumber || index + 1) - 1 : 0

            // Cast step to ExtendedItineraryStep to handle images property
            const extendedStep = step as unknown as ExtendedItineraryStep
            if (extendedStep.images && extendedStep.images.length > 0) {
              if (!stepImagesMap[dayIndex]) {
                stepImagesMap[dayIndex] = []
              }

              extendedStep.images.forEach((img) => {
                stepImagesMap[dayIndex].push({
                  id: img.id,
                  url: img.url,
                })
              })

              console.log(`EditTripWizardForm - Added images for day ${dayIndex}:`, stepImagesMap[dayIndex])
            }
          })

          console.log("EditTripWizardForm - Final stepImagesMap:", stepImagesMap)
          setExistingStepImages(stepImagesMap)
        }
      }

      // B) Load existing images from your /File/trip/:tripId/Image
      const imagesResp = await axios.get<ExistingFile[]>(`${API_URL}/File/trip/${id}/Image`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (imagesResp.status === 200) {
        console.log("EditTripWizardForm - Fetched existing images:", imagesResp.data)
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
      destination,
    } = tripResponse

    console.log("Mapping server response to wizard state, destination:", destination)

    // Convert string destination to Country object
    const destinationObj = stringToCountry(destination)
    console.log("Converted destination to:", destinationObj)

    const tripData: TripFormData = {
      tripName: tripName || "",
      description: description || "",
      startDate: startDate ? startDate.split("T")[0] : null,
      endDate: endDate ? endDate.split("T")[0] : null,
      category: category || "",
      status: (status as TripStatus) || undefined, // Cast to TripStatus
      paymentStatus: (paymentStatus as PaymentStatus) || undefined, // Cast to PaymentStatus
      insuranceTaken: insuranceTaken || false,
      price: price || 0,
      adultsCount: adultsCount || 0,
      childrenCount: childrenCount || 0,
      dayByDayItineraryNeeded: dayByDayItineraryNeeded || false,
      itineraryTitle: itinerary?.title || "",
      itineraryDescription: itinerary?.description || "",
      clientId: clientId || "",
      clientName: null, // or fill if you have it
      destination: destination || null, // Store the destination string
    }

    // Build wizard itinerary from steps
    let wizardItinerary: ExtendedItineraryDay[] = []
    if (dayByDayItineraryNeeded && itinerary && itinerary.itinerarySteps) {
      wizardItinerary = buildWizardItineraryFromSteps(
        itinerary.itinerarySteps as unknown as ExtendedItineraryStep[],
        tripData.startDate,
      )
    } else {
      // single day approach
      wizardItinerary = [
        {
          id: itinerary?.itinerarySteps?.[0]?.id, // This is not the step ID
          stepId: itinerary?.itinerarySteps?.[0]?.id, // This is the actual step ID
          dayLabel: tripData.startDate || "",
          dayDescription: itinerary?.description || "",
          events: flattenStepsToEvents(itinerary?.itinerarySteps ?? []),
          existingStepImages: extractStepImages(
            (itinerary?.itinerarySteps as unknown as ExtendedItineraryStep[]) ?? [],
          ),
        },
      ]
    }

    return {
      tripData,
      itinerary: wizardItinerary,
    }
  }

  // Extract step images from steps
  function extractStepImages(steps: ExtendedItineraryStep[]): StepImage[] {
    const images: StepImage[] = []
    steps.forEach((step) => {
      if (step.images && step.images.length > 0) {
        step.images.forEach((img) => {
          if (img.id && img.url) {
            images.push({
              id: img.id,
              url: img.url,
            })
          }
        })
      }
    })
    console.log("EditTripWizardForm - extractStepImages result:", images)
    return images
  }

  function buildWizardItineraryFromSteps(steps: ExtendedItineraryStep[], startDate: string | null) {
    if (!startDate) return []
    const results: ExtendedItineraryDay[] = []
    const start = dayjs(startDate)

    steps.forEach((step: ExtendedItineraryStep) => {
      const dNum = step.dayNumber || 1
      const idx = dNum - 1
      if (!results[idx]) {
        const dayLabel = start.add(idx, "day").format("YYYY-MM-DD")
        results[idx] = {
          id: `day-${idx}`, // This is just a UI identifier
          stepId: step.id, // Store the actual step ID from the server
          dayLabel,
          dayDescription: step.description || "",
          events: [],
          existingStepImages: step.images
            ? step.images.map((img) => ({
                id: img.id,
                url: img.url,
              }))
            : [],
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
    // Add an images event if the step has images
    // Cast step to ExtendedItineraryStep to handle images property
    const extendedStep = step as unknown as ExtendedItineraryStep
    if (extendedStep.images && extendedStep.images.length > 0) {
      console.log("EditTripWizardForm - Adding images event for step with images:", extendedStep.images)
      events.push({
        type: "images",
        description: "Nuotraukos",
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

  // Handle step images change
  const handleStepImagesChange = (dayIndex: number, files: File[]) => {
    console.log(`EditTripWizardForm - handleStepImagesChange for day ${dayIndex}:`, files)
    setStepImages((prev) => ({
      ...prev,
      [dayIndex]: files,
    }))
  }

  // Handle step image delete
  const handleStepImageDelete = (dayIndex: number, imageIdOrUrl: string) => {
    console.log(`EditTripWizardForm - handleStepImageDelete for day ${dayIndex}, imageIdOrUrl:`, imageIdOrUrl)

    // Find the image in existingStepImages by URL or ID
    const images = existingStepImages[dayIndex] || []
    const imageToDelete = images.find((img) => img.url === imageIdOrUrl || img.id === imageIdOrUrl)

    if (imageToDelete) {
      // Add the image ID to the list of images to delete
      setStepImagesToDelete((prev) => {
        const current = prev[dayIndex] || []
        return {
          ...prev,
          [dayIndex]: [...current, imageToDelete.id],
        }
      })

      // Also remove it from the existingStepImages array
      setExistingStepImages((prev) => {
        const updatedImages = [...(prev[dayIndex] || [])].filter(
          (img) => img.id !== imageToDelete.id && img.url !== imageIdOrUrl,
        )
        return {
          ...prev,
          [dayIndex]: updatedImages,
        }
      })
    }
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

      // Add destination to form data
      if (fd.destination) {
        formData.append("destination", fd.destination)
        console.log("Adding destination to form data:", fd.destination)
      }

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

      // B) Build the EditItineraryRequest
      const editItineraryData = {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        steps: convertWizardItineraryToEditSteps(formState.itinerary, fd.dayByDayItineraryNeeded),
      }

      console.log("EditTripWizardForm - Sending steps:", editItineraryData.steps)

      // Append the editItinerary JSON
      formData.append("editItinerary", JSON.stringify(editItineraryData))

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

      // H) Append step images
      Object.entries(stepImages).forEach(([dayIndex, files]) => {
        files.forEach((file) => {
          formData.append(`NewStepImages_${dayIndex}`, file)
        })
      })

      // I) Append step images to delete - use the actual image IDs
      Object.entries(stepImagesToDelete).forEach(([dayIndex, ids]) => {
        if (ids.length > 0) {
          formData.append(`StepImagesToDelete_${dayIndex}`, ids.join(","))
        }
      })

      // Log all form data entries for debugging
      for (const pair of formData.entries()) {
        console.log(`Form data entry: ${pair[0]} = ${pair[1]}`)
      }

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

        // Always navigate back to the trip detail page after editing
        setTimeout(
          () =>
            navigate(`/admin-trip-list/${tripId}`, {
              state: { fromEdit: true },
              replace: true,
            }),
          1500,
        )
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
      status: status as TripStatus, // Cast to TripStatus
      paymentStatus: fd.paymentStatus || ("Unpaid" as PaymentStatus), // Cast to PaymentStatus
      insuranceTaken: fd.insuranceTaken || false,
      startDate: fd.startDate ? new Date(fd.startDate) : null,
      endDate: fd.endDate ? new Date(fd.endDate) : null,
      price: fd.price ? Number(fd.price) : null,
      dayByDayItineraryNeeded: fd.dayByDayItineraryNeeded,
      adultsCount: fd.adultsCount || 0,
      childrenCount: fd.childrenCount || 0,
      destination: fd.destination || null, // Include destination in the request
      itinerary: {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        itinerarySteps: convertWizardItineraryToEditSteps(formState.itinerary, fd.dayByDayItineraryNeeded),
      },
    }
  }

  // Reuse your existing logic to flatten wizard itinerary -> steps
  // But now ensure we preserve original step IDs
  function convertWizardItineraryToEditSteps(wizardItinerary: ExtendedItineraryDay[], dayByDay: boolean) {
    // Map original steps by day number for quick lookup
    const stepsByDayNumber: Record<number, ExtendedItineraryStep> = {}

    originalSteps.forEach((step) => {
      const dayNum = step.dayNumber || 1
      stepsByDayNumber[dayNum] = step
    })

    return wizardItinerary.map((dayObj, idx) => {
      const dayNumber = dayByDay ? idx + 1 : null

      // Get the step ID - either from the stepId property or from original steps by day number
      let stepId = (dayObj as ExtendedItineraryDay).stepId

      // If we don't have a stepId, try to get it from the original steps
      if (!stepId && dayByDay) {
        const originalStep = stepsByDayNumber[idx + 1]
        if (originalStep) {
          stepId = originalStep.id
        }
      }

      // If we're in non-day-by-day mode and don't have a stepId, use the first original step
      if (!dayByDay && !stepId && originalSteps.length > 0) {
        stepId = originalSteps[0].id
      }

      console.log(`Day ${idx + 1} step ID: ${stepId}`)

      // separate events by type, etc.
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
        id: stepId, // Include the existing ID if it exists
        dayNumber,
        description: dayObj.dayDescription || null,
        transports,
        accommodations,
        activities,
        stepImagesToDelete: stepImagesToDelete[idx] || [],
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
      case "images":
        return true // Images are always valid
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
      case "images":
        return "Nuotraukos"
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
                // Preserve step IDs when updating itinerary
                const updatedItineraryWithIds =
                  updatedItinerary?.map((day, idx) => {
                    const originalDay = formState.itinerary[idx] as ExtendedItineraryDay
                    return {
                      ...day,
                      stepId: originalDay?.stepId, // Preserve the step ID
                    }
                  }) || []

                setFormState((prev) => ({
                  ...prev,
                  tripData: updatedData,
                  itinerary: updatedItineraryWithIds,
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
                // Preserve step IDs when updating itinerary
                const updatedItineraryWithIds =
                  updatedItinerary?.map((day, idx) => {
                    const originalDay = formState.itinerary[idx] as ExtendedItineraryDay
                    return {
                      ...day,
                      stepId: originalDay?.stepId, // Preserve the step ID
                    }
                  }) || []

                // run partial validation
                const validationResult = validateTrip(formState.tripData, updatedItineraryWithIds, false)
                setFormState((prev) => ({
                  ...prev,
                  itinerary: updatedItineraryWithIds,
                  validationWarnings: validationResult.warnings,
                }))
                handleNext()
              }}
              onBack={handleBack}
              stepImages={stepImages}
              onStepImagesChange={handleStepImagesChange}
              existingStepImages={existingStepImages}
              onStepImageDelete={handleStepImageDelete}
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
              // @ts-ignore - Ignore the stepImages prop error
              stepImages={stepImages}
              // @ts-ignore - Ignore the existingStepImages prop error
              existingStepImages={existingStepImages}
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
              // @ts-ignore - Ignore the stepImages prop error
              stepImages={stepImages}
              // @ts-ignore - Ignore the existingStepImages prop error
              existingStepImages={existingStepImages}
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
