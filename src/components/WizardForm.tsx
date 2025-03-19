"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Stepper,
  Step,
  StepLabel,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material"
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
import { usePreventNavigation } from "../hooks/usePreventNavigation"

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
  const [isSaving, setIsSaving] = useState(false)

  // Navigation blocking state
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true)

  // Use our custom hook for navigation prevention
  const {
    showDialog: showNavigationDialog,
    handleStay,
    handleLeave,
    pendingLocation,
  } = usePreventNavigation(shouldBlockNavigation && activeStep < 3)

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

  // Handle "Leave" (save as draft and then leave)
  const handleLeaveWithSave = async () => {
    try {
      setIsSaving(true)
      // Get the current form data based on which step we're on
      let currentTripData = { ...formState.tripData }
      let currentItinerary = [...formState.itinerary]
      let currentImages = [...formState.images]
      let currentDocuments = [...formState.documents]

      // Step 1: Get the latest form data from Step1TripInfo
      if (activeStep === 0) {
        try {
          // Import the function to get the current form data
          const { getCurrentFormData } = await import("./Step1TripInfo")
          // Get the latest form data
          const latestFormData = getCurrentFormData()
          console.log("Got latest form data from Step1TripInfo:", latestFormData)

          // Only update if we got valid data
          if (latestFormData && latestFormData.tripName !== undefined) {
            currentTripData = latestFormData
          }
        } catch (error) {
          console.error("Error getting current form data from Step1:", error)
        }
      }

      // Step 2: Get the latest itinerary data and validate it
      if (activeStep === 1) {
        try {
          // Import the functions to get and validate the current itinerary data
          const { getCurrentItineraryData, validateItineraryData } = await import("./Step2Itinerary")

          // Get the latest itinerary data
          const latestItineraryData = getCurrentItineraryData()
          console.log("Got latest itinerary data:", latestItineraryData)

          // Check if there are any events that need validation
          const validationResult = validateItineraryData(latestItineraryData)

          // If there are events with invalid dates, show an error and don't save
          if (!validationResult.valid) {
            setSnackbar({
              open: true,
              message: validationResult.message,
              severity: "error",
            })
            setIsSaving(false)
            return // Don't proceed with saving
          }

          // Only update if we got valid data
          if (latestItineraryData && latestItineraryData.length > 0) {
            currentItinerary = latestItineraryData
          }
        } catch (error) {
          console.error("Error getting current itinerary data from Step2:", error)
        }
      }

      // Step 2.5: Get the latest files data
      if (activeStep === 2) {
        try {
          // Import the function to get the current files data
          const { getCurrentFilesData } = await import("./Step2_5FileUploads")

          // Get the latest files data
          const latestFilesData = getCurrentFilesData()
          console.log(
            "Got latest files data - Images:",
            latestFilesData.images.length,
            "Documents:",
            latestFilesData.documents.length,
          )

          // Only update if we got valid data
          if (latestFilesData) {
            currentImages = latestFilesData.images
            currentDocuments = latestFilesData.documents
          }
        } catch (error) {
          console.error("Error getting current files data from Step2_5:", error)
        }
      }

      console.log("Saving trip with data:", currentTripData)
      console.log("Saving itinerary with events:", currentItinerary)
      console.log("Saving with images:", currentImages.length, "and documents:", currentDocuments.length)

      // Create a FormData object to handle file uploads
      const formData = new FormData()

      // Add basic trip data
      const clientId = currentTripData.clientId ? String(currentTripData.clientId) : ""
      formData.append("clientId", clientId)
      formData.append("tripName", currentTripData.tripName || "")
      formData.append("description", currentTripData.description || "")
      formData.append("category", currentTripData.category || "")
      formData.append("status", "Draft")
      formData.append("paymentStatus", "Unpaid")
      formData.append("insuranceTaken", String(currentTripData.insuranceTaken || false))

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

      // Prepare itinerary data
      const itinerarySteps = []

      for (let i = 0; i < currentItinerary.length; i++) {
        const day = currentItinerary[i]

        // Extract events by type
        const transportEvents = day.events.filter((e) => e.type === "transport" || e.type === "cruise")
        const accommodationEvents = day.events.filter((e) => e.type === "accommodation")
        const activityEvents = day.events.filter((e) => e.type === "activity")

        // Create step object
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
          accommodations: accommodationEvents.map((e) => {
            const accommodationEvent = e as AccommodationEvent

            return {
              hotelName: accommodationEvent.hotelName || null,
              checkIn: accommodationEvent.checkIn || null,
              checkOut: accommodationEvent.checkOut || null,
              hotelLink: accommodationEvent.hotelLink || null,
              description: e.description || null,
              boardBasis: accommodationEvent.boardBasis || null,
              roomType: accommodationEvent.roomType || null,
            }
          }),
          activities: activityEvents.map((e) => {
            const activityEvent = e as ActivityEvent

            return {
              description: e.description || null,
              activityTime: activityEvent.activityTime || null,
            }
          }),
        }

        itinerarySteps.push(step)
      }

      // Create the itinerary object
      const itineraryData = {
        title: currentTripData.itineraryTitle || "",
        description: currentTripData.itineraryDescription || "",
        itinerarySteps: itinerarySteps,
      }

      // Debug log to verify the itinerary data structure
      console.log("Formatted itinerary data for server:", JSON.stringify(itineraryData, null, 2))

      // Try a different approach - stringify the itinerary data and append it as a string
      formData.append("itinerary", JSON.stringify(itineraryData))

      // Add files - use the current state which will have the latest files
      currentImages.forEach((file) => {
        formData.append("Images", file)
      })

      currentDocuments.forEach((file) => {
        formData.append("Documents", file)
      })

      console.log("Sending draft trip data to server...")

      // Log the form data for debugging
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }

      // Send request
      const response = await axios.post(`${API_URL}/client-trips`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (response.status >= 200 && response.status < 300) {
        console.log("Draft saved successfully:", response.data)
        setSnackbar({
          open: true,
          message: "Kelionė išsaugota kaip juodraštis!",
          severity: "success",
        })

        // If save was successful, allow navigation
        handleLeave(true)
        setShouldBlockNavigation(false)

        // Log the pending location before navigating
        console.log("Will navigate to:", pendingLocation)
      } else {
        throw new Error(`Server returned status ${response.status}`)
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko išsaugoti juodraščio. Bandykite dar kartą.",
        severity: "error",
      })
      setIsSaving(false)
    }
  }

  // Handle "Leave without saving"
  const handleLeaveWithoutSaving = () => {
    setShouldBlockNavigation(false)
    handleLeave(true)
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
    // Set saving state to true when starting the save operation
    setIsSaving(true)

    // Check if all fields are valid (if "Confirmed")
    const validationResult = validateTrip(formState.tripData, formState.itinerary, status === "Confirmed")

    if (!validationResult.isValid) {
      setIsSaving(false)
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

      // Prepare itinerary data
      const itinerarySteps = []

      for (let i = 0; i < formState.itinerary.length; i++) {
        const day = formState.itinerary[i]

        // Extract events by type
        const transportEvents = day.events.filter((e) => e.type === "transport" || e.type === "cruise")
        const accommodationEvents = day.events.filter((e) => e.type === "accommodation")
        const activityEvents = day.events.filter((e) => e.type === "activity")

        // Create step object
        const step = {
          dayNumber: formState.tripData.dayByDayItineraryNeeded ? i + 1 : null,
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
          accommodations: accommodationEvents.map((e) => {
            const accommodationEvent = e as AccommodationEvent

            return {
              hotelName: accommodationEvent.hotelName || null,
              checkIn: accommodationEvent.checkIn || null,
              checkOut: accommodationEvent.checkOut || null,
              hotelLink: accommodationEvent.hotelLink || null,
              description: e.description || null,
              boardBasis: accommodationEvent.boardBasis || null,
              roomType: accommodationEvent.roomType || null,
            }
          }),
          activities: activityEvents.map((e) => {
            const activityEvent = e as ActivityEvent

            return {
              description: e.description || null,
              activityTime: activityEvent.activityTime || null,
            }
          }),
        }

        itinerarySteps.push(step)
      }

      // Create the itinerary object
      const itineraryData = {
        title: itineraryTitle,
        description: itineraryDescription,
        itinerarySteps: itinerarySteps,
      }

      // Debug log to verify the itinerary data structure
      console.log("Formatted itinerary data for server:", JSON.stringify(itineraryData, null, 2))

      // Try a different approach - stringify the itinerary data and append it as a string
      formData.append("itinerary", JSON.stringify(itineraryData))

      // Add files
      formState.images.forEach((file) => {
        formData.append("Images", file)
      })

      formState.documents.forEach((file) => {
        formData.append("Documents", file)
      })

      console.log("Sending trip data to server...")

      // Log the form data for debugging
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }

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

        // After successful save, we can allow navigation
        setShouldBlockNavigation(false)

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
        // Set saving state to false on error
        setIsSaving(false)
      }
    } catch (error) {
      console.error("Error saving trip:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko išsaugoti kelionės (server error).",
        severity: "error",
      })
      // Set saving state to false on error
      setIsSaving(false)
    }
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
          {/* -------------- STEP 1 -------------- */}
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              onSubmit={handleStep1Submit}
              currentItinerary={formState.itinerary}
              data-wizard-navigation="true"
            />
          )}

          {/* -------------- STEP 2 -------------- */}
          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              data-wizard-navigation="true"
            />
          )}

          {/* -------------- STEP 2.5 -------------- */}
          {activeStep === 2 && (
            <Step2_5FileUploads
              initialImages={formState.images}
              initialDocuments={formState.documents}
              onSubmit={handleFileUploadsSubmit}
              onBack={handleBack}
              data-wizard-navigation="true"
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
              isSaving={isSaving}
              data-wizard-navigation="true"
            />
          )}
        </Paper>
      </Box>

      {/* Confirmation Dialog for leaving the page */}
      <Dialog
        open={showNavigationDialog}
        onClose={handleStay}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
      >
        <DialogTitle id="leave-dialog-title">Išsaugoti kaip juodraštį?</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Ar norite išsaugoti šią kelionę kaip juodraštį prieš išeidami? Jei ne, pakeitimai bus prarasti.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStay} color="primary">
            Likti
          </Button>
          <Button onClick={handleLeaveWithoutSaving} color="error">
            Išeiti be išsaugojimo
          </Button>
          <Button onClick={handleLeaveWithSave} color="primary" variant="contained">
            Išsaugoti ir išeiti
          </Button>
        </DialogActions>
      </Dialog>

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

