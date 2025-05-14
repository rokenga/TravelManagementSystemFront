"use client"

import { useState, useEffect, useRef } from "react"
import { Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import { useNavigate } from "react-router-dom"
import Step1TripInfo from "./Step1TripInfo"
import { getCurrentFormData } from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import { getCurrentItineraryData, getCurrentStepImagesData } from "./Step2Itinerary"
import Step2_5FileUploads from "./Step2_5FileUploads"
import { getCurrentFileData } from "./Step2_5FileUploads"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../CustomSnackBar"
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

import {
  type TripFormData,
  type ItineraryDay,
  type ValidationWarning,
  type TripEvent,
  type TransportEvent,
  type WizardFormState,
  TransportType,
  type TripStatus,
  type SnackbarState,
} from "../../types"

declare global {
  interface Window {
    saveCreateFormAsDraft?: (destination?: string | null) => Promise<boolean>
  }
}

const steps = ["Kelionės informacija", "Kelionės planas", "Dokumentai ir nuotraukos", "Peržiūrėti ir pateikti"]

function buildDateRange(startStr: string, endStr: string) {
  const result: { dayLabel: string; dayDescription: string; events: any[] }[] = []
  if (!startStr || !startStr) return result

  const startDate = new Date(startStr)
  const endDate = new Date(endStr)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return result
  if (endDate < startDate) return result

  let current = startDate
  while (current <= endDate) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, "0")
    const d = String(current.getDate()).padStart(2, "0")
    result.push({
      dayLabel: `${y}-${m}-${d}`,
      dayDescription: "",
      events: [],
    })
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }
  return result
}

function mergeItinerary(
  oldDays: { dayLabel: string; dayDescription: string; events: any[] }[],
  newStart: string,
  newEnd: string,
) {
  const newRange = buildDateRange(newStart, newEnd)
  const merged = newRange.map((newDay) => {
    const existing = oldDays.find((o) => o.dayLabel === newDay.dayLabel)
    return existing ? { ...existing } : newDay
  })
  return merged
}

