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

        if (trip.itinerary?.itinerarySteps) {
          setOriginalSteps(trip.itinerary.itinerarySteps as unknown as ExtendedItineraryStep[])
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
            const dayIndex = trip.dayByDayItineraryNeeded ? (step.dayNumber || index + 1) - 1 : 0

            const extendedStep = step as unknown as ExtendedItineraryStep

            if (extendedStep.images && extendedStep.images.length > 0) {
              if (!stepImagesMap[dayIndex]) {
                stepImagesMap[dayIndex] = []
              }

              extendedStep.images.forEach((img) => {
                const imageUrl = img.urlInline || img.url || ""

                if (imageUrl) {
                  stepImagesMap[dayIndex].push({
                    id: img.id,
                    url: imageUrl,
                  })
                }
              })
            }
          })

          if (trip.itinerary?.sortedEvents) {
            trip.itinerary.sortedEvents.forEach((event) => {
              if (event.images && event.images.length > 0) {
                const dayIndex = trip.dayByDayItineraryNeeded ? event.stepDayNumber || 0 : 0

                if (!stepImagesMap[dayIndex]) {
                  stepImagesMap[dayIndex] = []
                }

                event.images.forEach((img) => {
                  const imageUrl = img.urlInline || img.url || ""

                  if (imageUrl) {
                    stepImagesMap[dayIndex].push({
                      id: img.id,
                      url: imageUrl,
                    })
                  }
                })
              }
            })
          }

          Object.keys(stepImagesMap).forEach((dayIndex) => {
            const dayIndexNum = Number.parseInt(dayIndex)
            stepImagesMap[dayIndexNum] = deduplicateImages(stepImagesMap[dayIndexNum])
          })

          setExistingStepImages(stepImagesMap)

          window.globalExistingStepImages = stepImagesMap
        }
      }

      const imagesResp = await axios.get<ExistingFile[]>(`${API_URL}/File/trip/${id}/Image`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (imagesResp.status === 200) {
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

    const destinationObj = stringToCountry(destination)

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

    steps.forEach((step) => {
      if (step.images && step.images.length > 0) {
        step.images.forEach((img) => {
          if (img.id) {
            const imageUrl = img.urlInline || img.url || ""

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
          return false
        }

        isSavingRef.current = true
        setIsSaving(true)

        const result = await handleSaveTrip("Draft", destination)

        isSavingRef.current = false

        return result
      } catch (error) {
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
    setStepImages((prev) => ({
      ...prev,
      [dayIndex]: files,
    }))

    window.globalStepImages = {
      ...window.globalStepImages,
      [dayIndex]: files,
    }
  }

  const handleStepImageDelete = (dayIndex: number, imageIdOrUrl: string) => {
    const images = existingStepImages[dayIndex] || []
    const imageToDelete = images.find((img) => img.url === imageIdOrUrl || img.id === imageIdOrUrl)

    if (imageToDelete) {
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
    }
  }

  async function handleSaveTrip(status: "Draft" | "Confirmed", destination?: string | null): Promise<boolean> {
    const latestTripData = getCurrentFormData()
    const latestItinerary = getCurrentItineraryData()
    const latestFileData = getCurrentFileData()
    const latestStepImagesData = getCurrentStepImagesData()

    setFormState((prev) => ({
      ...prev,
      tripData: latestTripData || prev.tripData,
      itinerary: latestItinerary || prev.itinerary,
      images: latestFileData?.newImages || prev.images,
      documents: latestFileData?.newDocuments || prev.documents,
    }))

    if (latestFileData?.imagesToDelete) {
      setImagesToDelete(latestFileData.imagesToDelete)
    }

    if (latestFileData?.documentsToDelete) {
      setDocumentsToDelete(latestFileData.documentsToDelete)
    }

    if (latestStepImagesData?.stepImages) {
      setStepImages(latestStepImagesData.stepImages)
    }

    if (latestStepImagesData?.stepImagesToDelete) {
      setStepImagesToDelete(latestStepImagesData.stepImagesToDelete)
    }

    const currentTripData = latestTripData || formState.tripData
    const currentItinerary = latestItinerary || formState.itinerary

    const validationResult = validateTrip(currentTripData, currentItinerary, status === "Confirmed")
    if (!validationResult.isValid) {
      return false
    }
    setFormState((prev) => ({
      ...prev,
      validationWarnings: validationResult.warnings,
    }))

    setIsSaving(true)

    try {
      const finalData = buildFinalData(status, currentTripData, currentItinerary)

      const formData = new FormData()

      const fd = currentTripData
      formData.append("clientId", fd.clientId || "")
      formData.append("tripName", fd.tripName || "")
      formData.append("description", fd.description || "")
      formData.append("category", fd.category || "")
      formData.append("status", status)
      formData.append("paymentStatus", fd.paymentStatus || "Unpaid")
      formData.append("insuranceTaken", String(fd.insuranceTaken || false))

      if (fd.destination) {
        formData.append("destination", fd.destination)
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

      const editItineraryData = {
        title: fd.itineraryTitle || "",
        description: fd.itineraryDescription || "",
        steps: convertWizardItineraryToEditSteps(currentItinerary, fd.dayByDayItineraryNeeded),
      }

      formData.append("editItinerary", JSON.stringify(editItineraryData))

      formData.append("editRequestJson", JSON.stringify(finalData))

      const currentImages = latestFileData?.newImages || formState.images
      const currentDocuments = latestFileData?.newDocuments || formState.documents
      const currentImagesToDelete = latestFileData?.imagesToDelete || imagesToDelete
      const currentDocumentsToDelete = latestFileData?.documentsToDelete || documentsToDelete

      const currentStepImages = latestStepImagesData?.stepImages || window.globalStepImages || stepImages
      const currentStepImagesToDelete =
        latestStepImagesData?.stepImagesToDelete || window.globalStepImagesToDelete || stepImagesToDelete

      currentImages.forEach((file) => {
        formData.append("NewImages", file)
      })

      currentDocuments.forEach((file) => {
        formData.append("NewDocuments", file)
      })

      const allImagesToDelete = [...currentImagesToDelete]

      if (window.globalImagesToDelete && window.globalImagesToDelete.length > 0) {
        window.globalImagesToDelete.forEach((id) => {
          if (!allImagesToDelete.includes(id)) {
            allImagesToDelete.push(id)
          }
        })
      }

      allImagesToDelete.forEach((id) => {
        formData.append("ImagesToDelete", id)
      })

      const allDocumentsToDelete = [...currentDocumentsToDelete]

      if (window.globalDocumentsToDelete && window.globalDocumentsToDelete.length > 0) {
        window.globalDocumentsToDelete.forEach((id) => {
          if (!allDocumentsToDelete.includes(id)) {
            allDocumentsToDelete.push(id)
          }
        })
      }

      allDocumentsToDelete.forEach((id) => {
        formData.append("DocumentsToDelete", id)
      })

      Object.entries(currentStepImages).forEach(([dayIndex, files]) => {
        if (files && files.length > 0) {
          files.forEach((file) => {
            formData.append(`NewStepImages_${dayIndex}`, file)
          })
        }
      })

      Object.entries(currentStepImagesToDelete).forEach(([dayIndex, imageIds]) => {
        if (imageIds && imageIds.length > 0) {
          imageIds.forEach((imageId) => {
            formData.append(`StepImagesToDelete_${dayIndex}`, imageId)
          })
        }
      })

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

        if (destination) {
          setTimeout(() => navigate(destination), 1500)
        } else {
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
        setIsSaving(false)
        return false
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Nepavyko atnaujinti kelionės (server error).",
        severity: "error",
      })
      setIsSaving(false)
      return false
    }
  }

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

  function convertWizardItineraryToEditSteps(wizardItinerary: ExtendedItineraryDay[], dayByDay: boolean) {
    const stepsByDayNumber: Record<number, ExtendedItineraryStep> = {}

    originalSteps.forEach((step) => {
      const dayNum = step.dayNumber || 1
      stepsByDayNumber[dayNum] = step
    })

    return wizardItinerary.map((dayObj, idx) => {
      const dayNumber = dayByDay ? idx + 1 : null

      let stepId = (dayObj as ExtendedItineraryDay).stepId

      if (!stepId && dayByDay) {
        const originalStep = stepsByDayNumber[idx + 1]
        if (originalStep) {
          stepId = originalStep.id
        }
      }

      if (!dayByDay && !stepId && originalSteps.length > 0) {
        stepId = originalSteps[0].id
      }

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
        return true 
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
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              currentItinerary={formState.itinerary}
              onSubmit={(updatedData, updatedItinerary) => {
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

          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={(updatedItinerary) => {
                const updatedItineraryWithIds =
                  updatedItinerary?.map((day, idx) => {
                    const originalDay = formState.itinerary[idx] as ExtendedItineraryDay
                    return {
                      ...day,
                      stepId: originalDay?.stepId,
                    }
                  }) || []

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
