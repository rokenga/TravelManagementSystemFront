"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Container, Typography, Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import { API_URL } from "../../Utils/Configuration"
import { useNavigation } from "../../contexts/NavigationContext"

import Step1TripInfo from "./Step1TripInfo"
import { getCurrentFormData } from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import { getCurrentItineraryData, getCurrentStepImagesData } from "./Step2Itinerary"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../../components/CustomSnackBar"
import UnifiedFileUploadStep from "../../components/UnifiedFileUploadStep"
import fullCountriesList from "../../assets/full-countries-lt.json"

import { getCurrentFileData } from "../UnifiedFileUploadStep"
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

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

export interface ExistingFile {
  id: string
  url: string
  fileName: string
}

type StepImage = { id: string; url: string; urlInline?: string }

interface ExtendedItineraryStep extends ItineraryStep {
  images?: Array<{ id: string; url: string; urlInline?: string }>
}

interface ExtendedItineraryDay extends ItineraryDay {
  stepId?: string
}

const steps = ["Kelionės informacija", "Kelionės planas", "Nuotraukos ir dokumentai", "Peržiūrėti ir atnaujinti"]

const stringToCountry = (destination?: string): Country | null => {
  if (!destination) return null

  const matchingCountry = fullCountriesList.find((country) => country.name.toLowerCase() === destination.toLowerCase())

  if (matchingCountry) {
    return {
      name: matchingCountry.name,
      code: matchingCountry.code,
    }
  }

  return {
    name: destination,
    code: "",
  }
}

declare global {
  interface Window {
    saveEditFormAsDraft?: (destination?: string | null) => Promise<boolean>
    globalImagesToDelete?: string[]
    globalDocumentsToDelete?: string[]
    globalStepImages?: { [key: number]: File[] }
    globalExistingStepImages?: { [key: number]: Array<{ id: string; url: string; urlInline?: string }> }
    globalStepImagesToDelete?: { [key: number]: string[] }
  }
}

function deduplicateImages(images: StepImage[]): StepImage[] {
  const uniqueImages: StepImage[] = []
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()

  images.forEach((img) => {
    if (img.id && seenIds.has(img.id)) return
    if (img.url && seenUrls.has(img.url)) return

    if (img.id) seenIds.add(img.id)
    if (img.url) seenUrls.add(img.url)

    uniqueImages.push(img)
  })

  return uniqueImages
}