const WizardForm = ({ onDataChange }) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [hideValidationHighlighting, setHideValidationHighlighting] = useState(false)

  const isSavingRef = useRef(false)

  const [formState, setFormState] = useState<WizardFormState>({
    tripData: {
      tripName: "",
      description: "",
      startDate: null,
      endDate: null,
      clientId: "",
      clientName: null,
      insuranceTaken: false,
      price: 0,
      adultsCount: null,
      childrenCount: null,
      category: "",
      status: "Draft" as TripStatus,
      dayByDayItineraryNeeded: false,
      itineraryTitle: "",
      itineraryDescription: "",
      destination: "",
    },
    itinerary: [],
    validationWarnings: [],
    images: [],
    documents: [],
  })

  useEffect(() => {
    localStorage.removeItem("nonDayByDayDescription")
  }, [])

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  const [stepImages, setStepImages] = useState<{ [key: number]: File[] }>({})

  useEffect(() => {
    window.saveCreateFormAsDraft = async (destination?: string | null) => {
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
      delete window.saveCreateFormAsDraft
    }
  }, [formState])

  const handleNext = () => setActiveStep((prev: number) => prev + 1)
  const handleBack = () => {
    setActiveStep((prev: number) => prev - 1)
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleStep1Submit = (updatedData: TripFormData, updatedItinerary: ItineraryDay[] = []) => {
    const clientId = updatedData.clientId ? String(updatedData.clientId) : ""

    setFormState((prev) => {
      return {
        ...prev,
        tripData: {
          ...updatedData,
          clientId: clientId,
        },
        itinerary: updatedItinerary.length > 0 ? updatedItinerary : prev.itinerary,
      }
    })

    handleNext()
  }

  const handleStep2Submit = (itinerary: ItineraryDay[]) => {
    const validationResult = validateTrip(formState.tripData, itinerary, false)

    setFormState((prev) => ({
      ...prev,
      itinerary,
      validationWarnings: validationResult.warnings,
    }))

    handleNext()
  }

  const handleFileUploadsSubmit = (images: File[], documents: File[]) => {
    setFormState((prev) => ({
      ...prev,
      images,
      documents,
      tripData: {
        ...prev.tripData,
        images,
        documents,
      },
    }))

    handleNext()
  }

  const handleStepImagesChange = (dayIndex: number, files: File[]) => {
    setStepImages((prev) => ({
      ...prev,
      [dayIndex]: files,
    }))
  }

  const isEventValid = (event: TripEvent): boolean => {
    switch (event.type) {
      case "transport":
      case "cruise":
        return !!(event.departureTime && event.arrivalTime && event.departurePlace && event.arrivalPlace)
      case "accommodation":
        return !!(event.hotelName && event.checkIn && event.checkOut)
      case "activity":
        return !!(event.activityTime && event.description)
      case "images":
        const dayIndex = formState.itinerary.findIndex((day) => day.events.some((e) => e === event))
        return !!(stepImages[dayIndex] && stepImages[dayIndex].length > 0)
      default:
        return true
    }
  }

  const validateTrip = (
    tripData: any,
    itinerary: any[],
    isConfirmed: boolean,
  ): { isValid: boolean; warnings: ValidationWarning[] } => {
    const warnings: ValidationWarning[] = []

    if (isConfirmed) {
      if (!tripData.tripName || !tripData.clientId || !tripData.startDate || !tripData.endDate || !tripData.category) {
        setSnackbar({
          open: true,
          message: "Prašome užpildyti visus privalomus laukus: kelionės pavadinimą, klientą, datas ir kategoriją.",
          severity: "error",
        })
        return { isValid: false, warnings }
      }

      if (!tripData.adultsCount && !tripData.childrenCount) {
        setSnackbar({
          open: true,
          message: "Prašome nurodyti bent vieną keliautoją (suaugusį arba vaiką).",
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

    for (const day of itinerary) {
      for (const event of day.events) {
        if (event.type === "accommodation" && event.checkIn && event.checkOut) {
          const checkInDate = new Date(event.checkIn)
          const checkOutDate = new Date(event.checkOut)
          const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

          if (durationHours < 24) {
            warnings.push({
              message: `Nakvynė "${event.hotelName || "be pavadinimo"}" trunka mažiau nei vieną dieną (${Math.round(durationHours)} val.)`,
              type: "warning",
            })
          }
        }
      }
    }

    if (tripData.childrenCount > 0 && tripData.adultsCount === 0) {
      warnings.push({
        message: "Keliauja tik vaikai be suaugusiųjų. Ar tai teisinga?",
        type: "warning",
      })
    }

    const eventsByDay: Record<string, Array<{ event: any; start: Date; end: Date }>> = {}

    for (const day of itinerary) {
      const dayLabel = day.dayLabel
      if (!eventsByDay[dayLabel]) {
        eventsByDay[dayLabel] = []
      }

      for (const event of day.events) {
        let startTime: Date | null = null
        let endTime: Date | null = null

        if (event.type === "transport" || event.type === "cruise") {
          if (event.departureTime) startTime = new Date(event.departureTime)
          if (event.arrivalTime) endTime = new Date(event.arrivalTime)
        } else if (event.type === "accommodation") {
          if (event.checkIn) startTime = new Date(event.checkIn)
          if (event.checkOut) endTime = new Date(event.checkOut)
        } else if (event.type === "activity") {
          if (event.activityTime) {
            startTime = new Date(event.activityTime)
            endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
          }
        }

        if (startTime && endTime) {
          eventsByDay[dayLabel].push({
            event,
            start: startTime,
            end: endTime,
          })
        }
      }
    }

    for (const dayLabel in eventsByDay) {
      const dayEvents = eventsByDay[dayLabel]
      let hasOverlappingEvents = false

      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const event1 = dayEvents[i]
          const event2 = dayEvents[j]

          if (
            (event1.start <= event2.end && event1.end >= event2.start) ||
            (event2.start <= event1.end && event2.end >= event1.start)
          ) {
            hasOverlappingEvents = true
            break
          }
        }
        if (hasOverlappingEvents) break
      }

      if (hasOverlappingEvents) {
        warnings.push({
          message: `Dieną ${dayLabel} yra persidengenčių įvykių.`,
          type: "warning",
        })
      }
    }

    if (!tripData.tripName || tripData.tripName.trim() === "") {
      warnings.push({
        message: "Kelionė neturi pavadinimo.",
        type: "warning",
      })
    }

    let hasEvents = false
    for (const day of itinerary) {
      if (day.events.length > 0) {
        hasEvents = true
        break
      }
    }

    if (!hasEvents) {
      warnings.push({
        message: "Nieko nepridėjote į kelionės planą.",
        type: "info",
      })
    }

    if (!tripData.clientId || tripData.clientId.trim() === "") {
      warnings.push({
        message: "Nepasirinkote kliento.",
        type: "info",
      })
    }

    if (!tripData.category || tripData.category.trim() === "") {
      warnings.push({
        message: "Nepasirinkote kelionės kategorijos.",
        type: "info",
      })
    }

    if (tripData.price === 0) {
      warnings.push({
        message: "Kelionės kaina yra nulis",
        type: "info",
      })
    }

    return { isValid: true, warnings }
  }

  const getEventTypeName = (type: string): string => {
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

  const handleSaveTrip = async (status: "Draft" | "Confirmed", destination?: string | null): Promise<boolean> => {
    const latestTripData = getCurrentFormData()
    const latestItinerary = getCurrentItineraryData()
    const latestFileData = getCurrentFileData()
    const latestStepImagesData = getCurrentStepImagesData()

    const currentTripData = latestTripData || formState.tripData
    const currentItinerary = latestItinerary || formState.itinerary
    const currentImages = latestFileData?.images || formState.images
    const currentDocuments = latestFileData?.documents || formState.documents
    const currentStepImages = latestStepImagesData?.stepImages || stepImages

    setFormState((prev) => ({
      ...prev,
      tripData: currentTripData,
      itinerary: currentItinerary,
      images: currentImages,
      documents: currentDocuments,
    }))

    if (latestStepImagesData?.stepImages) {
      setStepImages(latestStepImagesData.stepImages)
    }

    setIsSaving(true)

    const validationResult = validateTrip(currentTripData, currentItinerary, status === "Confirmed")

    if (!validationResult.isValid) {
      setIsSaving(false)
      return false
    }

    setFormState((prev) => ({
      ...prev,
      validationWarnings: validationResult.warnings,
    }))

    try {
      const itineraryTitle = currentTripData.itineraryTitle || ""
      const itineraryDescription = currentTripData.itineraryDescription || ""

      const clientId = currentTripData.clientId ? String(currentTripData.clientId) : null

      const formData = new FormData()

      formData.append("clientId", clientId || "")
      formData.append("tripName", currentTripData.tripName || "")
      formData.append("description", currentTripData.description || "")
      formData.append("category", currentTripData.category || "")
      formData.append("status", status)
      formData.append("paymentStatus", "Unpaid")
      formData.append("insuranceTaken", String(currentTripData.insuranceTaken || false))
      formData.append("destination", currentTripData.destination || "")

      if (currentTripData.startDate) {
        formData.append("startDate", new Date(currentTripData.startDate).toISOString())
      }

      if (currentTripData.endDate) {
        formData.append("endDate", new Date(currentTripData.endDate).toISOString())
      }

      formData.append("price", String(currentTripData.price || 0))
      formData.append("dayByDayItineraryNeeded", String(currentTripData.dayByDayItineraryNeeded))
      formData.append("adultsCount", String(currentTripData.adultsCount || 0))
      formData.append("childrenCount", String(currentTripData.childrenCount || 0))

      const itinerarySteps = []
      for (let i = 0; i < currentItinerary.length; i++) {
        const day = currentItinerary[i]

        const transportEvents = day.events.filter((e) => e.type === "transport" || e.type === "cruise")
        const accommodationEvents = day.events.filter((e) => e.type === "accommodation")
        const activityEvents = day.events.filter((e) => e.type === "activity")

        const step = {
          dayNumber: currentTripData.dayByDayItineraryNeeded ? i + 1 : null,
          description: day.dayDescription || null,
          transports: transportEvents.map((e) => {
            const transportEvent = e as TransportEvent
            const finalTransportType = e.type === "cruise" ? TransportType.Cruise : transportEvent.transportType || null

            return {
              transportType: finalTransportType,
              departureTime: transportEvent.departureTime || null,
              arrivalTime: transportEvent.arrivalTime || null,
              departurePlace: transportEvent.departurePlace || null,
              arrivalPlace: transportEvent.arrivalPlace || null,
              description: e.description || null,
              companyName: transportEvent.companyName || null,
              transportName: transportEvent.transportName || null,
              transportCode: transportEvent.transportCode || null,
              cabinType: transportEvent.cabinType || null,
            }
          }),
          accommodations: accommodationEvents.map((a) => {
            const starRatingEnum =
              typeof a.starRating === "number" ? numberToStarRatingEnum(a.starRating) : a.starRating

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
          }),
          activities: activityEvents.map((act) => ({
            description: act.description || null,
            activityTime: act.activityTime || null,
          })),
        }

        itinerarySteps.push(step)

        if (currentStepImages[i] && currentStepImages[i].length > 0) {
          currentStepImages[i].forEach((file) => {
            formData.append(`StepImages_${i}`, file)
          })
        }
      }

      const itineraryData = {
        title: itineraryTitle,
        description: itineraryDescription,
        itinerarySteps: itinerarySteps,
      }

      formData.append("itinerary", JSON.stringify(itineraryData))

      currentImages.forEach((file) => {
        formData.append("Images", file)
      })

      currentDocuments.forEach((file) => {
        formData.append("Documents", file)
      })

      const response = await axios.post(`${API_URL}/client-trips`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (response.status >= 200 && response.status < 300) {
        const tripId = response.data.id || response.data.tripId
        setSnackbar({
          open: true,
          message: status === "Draft" ? "Kelionė išsaugota kaip juodraštis!" : "Kelionė sėkmingai patvirtinta!",
          severity: "success",
        })

        if (destination) {
          setTimeout(() => navigate(destination), 1500)
        } else if (tripId) {
          setTimeout(() => {
            navigate(`/admin-trip-list/${tripId}`)
          }, 1500)
        }

        return true
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko išsaugoti kelionės (HTTP status " + response.status + ").",
          severity: "error",
        })
        setIsSaving(false)
        return false
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Nepavyko išsaugoti kelionės (server error).",
        severity: "error",
      })
      setIsSaving(false)
      return false
    }
  }

  const handleStep1DataChange = (hasData) => {
    if (onDataChange) onDataChange(hasData)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }} data-wizard-form="true">
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 4 }} data-wizard-form="true">
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              onSubmit={handleStep1Submit}
              currentItinerary={formState.itinerary}
              data-wizard-navigation="true"
              onDataChange={handleStep1DataChange}
            />
          )}

          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              stepImages={stepImages}
              onStepImagesChange={handleStepImagesChange}
            />
          )}

          {activeStep === 2 && (
            <Step2_5FileUploads
              initialImages={formState.images}
              initialDocuments={formState.documents}
              onSubmit={handleFileUploadsSubmit}
              onBack={handleBack}
              data-wizard-navigation="true"
            />
          )}

          {activeStep === 3 && (
            <Step3ReviewConfirm
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onBack={handleBack}
              onConfirm={() => handleSaveTrip("Confirmed")}
              onSaveDraft={() => handleSaveTrip("Draft")}
              validationWarnings={formState.validationWarnings}
              isSaving={isSaving}
              hideHighlighting={hideValidationHighlighting}
              onHideHighlightingChange={setHideValidationHighlighting}
              stepImages={stepImages}
              data-wizard-navigation="true"
            />
          )}
        </Paper>
      </Box>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </LocalizationProvider>
  )
}

export default WizardForm
