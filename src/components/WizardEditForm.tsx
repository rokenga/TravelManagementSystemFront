"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Container, Typography, Stepper, Step, StepLabel, Paper, Box, Button } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { API_URL } from "../Utils/Configuration"
import dayjs from "dayjs"

import Step1TripInfo from "./Step1TripInfo"
import Step2Itinerary from "./Step2Itinerary"
import Step3ReviewConfirm from "./Step3ReviewConfirm"
import CustomSnackbar from "../components/CustomSnackBar"

// Import types
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

const steps = ["Kelionės informacija", "Kelionės planas", "Dokumentai ir nuotraukos", "Peržiūrėti ir atnaujinti"]

function WizardEditForm() {
  const { tripId } = useParams()
  const navigate = useNavigate()

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

  useEffect(() => {
    if (!tripId) return
    fetchTripData(tripId)
  }, [tripId])

  async function fetchTripData(id: string) {
    try {
      const response = await axios.get(`${API_URL}/client-trips/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (response.status === 200) {
        const trip = response.data
        const normalized = mapServerResponseToWizardState(trip)
        setFormState({
          tripData: normalized.tripData,
          itinerary: normalized.itinerary,
          validationWarnings: [],
          images: [], // We don't allow editing images in edit mode
          documents: [], // We don't allow editing documents in edit mode
        })
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to load trip:", error)
      setSnackbar({
        open: true,
        message: "Nepavyko įkelti kelionės duomenų.",
        severity: "error",
      })
      setLoading(false)
    }
  }

  /**
   * Convert the server's TripResponse into our wizard shapes.
   */
  function mapServerResponseToWizardState(tripResponse: TripResponse): {
    tripData: TripFormData
    itinerary: ItineraryDay[]
  } {
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
      adultsCount: adultsCount || null,
      childrenCount: childrenCount || null,
      dayByDayItineraryNeeded: dayByDayItineraryNeeded || false,
      itineraryTitle: itinerary?.title || "",
      itineraryDescription: itinerary?.description || "",
      clientId: clientId || "",
      clientName: null, // This will be populated when client data is fetched
    }

    // Build "wizardItinerary" from itinerary steps
    let wizardItinerary: ItineraryDay[] = []
    if (dayByDayItineraryNeeded && itinerary && itinerary.itinerarySteps) {
      wizardItinerary = buildWizardItineraryFromSteps(itinerary.itinerarySteps, tripData.startDate, tripData.endDate)
    } else {
      // single day
      wizardItinerary = [
        {
          dayLabel: tripData.startDate || "",
          dayDescription: itinerary?.description || "",
          events: convertStepsToEvents(itinerary?.itinerarySteps ?? []),
        },
      ]
    }

    return {
      tripData,
      itinerary: wizardItinerary,
    }
  }

  /**
   * Build array of day-labeled objects from step.dayNumber
   */
  function buildWizardItineraryFromSteps(steps: any[], startDate: string, endDate: string) {
    // steps with dayNumber => index them
    // If dayNumber=1 => dayLabel = startDate
    // dayNumber=2 => startDate + 1 day, etc.

    const results: any[] = []
    const start = dayjs(startDate)

    steps.forEach((step) => {
      const dNum = step.dayNumber ? step.dayNumber : 1
      const idx = dNum - 1

      if (!results[idx]) {
        // create day object
        const date = start.add(idx, "day").format("YYYY-MM-DD")
        results[idx] = {
          dayLabel: date,
          dayDescription: step.description || "",
          events: [],
        }
      }

      const evts = convertOneStepToEvents(step)
      results[idx].events.push(...evts)
    })

    return results
  }

  function convertOneStepToEvents(step: any): TripEvent[] {
    const events: TripEvent[] = []
    // Transports
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
    // Accommodations
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
    // Activities
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

  /**
   * Flatten steps for single-day approach
   */
  function convertStepsToEvents(steps: any[]) {
    let all: any[] = []
    steps?.forEach((s: any) => {
      all = all.concat(convertOneStepToEvents(s))
    })
    return all
  }

  function handleNext() {
    setActiveStep((p) => p + 1)
  }

  function handleBack() {
    setActiveStep((p) => p - 1)
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

  /**
   * Get human-readable event type names
   */
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
   * Validate trip data and generate warnings
   */
  const validateTrip = (
    tripData: TripFormData,
    itinerary: ItineraryDay[],
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5">Įkeliama...</Typography>
      </Container>
    )
  }
  if (!tripId) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5">Trūksta kelionės ID</Typography>
      </Container>
    )
  }

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
          {/* ---------------- STEP 1 ---------------- */}
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formState.tripData}
              currentItinerary={formState.itinerary}
              onSubmit={(updatedData: any, updatedItinerary: any) => {
                setFormState((prev) => ({
                  ...prev,
                  tripData: updatedData,
                  itinerary: updatedItinerary,
                }))
                handleNext()
              }}
            />
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {activeStep === 1 && (
            <Step2Itinerary
              tripData={formState.tripData}
              itinerary={formState.itinerary}
              onSubmit={(updatedItinerary) => {
                // Run validation to get warnings
                const validationResult = validateTrip(formState.tripData, updatedItinerary, false)

                // Update state with warnings and itinerary
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

          {/* ---------------- STEP 2.5 ---------------- */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Dokumentų ir nuotraukų pridėjimas negalimas redagavimo režime
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Šiuo metu dokumentų ir nuotraukų pridėjimas redagavimo režime nėra palaikomas.
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }}>
                  Atgal
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Toliau
                </Button>
              </Box>
            </Box>
          )}

          {/* ---------------- STEP 3 ---------------- */}
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

        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Box>
    </LocalizationProvider>
  )

  /**
   * Final PUT
   */
  async function handleSaveTrip(status: "Draft" | "Confirmed") {
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
      const finalData = buildFinalData(status)
      const response = await axios.put(`${API_URL}/client-trips/${tripId}`, finalData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      if (response.status >= 200 && response.status < 300) {
        setSnackbar({
          open: true,
          message: "Kelionė atnaujinta sėkmingai!",
          severity: "success",
        })
        setTimeout(() => navigate(`/trips/${tripId}`), 1500)
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko atnaujinti kelionės. HTTP status: " + response.status,
          severity: "error",
        })
      }
    } catch (err) {
      console.error(err)
      setSnackbar({
        open: true,
        message: "Nepavyko atnaujinti kelionės (server error).",
        severity: "error",
      })
    }
  }

  function buildFinalData(status: string): CreateTripRequest {
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

  /**
   * Convert the days + events -> final step array
   */
  function convertWizardItineraryToSteps(wizardItinerary: ItineraryDay[], dayByDay: boolean) {
    return wizardItinerary.map((dayObj, idx) => {
      const dayNumber = dayByDay ? idx + 1 : null
      // same as create  idx) => {
      // same as create logic
      const transports = dayObj.events
        .filter((e: TripEvent) => e.type === "transport" || e.type === "cruise")
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
        .filter((e: TripEvent) => e.type === "accommodation")
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
        .filter((e: TripEvent) => e.type === "activity")
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
}

export default WizardEditForm