function WizardEditForm({ onDataChange }) {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { navigationSource, getBackNavigationUrl, navigateBack } = useNavigation()

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  const [formState, setFormState] = useState<WizardFormState>({
    tripData: {} as TripFormData,
    itinerary: [],
    validationWarnings: [],
    images: [],
    documents: [],
  })

  const [originalSteps, setOriginalSteps] = useState<ExtendedItineraryStep[]>([])

  const [existingImages, setExistingImages] = useState<ExistingFile[]>([])
  const [existingDocuments, setExistingDocuments] = useState<ExistingFile[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([])

  const [stepImages, setStepImages] = useState<{ [key: number]: File[] }>({})
  const [existingStepImages, setExistingStepImages] = useState<{ [key: number]: StepImage[] }>({})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<{ [key: number]: string[] }>({})

  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)

  function clearGlobalFileState() {
    window.__currentFileData = null
    window.globalImagesToDelete = []
    window.globalDocumentsToDelete = []
    window.globalStepImages = {}
    window.globalExistingStepImages = {}
    window.globalStepImagesToDelete = {}

    console.log("EditTripWizardForm - Cleared all global file state")
  }

  useEffect(() => {
    clearGlobalFileState()

    return () => {
      clearGlobalFileState()
    }
  }, [tripId])

  useEffect(() => {
    if (!tripId) return
    fetchTripData(tripId)
  }, [tripId])

  // Initialize global state for step images
  useEffect(() => {
    window.globalStepImages = stepImages
    window.globalExistingStepImages = existingStepImages
    window.globalStepImagesToDelete = stepImagesToDelete
  }, [stepImages, existingStepImages, stepImagesToDelete])

  async function fetchTripData(id: string) {
    try {
      const response = await axios.get<TripResponse>(`${API_URL}/client-trips/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (response.status === 200) {
        const trip = response.data
        console.log("EditTripWizardForm - Fetched trip data:", trip)

        if (trip.itinerary?.itinerarySteps) {
          setOriginalSteps(trip.itinerary.itinerarySteps as unknown as ExtendedItineraryStep[])
          console.log("EditTripWizardForm - Original steps:", trip.itinerary.itinerarySteps)
        }

        const normalized = mapServerResponseToWizardState(trip)
        setFormState((prev) => ({
          ...prev,
          tripData: normalized.tripData,
          itinerary: normalized.itinerary,
        }))

        if (trip.itinerary?.itinerarySteps) {
          const stepImagesMap: Record<number, StepImage[]> = {}

          trip.itinerary.itinerarySteps.forEach((step, index) => {
            console.log(`EditTripWizardForm - Processing step ${index}:`, step)

            const dayIndex = trip.dayByDayItineraryNeeded ? (step.dayNumber || index + 1) - 1 : 0

            const extendedStep = step as unknown as ExtendedItineraryStep

            console.log(`EditTripWizardForm - Step ${index} images:`, extendedStep.images)

            if (extendedStep.images && extendedStep.images.length > 0) {
              if (!stepImagesMap[dayIndex]) {
                stepImagesMap[dayIndex] = []
              }

              extendedStep.images.forEach((img) => {
                const imageUrl = img.urlInline || img.url || ""
                console.log(`EditTripWizardForm - Image data:`, img)
                console.log(`EditTripWizardForm - Using image URL:`, imageUrl)

                if (imageUrl) {
                  stepImagesMap[dayIndex].push({
                    id: img.id,
                    url: imageUrl,
                  })
                }
              })

              console.log(`EditTripWizardForm - Added images for day ${dayIndex}:`, stepImagesMap[dayIndex])
            }
          })

          if (trip.itinerary?.sortedEvents) {
            console.log("EditTripWizardForm - Processing sortedEvents:", trip.itinerary.sortedEvents)

            trip.itinerary.sortedEvents.forEach((event) => {
              if (event.images && event.images.length > 0) {
                console.log("EditTripWizardForm - Found images in sortedEvent:", event.images)

                const dayIndex = trip.dayByDayItineraryNeeded ? event.stepDayNumber || 0 : 0

                if (!stepImagesMap[dayIndex]) {
                  stepImagesMap[dayIndex] = []
                }

                event.images.forEach((img) => {
                  const imageUrl = img.urlInline || img.url || ""
                  console.log(`EditTripWizardForm - Adding image from sortedEvent: id=${img.id}, url=${imageUrl}`)

                  if (imageUrl) {
                    stepImagesMap[dayIndex].push({
                      id: img.id,
                      url: imageUrl,
                    })
                  }
                })

                console.log(
                  `EditTripWizardForm - Updated images for day ${dayIndex} from sortedEvents:`,
                  stepImagesMap[dayIndex],
                )
              }
            })
          }

          Object.keys(stepImagesMap).forEach((dayIndex) => {
            const dayIndexNum = Number.parseInt(dayIndex)
            stepImagesMap[dayIndexNum] = deduplicateImages(stepImagesMap[dayIndexNum])
          })

          console.log("EditTripWizardForm - Final stepImagesMap after deduplication:", stepImagesMap)
          setExistingStepImages(stepImagesMap)

          // Initialize global state with existing step images
          window.globalExistingStepImages = stepImagesMap
        }
      }

      const imagesResp = await axios.get<ExistingFile[]>(`${API_URL}/File/trip/${id}/Image`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (imagesResp.status === 200) {
        console.log("EditTripWizardForm - Fetched existing images:", imagesResp.data)
        setExistingImages(imagesResp.data)
      }

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

    const destinationObj = stringToCountry(destination)
    console.log("Converted destination to:", destinationObj)

    const tripData: TripFormData = {
      tripName: tripName || "",
      description: description || "",
      startDate: startDate ? startDate.split("T")[0] : null,
      endDate: endDate ? endDate.split("T")[0] : null,
      category: category || "",
      status: (status as TripStatus) || undefined,
      paymentStatus: (paymentStatus as PaymentStatus) || undefined,
      insuranceTaken: insuranceTaken || false,
      price: price || 0,
      adultsCount: adultsCount || 0,
      childrenCount: childrenCount || 0,
      dayByDayItineraryNeeded: dayByDayItineraryNeeded || false,
      itineraryTitle: itinerary?.title || "",
      itineraryDescription: itinerary?.description || "",
      clientId: clientId || "",
      clientName: null,
      destination: destination || null,
    }

    let wizardItinerary: ExtendedItineraryDay[] = []
    if (dayByDayItineraryNeeded && itinerary && itinerary.itinerarySteps) {
      wizardItinerary = buildWizardItineraryFromSteps(
        itinerary.itinerarySteps as unknown as ExtendedItineraryStep[],
        tripData.startDate,
      )
    } else {
      wizardItinerary = [
        {
          id: itinerary?.itinerarySteps?.[0]?.id,
          stepId: itinerary?.itinerarySteps?.[0]?.id,
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

  function extractStepImages(steps: ExtendedItineraryStep[]): StepImage[] {
    const images: StepImage[] = []
    console.log("EditTripWizardForm - extractStepImages input steps:", steps)

    steps.forEach((step) => {
      if (step.images && step.images.length > 0) {
        console.log(`EditTripWizardForm - Processing step images:`, step.images)

        step.images.forEach((img) => {
          if (img.id) {
            const imageUrl = img.urlInline || img.url || ""
            console.log(`EditTripWizardForm - Adding image with id ${img.id}, url: ${imageUrl}`)

            if (imageUrl) {
              images.push({
                id: img.id,
                url: imageUrl,
              })
            }
          }
        })
      }
    })

    const uniqueImages = deduplicateImages(images)

    console.log("EditTripWizardForm - extractStepImages result after deduplication:", uniqueImages)
    return uniqueImages
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

        const stepImages = step.images
          ? step.images
              .map((img) => ({
                id: img.id,
                url: img.urlInline || img.url || "",
              }))
              .filter((img) => !!img.url)
          : []

        const uniqueStepImages = deduplicateImages(stepImages)

        results[idx] = {
          id: `day-${idx}`,
          stepId: step.id,
          dayLabel,
          dayDescription: step.description || "",
          events: [],
          existingStepImages: uniqueStepImages,
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
          starRating: a.starRating || null,
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

  useEffect(() => {
    window.saveEditFormAsDraft = async (destination?: string | null) => {
      try {
        if (isSavingRef.current) {
          console.log("Save operation already in progress, skipping duplicate call")
          return false
        }

        isSavingRef.current = true
        setIsSaving(true)

        const result = await handleSaveTrip("Draft", destination)

        isSavingRef.current = false

        return result
      } catch (error) {
        console.error("Error saving draft:", error)
        setSnackbar({
          open: true,
          message: "Nepavyko išsaugoti juodraščio. Bandykite dar kartą.",
          severity: "error",
        })
        setIsSaving(false)
        isSavingRef.current = false
        return false
      }
    }

    return () => {
      delete window.saveEditFormAsDraft
    }
  }, [formState])

  const handleStep1DataChange = (hasData) => {
    if (onDataChange) onDataChange(hasData)
  }

  const handleStep2DataChange = () => {
    if (onDataChange) onDataChange(true)
  }

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

  const handleFileUploadsSubmit = (
    newImages: File[],
    newDocuments: File[],
    imagesToDeleteIds?: string[],
    documentsToDeleteIds?: string[],
  ) => {
    setFormState((prev) => ({
      ...prev,
      images: newImages,
      documents: newDocuments,
    }))

    if (imagesToDeleteIds) {
      setImagesToDelete(imagesToDeleteIds)
    }
    if (documentsToDeleteIds) {
      setDocumentsToDelete(documentsToDeleteIds)
    }

    handleNext()
  }

  const handleStepImagesChange = (dayIndex: number, files: File[]) => {
    console.log(`EditTripWizardForm - handleStepImagesChange for day ${dayIndex}:`, files)
    setStepImages((prev) => ({
      ...prev,
      [dayIndex]: files,
    }))

    // Update global state
    window.globalStepImages = {
      ...window.globalStepImages,
      [dayIndex]: files,
    }
  }

  const handleStepImageDelete = (dayIndex: number, imageIdOrUrl: string) => {
    console.log(`EditTripWizardForm - handleStepImageDelete for day ${dayIndex}, imageIdOrUrl:`, imageIdOrUrl)

    const images = existingStepImages[dayIndex] || []
    const imageToDelete = images.find((img) => img.url === imageIdOrUrl || img.id === imageIdOrUrl)

    if (imageToDelete) {
      console.log(`Found image to delete:`, imageToDelete)

      setStepImagesToDelete((prev) => {
        const current = prev[dayIndex] || []
        return {
          ...prev,
          [dayIndex]: [...current, imageToDelete.id],
        }
      })

      setExistingStepImages((prev) => {
        const updatedImages = [...(prev[dayIndex] || [])].filter(
          (img) => img.id !== imageToDelete.id && img.url !== imageIdOrUrl,
        )
        return {
          ...prev,
          [dayIndex]: updatedImages,
        }
      })

      // Update global state
      window.globalStepImagesToDelete = {
        ...window.globalStepImagesToDelete,
        [dayIndex]: [...(window.globalStepImagesToDelete?.[dayIndex] || []), imageToDelete.id],
      }

      window.globalExistingStepImages = {
        ...window.globalExistingStepImages,
        [dayIndex]: [...(window.globalExistingStepImages?.[dayIndex] || [])].filter(
          (img) => img.id !== imageToDelete.id && img.url !== imageIdOrUrl,
        ),
      }
    } else {
      console.warn(`Could not find image with ID or URL: ${imageIdOrUrl} in day ${dayIndex}`)
    }
  }

  async function handleSaveTrip(status: "Draft" | "Confirmed", destination?: string | null): Promise<boolean> {
    // Get the most up-to-date form data directly from the Step1TripInfo component
    const latestTripData = getCurrentFormData()
    console.log("Getting latest trip data for save:", latestTripData)

    // Get the most up-to-date itinerary data directly from the Step2Itinerary component
    const latestItinerary = getCurrentItineraryData()
    console.log("Getting latest itinerary data for save:", latestItinerary)

    // Get the most up-to-date file data from the UnifiedFileUploadStep component
    const latestFileData = getCurrentFileData()
    console.log("Getting latest file data for save:", latestFileData)

    // Get the most up-to-date step images data from the Step2Itinerary component
    const latestStepImagesData = getCurrentStepImagesData()
    console.log("Getting latest step images data for save:", latestStepImagesData)

    // Update the formState with the latest data
    setFormState((prev) => ({
      ...prev,
      tripData: latestTripData || prev.tripData,
      itinerary: latestItinerary || prev.itinerary,
      images: latestFileData?.newImages || prev.images,
      documents: latestFileData?.newDocuments || prev.documents,
    }))

    // Update image deletion lists if available
    if (latestFileData?.imagesToDelete) {
      setImagesToDelete(latestFileData.imagesToDelete)
    }

    if (latestFileData?.documentsToDelete) {
      setDocumentsToDelete(latestFileData.documentsToDelete)
    }

    // Update step images if available
    if (latestStepImagesData?.stepImages) {
      setStepImages(latestStepImagesData.stepImages)
    }

    if (latestStepImagesData?.stepImagesToDelete) {
      setStepImagesToDelete(latestStepImagesData.stepImagesToDelete)
    }

    // Use the latest data or fall back to the current state
    const currentTripData = latestTripData || formState.tripData
    const currentItinerary = latestItinerary || formState.itinerary

    // Basic validation from Step2
    const validationResult = validateTrip(currentTripData, currentItinerary, status === "Confirmed")
    if (!validationResult.isValid) {
      return false
    }
    setFormState((prev) => ({
      ...prev,
      validationWarnings: validationResult.warnings,
    }))

    // Set saving state to true when starting the save operation
    setIsSaving(true)

    try {
      // 1) Build a normal request body for everything except images
      const finalData = buildFinalData(status, currentTripData, currentItinerary)

      // 2) We'll pass images in a FormData
      const formData = new FormData()

      // A) Append top-level trip data to FormData
      const fd = currentTripData
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
        steps: convertWizardItineraryToEditSteps(currentItinerary, fd.dayByDayItineraryNeeded),
      }

      console.log("EditTripWizardForm - Sending steps:", editItineraryData.steps)

      // Append the editItinerary JSON
      formData.append("editItinerary", JSON.stringify(editItineraryData))

      // C) Append editRequestJson as a backup
      formData.append("editRequestJson", JSON.stringify(finalData))

      // Use the latest file data for the request
      const currentImages = latestFileData?.newImages || formState.images
      const currentDocuments = latestFileData?.newDocuments || formState.documents
      const currentImagesToDelete = latestFileData?.imagesToDelete || imagesToDelete
      const currentDocumentsToDelete = latestFileData?.documentsToDelete || documentsToDelete

      // Use the latest step images data or fall back to global state
      const currentStepImages = latestStepImagesData?.stepImages || window.globalStepImages || stepImages
      const currentStepImagesToDelete =
        latestStepImagesData?.stepImagesToDelete || window.globalStepImagesToDelete || stepImagesToDelete

      // Log what we're sending to the server for debugging
      console.log("EditTripWizardForm - Sending to server:", {
        newImages: currentImages.length,
        newDocuments: currentDocuments.length,
        imagesToDelete: currentImagesToDelete,
        documentsToDelete: currentDocumentsToDelete,
        stepImages: Object.keys(currentStepImages).length,
        stepImagesToDelete: Object.keys(currentStepImagesToDelete).length,
      })

      // D) Append newly added images
      currentImages.forEach((file) => {
        formData.append("NewImages", file)
      })

      // E) Append newly added documents
      currentDocuments.forEach((file) => {
        formData.append("NewDocuments", file)
      })

      // F) Append IDs of images to delete - ensure we get all deleted images from all sources
      const allImagesToDelete = [...currentImagesToDelete]

      // Also check global variables for any additional deleted images
      if (window.globalImagesToDelete && window.globalImagesToDelete.length > 0) {
        // Add any IDs that aren't already in the array
        window.globalImagesToDelete.forEach((id) => {
          if (!allImagesToDelete.includes(id)) {
            allImagesToDelete.push(id)
          }
        })
      }

      console.log("EditTripWizardForm - All images to delete:", allImagesToDelete)

      allImagesToDelete.forEach((id) => {
        formData.append("ImagesToDelete", id)
      })

      // G) Append IDs of documents to delete - ensure we get all deleted documents from all sources
      const allDocumentsToDelete = [...currentDocumentsToDelete]

      // Also check global variables for any additional deleted documents
      if (window.globalDocumentsToDelete && window.globalDocumentsToDelete.length > 0) {
        // Add any IDs that aren't already in the array
        window.globalDocumentsToDelete.forEach((id) => {
          if (!allDocumentsToDelete.includes(id)) {
            allDocumentsToDelete.push(id)
          }
        })
      }

      console.log("EditTripWizardForm - All documents to delete:", allDocumentsToDelete)

      allDocumentsToDelete.forEach((id) => {
        formData.append("DocumentsToDelete", id)
      })

      // H) Append step images to FormData - FIX: Use NewStepImages_{dayIndex} instead of StepImages_{dayIndex}
      Object.entries(currentStepImages).forEach(([dayIndex, files]) => {
        if (files && files.length > 0) {
          files.forEach((file) => {
            // Use the correct parameter name that the backend expects
            formData.append(`NewStepImages_${dayIndex}`, file)
            console.log(`Appending step image for day ${dayIndex}:`, file.name)
          })
        }
      })

      // I) Append step images to delete
      Object.entries(currentStepImagesToDelete).forEach(([dayIndex, imageIds]) => {
        if (imageIds && imageIds.length > 0) {
          imageIds.forEach((imageId) => {
            formData.append(`StepImagesToDelete_${dayIndex}`, imageId)
            console.log(`Appending step image to delete for day ${dayIndex}:`, imageId)
          })
        }
      })

      // Log all form data entries for debugging
      for (const pair of formData.entries()) {
        console.log(`Form data entry: ${pair[0]} = ${pair[1]}`)
      }

      // Send PUT
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

        // Navigate based on destination parameter
        if (destination) {
          // If we have a specific destination, navigate there
          setTimeout(() => navigate(destination), 1500)
        } else {
          // Otherwise, navigate back to the trip detail page
          setTimeout(
            () =>
              navigate(`/admin-trip-list/${tripId}`, {
                state: { fromEdit: true },
                replace: true,
              }),
            1500,
          )
        }
        return true
      } else {
        setSnackbar({
          open: true,
          message: `Nepavyko atnaujinti kelionės (HTTP ${resp.status}).`,
          severity: "error",
        })
        // Set saving state to false on error
        setIsSaving(false)
        return false
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
      return false
    }
  }

  // "Flatten" the wizard data into your typical request body
  function buildFinalData(
    status: "Draft" | "Confirmed",
    tripData: TripFormData,
    itinerary: ItineraryDay[],
  ): CreateTripRequest {
    const fd = tripData
    return {
      agentId: null,
      clientId: fd.clientId || null,
      tripName: fd.tripName || null,
      description: fd.description || null,
      category: fd.category || null,
      status: status as TripStatus,
      paymentStatus: fd.paymentStatus || ("Unpaid" as PaymentStatus),
      insuranceTaken: fd.insuranceTaken || false,
      startDate: fd.startDate ? new Date(fd.startDate) : null,
      endDate: fd.endDate ? new Date(fd.endDate) : null,
      price: fd.price ? Number(fd.price) : null,
      dayByDayItineraryNeeded: fd.dayByDayItineraryNeeded,
      adultsCount: fd.adultsCount || 0,
      childrenCount: fd.childrenCount || 0,
      destination: fd.destination || null,
      itinerary: {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        itinerarySteps: convertWizardItineraryToEditSteps(itinerary, fd.dayByDayItineraryNeeded),
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
        .map((a: any) => {
          // Convert numeric star rating to enum string before saving
          const starRatingEnum = typeof a.starRating === "number" ? numberToStarRatingEnum(a.starRating) : a.starRating

          return {
            hotelName: a.hotelName || null,
            hotelLink: a.hotelLink || null,
            checkIn: a.checkIn || null,
            checkOut: a.checkOut || null,
            description: a.description || null,
            boardBasis: a.boardBasis || null,
            roomType: a.roomType || null,
            starRating: starRatingEnum,
          }
        })
      const activities = dayObj.events
        .filter((e) => e.type === "activity")
        .map((act: any) => ({
          description: act.description || null,
          activityTime: act.activityTime || null,
        }))

      return {
        id: stepId,
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

    return { isValid: true, warnings }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%", py: 4 }} data-wizard-form="true">
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
                      stepId: originalDay?.stepId,
                    }
                  }) || []

                setFormState((prev) => ({
                  ...prev,
                  tripData: updatedData,
                  itinerary: updatedItineraryWithIds,
                }))
                handleNext()
              }}
              onDataChange={handleStep1DataChange}
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
                      stepId: originalDay?.stepId,
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
                handleStep2DataChange()
              }}
              onBack={handleBack}
              stepImages={stepImages}
              onStepImagesChange={(dayIndex, files) => {
                handleStepImagesChange(dayIndex, files)
                handleStep2DataChange()
              }}
              existingStepImages={existingStepImages}
              onStepImageDelete={(dayIndex, imageId) => {
                handleStepImageDelete(dayIndex, imageId)
                handleStep2DataChange()
              }}
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
              tripId={tripId}
              stepImages={stepImages}
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
              stepImages={stepImages}
              existingStepImages={existingStepImages}
              existingTripImages={existingImages}
              existingTripDocuments={existingDocuments}
              tripId={tripId}
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
