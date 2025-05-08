"use client"

import { useState, useEffect, useRef } from "react"
import { Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import { useNavigate } from "react-router-dom"
import Step1TripInfo from "./Step1TripInfo"
import { getCurrentFormData } from "./Step1TripInfo" // Import the function to get current form data
import Step2Itinerary from "./Step2Itinerary"
import { getCurrentItineraryData, getCurrentStepImagesData } from "./Step2Itinerary" // Import the function to get current itinerary data
import Step2_5FileUploads from "./Step2_5FileUploads"
import { getCurrentFileData } from "./Step2_5FileUploads" // Import the function to get current file data
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

// Add these lines at the top of your file, after the imports
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

  // Reference to track if we're currently in the save process
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

  // Clear localStorage when starting a new trip
  useEffect(() => {
    localStorage.removeItem("nonDayByDayDescription")
  }, [])

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  // Add state for step images
  const [stepImages, setStepImages] = useState<{ [key: number]: File[] }>({})

  useEffect(() => {
    console.log("Current formState:", formState)
  }, [formState])

  // Add this effect to track changes
  useEffect(() => {
    // Find the window.saveCreateFormAsDraft function and update it to accept a destination parameter
    window.saveCreateFormAsDraft = async (destination?: string | null) => {
      try {
        // Prevent multiple simultaneous save operations
        if (isSavingRef.current) {
          console.log("Save operation already in progress, skipping duplicate call")
          return false
        }

        isSavingRef.current = true
        setIsSaving(true)

        // Use your existing handleSaveTrip function with the destination
        const result = await handleSaveTrip("Draft", destination)

        // Reset the saving flag when done
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

    // Clean up the global function when component unmounts
    return () => {
      delete window.saveCreateFormAsDraft
    }
  }, [formState]) // Add all dependencies that handleSaveTrip needs

  const handleNext = () => setActiveStep((prev: number) => prev + 1)
  const handleBack = () => {
    setActiveStep((prev: number) => prev - 1)
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleStep1Submit = (updatedData: TripFormData, updatedItinerary: ItineraryDay[] = []) => {
    console.log("Step 1 Submit - Client ID:", updatedData.clientId, "Type:", typeof updatedData.clientId)

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

    setTimeout(() => {
      console.log(
        "After state update - formState.tripData.clientId:",
        formState.tripData.clientId,
        "Type:",
        typeof formState.tripData.clientId,
      )
    }, 0)

    handleNext()
  }

  const handleStep2Submit = (itinerary: ItineraryDay[]) => {
    // Only validate for warnings, not for required fields when moving to next step
    const validationResult = validateTrip(formState.tripData, itinerary, false)

    setFormState((prev) => ({
      ...prev,
      itinerary,
      validationWarnings: validationResult.warnings,
    }))

    // Always allow moving to next step, even if there are warnings
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

  // Add a function to update step images
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
        // For image events, we only need to check if there are images for that day
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

      // Only validate event completeness when confirming the trip
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
    // Get the most up-to-date form data directly from the Step1TripInfo component
    const latestTripData = getCurrentFormData()
    console.log("Getting latest trip data for save:", latestTripData)

    // Get the most up-to-date itinerary data directly from the Step2Itinerary component
    const latestItinerary = getCurrentItineraryData()
    console.log("Getting latest itinerary data for save:", latestItinerary)

    // Get the most up-to-date file data from the Step2_5FileUploads component
    const latestFileData = getCurrentFileData()
    console.log("Getting latest file data for save:", latestFileData)

    // Get the most up-to-date step images data from the Step2Itinerary component
    const latestStepImagesData = getCurrentStepImagesData()
    console.log("Getting latest step images data for save:", latestStepImagesData)

    // Use the latest data or fall back to the current state
    const currentTripData = latestTripData || formState.tripData
    const currentItinerary = latestItinerary || formState.itinerary
    const currentImages = latestFileData?.images || formState.images
    const currentDocuments = latestFileData?.documents || formState.documents
    const currentStepImages = latestStepImagesData?.stepImages || stepImages

    // Update the formState with the latest data
    setFormState((prev) => ({
      ...prev,
      tripData: currentTripData,
      itinerary: currentItinerary,
      images: currentImages,
      documents: currentDocuments,
    }))

    // Update step images if available
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
      console.log("Final clientId before API call:", clientId, "Type:", typeof clientId)

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

      // Handle itinerary steps and their images
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
            // Convert numeric star rating to enum string before saving
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
              starRating: starRatingEnum, // Add this line to include star rating
            }
          }),
          activities: activityEvents.map((act) => ({
            description: act.description || null,
            activityTime: act.activityTime || null,
          })),
        }

        itinerarySteps.push(step)

        // Append step images to FormData
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

      console.log("Formatted itinerary data for server:", JSON.stringify(itineraryData, null, 2))

      formData.append("itinerary", JSON.stringify(itineraryData))

      currentImages.forEach((file) => {
        formData.append("Images", file)
      })

      currentDocuments.forEach((file) => {
        formData.append("Documents", file)
      })

      console.log("Sending trip data to server...")

      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }

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

        // If we have a specific destination, navigate there
        if (destination) {
          setTimeout(() => navigate(destination), 1500)
        } else if (tripId) {
          // Otherwise, navigate to the trip detail page
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
      console.error("Error saving trip:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko išsaugoti kelionės (server error).",
        severity: "error",
      })
      setIsSaving(false)
      return false
    }
  }

  // Function to handle data changes in Step1
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
