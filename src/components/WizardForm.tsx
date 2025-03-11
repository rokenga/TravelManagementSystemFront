"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Stepper, Step, StepLabel, Paper, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { useNavigate } from "react-router-dom"
import Step1TripInfo from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import Step2_5FileUploads from "./Step2_5FileUploads"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../components/CustomSnackBar"

// Import types
import {
  type TripFormData,
  type ItineraryDay,
  type ValidationWarning,
  type TripEvent,
  type TransportEvent,
  type AccommodationEvent,
  type ActivityEvent,
  type SnackbarState,
  type WizardFormState,
  TransportType,
} from "../types"

// Steps for the wizard
const steps = ["Kelionės informacija", "Kelionės planas", "Dokumentai ir nuotraukos", "Peržiūrėti ir pateikti"]

/**
 * Helper: build array of days between two dates
 */
function buildDateRange(startStr: string, endStr: string) {
  const result: { dayLabel: string; dayDescription: string; events: any[] }[] = []
  if (!startStr || !endStr) return result

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

/**
 * Helper: merge old itinerary data with new day range
 */
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

/**
 * The main wizard form.
 */
const WizardForm: React.FC = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  // Data used across steps
  const [formState, setFormState] = useState<WizardFormState>(() => {
    // Get client info from URL if available
    const urlParams = new URLSearchParams(window.location.search)
    const clientId = urlParams.get("clientId")
    const clientName = urlParams.get("clientName")

    console.log("Initializing WizardForm with clientId:", clientId, "clientName:", clientName)

    return {
      tripData: {
        tripName: "",
        description: "",
        startDate: "",
        endDate: "",
        clientId: clientId || "", // <-- store clientId as a string, default to empty string
        clientName: clientName || "",
        insuranceTaken: false,
        price: 0,
        category: "",
        status: "Draft" as const, // Add as const to fix the type
        paymentStatus: "Unpaid" as const, // Add as const to fix the type
        dayByDayItineraryNeeded: false,
        adultsCount: 0,
        childrenCount: 0,
        itineraryTitle: "",
        itineraryDescription: "",
      },
      itinerary: [] as ItineraryDay[],
      validationWarnings: [] as ValidationWarning[],
      images: [] as File[],
      documents: [] as File[],
    }
  })

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  // Debug log to check formState
  useEffect(() => {
    console.log("Current formState:", formState)
  }, [formState])

  const handleNext = () => setActiveStep((prev: number) => prev + 1)
  const handleBack = () => {
    // When going back, preserve the current form state
    setActiveStep((prev: number) => prev - 1)
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  /**
   * Step 1 -> Step 2 callback
   * Merges the date range if day-by-day
   */
  const handleStep1Submit = (updatedData: TripFormData, updatedItinerary: ItineraryDay[] = []) => {
    console.log("Step 1 Submit - Client ID:", updatedData.clientId, "Type:", typeof updatedData.clientId)

    // Ensure clientId is a string and not empty
    const clientId = updatedData.clientId ? String(updatedData.clientId) : ""

    setFormState((prev) => {
      return {
        ...prev,
        tripData: {
          ...updatedData,
          clientId: clientId, // Explicitly set as string
        },
        itinerary: updatedItinerary.length > 0 ? updatedItinerary : prev.itinerary,
      }
    })

    // Debug log to verify state update
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

  /**
   * Step 2 -> Step 2.5 callback
   */
  const handleStep2Submit = (itinerary: ItineraryDay[]) => {
    // Run validation to get warnings
    const validationResult = validateTrip(formState.tripData, itinerary, false)

    // Update state with warnings and itinerary
    setFormState((prev) => ({
      ...prev,
      itinerary,
      validationWarnings: validationResult.warnings,
    }))

    handleNext()
  }

  /**
   * Step 2.5 -> Step 3 callback
   */
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

  /**
   * Minimal validation for final step
   */
  const isEventValid = (event: TripEvent): boolean => {
    switch (event.type) {
      case "transport":
      case "cruise":
        // These fields must be present if trip is "confirmed"
        return !!(
          (event.departureTime && event.arrivalTime && event.departurePlace && event.arrivalPlace)
          // transportType is also needed but if we have "cruise" we set "Cruise" etc.
        )
      case "accommodation":
        // Need at least hotelName, checkIn, checkOut
        return !!(event.hotelName && event.checkIn && event.checkOut)
      case "activity":
        return !!(event.activityTime && event.description)
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

    // Check for required fields if confirming
    if (isConfirmed) {
      // Basic required fields – if your server requires them to be non-null
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

      // Validate events
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

    // Non-blocking validations (warnings)

    // 1. Check if accommodation lasts less than one day
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

    // 2. Check if only children are traveling
    if (tripData.childrenCount > 0 && tripData.adultsCount === 0) {
      warnings.push({
        message: "Keliauja tik vaikai be suaugusiųjų. Ar tai teisinga?",
        type: "warning",
      })
    }

    // 3. Check for overlapping events
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
            // Assume activities last 1 hour if no end time
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

    // Check for overlaps within each day
    for (const dayLabel in eventsByDay) {
      const dayEvents = eventsByDay[dayLabel]

      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const event1 = dayEvents[i]
          const event2 = dayEvents[j]

          // Check if events overlap
          if (
            (event1.start <= event2.end && event1.end >= event2.start) ||
            (event2.start <= event1.end && event2.end >= event1.start)
          ) {
            const event1Type = getEventTypeName(event1.event.type)
            const event2Type = getEventTypeName(event2.event.type)

            warnings.push({
              message: `Dieną ${dayLabel} įvykiai persidengia: "${event1Type}" ir "${event2Type}". Ar tai teisinga?`,
              type: "warning",
            })

            // Only report one overlap per day to avoid too many warnings
            break
          }
        }
      }
    }

    // 4. Check if trip has no name
    if (!tripData.tripName || tripData.tripName.trim() === "") {
      warnings.push({
        message: "Kelionė neturi pavadinimo.",
        type: "warning",
      })
    }

    // 5. Check if there are no events
    let hasEvents = false
    for (const day of itinerary) {
      if (day.events.length > 0) {
        hasEvents = true
        break
      }
    }

    if (!hasEvents) {
      warnings.push({
        message: "Kelionėje nėra įvykių. Ar tikrai to norite?",
        type: "info",
      })
    }

    return { isValid: true, warnings }
  }

  // Add helper function to get human-readable event type names
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

  /**
   * Final save: either "Draft" or "Confirmed"
   */
  const handleSaveTrip = async (status: "Draft" | "Confirmed") => {
    // Check if all fields are valid (if "Confirmed")
    const validationResult = validateTrip(formState.tripData, formState.itinerary, status === "Confirmed")

    if (!validationResult.isValid) {
      return
    }

    // Store warnings in state to be passed to Step3ReviewConfirm
    setFormState((prev) => ({
      ...prev,
      validationWarnings: validationResult.warnings,
    }))

    try {
      const itineraryTitle = formState.tripData.itineraryTitle || ""
      const itineraryDescription = formState.tripData.itineraryDescription || ""

      // Ensure clientId is a string and not empty
      const clientId = formState.tripData.clientId ? String(formState.tripData.clientId) : null
      console.log("Final clientId before API call:", clientId, "Type:", typeof clientId)

      // Create a FormData object to handle file uploads
      const formData = new FormData()

      // Add basic trip data
      formData.append("clientId", clientId || "")
      formData.append("tripName", formState.tripData.tripName || "")
      formData.append("description", formState.tripData.description || "")
      formData.append("category", formState.tripData.category || "")
      formData.append("status", status)
      formData.append("paymentStatus", "Unpaid")
      formData.append("insuranceTaken", String(formState.tripData.insuranceTaken || false))

      if (formState.tripData.startDate) {
        formData.append("startDate", new Date(formState.tripData.startDate).toISOString())
      }

      if (formState.tripData.endDate) {
        formData.append("endDate", new Date(formState.tripData.endDate).toISOString())
      }

      formData.append("price", String(formState.tripData.price || 0))
      formData.append("dayByDayItineraryNeeded", String(formState.tripData.dayByDayItineraryNeeded))
      formData.append("adultsCount", String(formState.tripData.adultsCount || 0))
      formData.append("childrenCount", String(formState.tripData.childrenCount || 0))

      // Add itinerary data as JSON
      const itineraryData = {
        title: itineraryTitle,
        description: itineraryDescription,
        itinerarySteps: formState.itinerary.map((day, idx) => ({
          dayNumber: formState.tripData.dayByDayItineraryNeeded ? idx + 1 : null,
          description: day.dayDescription || null,

          // Combine "transport" and "cruise" events
          transports: day.events
            .filter((e) => e.type === "transport" || e.type === "cruise")
            .map((e) => {
              // Use type assertion to handle the union type
              const transportEvent = e as TransportEvent

              // If event is "cruise", we explicitly set the transportType to "Cruise"
              // Otherwise use the user-selected transportType, e.g. "Flight", "Bus", ...
              const finalTransportType =
                e.type === "cruise" ? TransportType.Cruise : transportEvent.transportType || null

              return {
                transportType: finalTransportType,
                departureTime: transportEvent.departureTime || null,
                arrivalTime: transportEvent.arrivalTime || null,
                departurePlace: transportEvent.departurePlace || null,
                arrivalPlace: transportEvent.arrivalPlace || null,
                description: e.description || null,

                // Additional new fields:
                companyName: transportEvent.companyName || null,
                transportName: transportEvent.transportName || null,
                transportCode: transportEvent.transportCode || null,
                cabinType: transportEvent.cabinType || null,
              }
            }),

          // ---------- ACCOMMODATION ----------
          accommodations: day.events
            .filter((e) => e.type === "accommodation")
            .map((e) => {
              // Use type assertion to handle the union type
              const accommodationEvent = e as AccommodationEvent

              return {
                hotelName: accommodationEvent.hotelName || null,
                checkIn: accommodationEvent.checkIn || null,
                checkOut: accommodationEvent.checkOut || null,
                hotelLink: accommodationEvent.hotelLink || null,
                description: e.description || null,

                // Additional new fields: make sure they match your C# enum names exactly
                boardBasis: accommodationEvent.boardBasis || null,
                roomType: accommodationEvent.roomType || null,
              }
            }),

          // ---------- ACTIVITIES ----------
          activities: day.events
            .filter((e) => e.type === "activity")
            .map((e) => {
              // Use type assertion to handle the union type
              const activityEvent = e as ActivityEvent

              return {
                description: e.description || null,
                activityTime: activityEvent.activityTime || null,
              }
            }),
        })),
      }

      formData.append("itinerary", JSON.stringify(itineraryData))

      // Add files
      formState.images.forEach((file) => {
        formData.append("Images", file)
      })

      formState.documents.forEach((file) => {
        formData.append("Documents", file)
      })

      console.log("Sending trip data to server...")

      // ---------- SEND REQUEST ----------
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

        // Redirect to the newly created trip page if ID is returned
        if (tripId) {
          setTimeout(() => {
            navigate(`/trips/${tripId}`)
          }, 1500)
        }
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko išsaugoti kelionės (HTTP status " + response.status + ").",
          severity: "error",
        })
      }
    } catch (error) {
      console.error("Error saving trip:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko išsaugoti kelionės (server error).",
        severity: "error",
      })
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* -------------- STEP 1 -------------- */}
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              onSubmit={handleStep1Submit}
              currentItinerary={formState.itinerary}
            />
          )}

          {/* -------------- STEP 2 -------------- */}
          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
            />
          )}

          {/* -------------- STEP 2.5 -------------- */}
          {activeStep === 2 && (
            <Step2_5FileUploads
              initialImages={formState.images}
              initialDocuments={formState.documents}
              onSubmit={handleFileUploadsSubmit}
              onBack={handleBack}
            />
          )}

          {/* -------------- STEP 3 -------------- */}
          {activeStep === 3 && (
            <Step3ReviewConfirm
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onBack={handleBack}
              onConfirm={() => handleSaveTrip("Confirmed")}
              onSaveDraft={() => handleSaveTrip("Draft")}
              validationWarnings={formState.validationWarnings}
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

