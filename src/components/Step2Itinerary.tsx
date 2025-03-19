"use client"

import React from "react"
import { useState } from "react"
import { Typography, Box, Paper, useTheme, useMediaQuery, Button, Grid, Divider } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import dayjs from "dayjs"

// Import components
import DaySidebar from "./itinerary/DaySidebar"
import MobileDaySelector from "./itinerary/MobileDaySelector"
import MobileDayDrawer from "./itinerary/MobileDayDrawer"
import DayDescription from "./itinerary/DayDescription"
import AddEventMenu from "./itinerary/AddEventMenu"
import EventList from "./itinerary/EventList"
import CustomSnackbar from "./CustomSnackBar"

// Import utilities
import { getEarliestTime, validateAllEvents, checkEventsOutsideRange } from "../Utils/eventValidation"
import {
  createTransportEvent,
  createAccommodationEvent,
  createActivityEvent,
  createCruiseEvent,
} from "../Utils/eventFactory"

// Import types
import type {
  TripFormData,
  ItineraryDay,
  SnackbarState,
  TripEvent,
  TransportEvent,
  AccommodationEvent,
  ActivityEvent,
} from "../types"

interface Step2Props {
  tripData: TripFormData
  itinerary: ItineraryDay[]
  onSubmit: (data: ItineraryDay[]) => void
  onBack: () => void
}

const SIDEBAR_WIDTH = 240

// Global variable to store the current itinerary data
let currentItineraryData: ItineraryDay[] = []

// Export a function to get the current itinerary data
export function getCurrentItineraryData(): ItineraryDay[] {
  console.log("Getting current itinerary data:", currentItineraryData)
  // Create a deep copy to ensure we don't have reference issues
  return JSON.parse(JSON.stringify(currentItineraryData))
}

// Export a function to validate the itinerary data
export function validateItineraryData(itinerary: ItineraryDay[]): { valid: boolean; message: string } {
  // Check if there are any events
  const hasEvents = itinerary.some((day) => day.events.length > 0)

  if (!hasEvents) {
    return { valid: true, message: "" } // No events, so no validation needed
  }

  // Validate that all events have valid dates
  return validateAllEvents(itinerary)
}

const Step2Itinerary: React.FC<Step2Props> = ({ tripData, itinerary, onSubmit, onBack }) => {
  const [localItinerary, setLocalItinerary] = useState<ItineraryDay[]>(itinerary)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "error",
  })
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  // Update the global currentItineraryData whenever localItinerary changes
  React.useEffect(() => {
    currentItineraryData = [...localItinerary]
    console.log("Updated current itinerary data:", currentItineraryData)
  }, [localItinerary])

  // Add menu anchor for dropdown
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))
  const isDayByDay = tripData.dayByDayItineraryNeeded

  const currentDay = localItinerary[selectedDayIndex] || {
    dayLabel: "",
    dayDescription: "",
    events: [],
  }

  // Day description
  const handleDayDescriptionChange = (value: string) => {
    const updated = [...localItinerary]

    if (isDayByDay) {
      // For day-by-day mode, update the current day's description
      updated[selectedDayIndex].dayDescription = value
    } else {
      // For non-day-by-day mode, update all days' descriptions
      // This ensures the description is preserved when switching between days
      updated.forEach((day) => {
        day.dayDescription = value
      })
    }

    setLocalItinerary(updated)
  }

  // When user clicks "Toliau"
  const handleNext = () => {
    // First validate that all events have valid dates
    const dateValidationResult = validateAllEvents(localItinerary)

    if (!dateValidationResult.valid) {
      setSnackbar({
        open: true,
        message: dateValidationResult.message,
        severity: "error",
      })
      return
    }

    // Then validate that all events have required fields filled
    const completenessValidationResult = validateAllEvents(localItinerary, true)

    if (!completenessValidationResult.valid) {
      setSnackbar({
        open: true,
        message: completenessValidationResult.message,
        severity: "error",
      })
      return
    }

    // Check if events are within trip date range
    const eventsOutsideRange = checkEventsOutsideRange(localItinerary, tripData.startDate, tripData.endDate)

    if (eventsOutsideRange.length > 0) {
      setSnackbar({
        open: true,
        message: `${eventsOutsideRange.length} įvykiai yra už kelionės datų ribų. Prašome pataisyti įvykių datas arba kelionės intervalą.`,
        severity: "error",
      })
      return
    }

    // Sort events by earliest time
    const sortedItinerary = localItinerary.map((day) => ({
      ...day,
      events: [...day.events].sort((a, b) => (getEarliestTime(a) || 0) - (getEarliestTime(b) || 0)),
    }))

    onSubmit(sortedItinerary)
  }

  // Helper function to check if events are outside the trip date range
  const checkEventsOutsideRange = (
    itinerary: ItineraryDay[],
    startDateStr: string | null,
    endDateStr: string | null,
  ): TripEvent[] => {
    if (!startDateStr || !endDateStr) return []

    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0) // Start of day

    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999) // End of day

    const eventsOutsideRange: TripEvent[] = []

    itinerary.forEach((day) => {
      day.events.forEach((event) => {
        const eventDate: Date | null = null

        if (event.type === "transport" || event.type === "cruise") {
          const transportEvent = event as TransportEvent
          if (transportEvent.departureTime) {
            const departureDate = new Date(transportEvent.departureTime)
            if (departureDate < startDate || departureDate > endDate) {
              eventsOutsideRange.push(event)
              return
            }
          }

          if (transportEvent.arrivalTime) {
            const arrivalDate = new Date(transportEvent.arrivalTime)
            if (arrivalDate < startDate || arrivalDate > endDate) {
              eventsOutsideRange.push(event)
              return
            }
          }
        } else if (event.type === "accommodation") {
          const accommodationEvent = event as AccommodationEvent
          if (accommodationEvent.checkIn) {
            const checkInDate = new Date(accommodationEvent.checkIn)
            if (checkInDate < startDate || checkInDate > endDate) {
              eventsOutsideRange.push(event)
              return
            }
          }

          if (accommodationEvent.checkOut) {
            const checkOutDate = new Date(accommodationEvent.checkOut)
            if (checkOutDate < startDate || checkOutDate > endDate) {
              eventsOutsideRange.push(event)
              return
            }
          }
        } else if (event.type === "activity") {
          const activityEvent = event as ActivityEvent
          if (activityEvent.activityTime) {
            const activityDate = new Date(activityEvent.activityTime)
            if (activityDate < startDate || activityDate > endDate) {
              eventsOutsideRange.push(event)
              return
            }
          }
        }
      })
    })

    return eventsOutsideRange
  }

  // Add events
  const addTransport = () => {
    addEventToCurrentDay(createTransportEvent())
    handleCloseAddMenu()
  }

  const addAccommodation = () => {
    addEventToCurrentDay(createAccommodationEvent())
    handleCloseAddMenu()
  }

  const addActivity = () => {
    addEventToCurrentDay(createActivityEvent())
    handleCloseAddMenu()
  }

  const addCruise = () => {
    addEventToCurrentDay(createCruiseEvent())
    handleCloseAddMenu()
  }

  const addEventToCurrentDay = (newEvent: any) => {
    const updated = [...localItinerary]
    updated[selectedDayIndex].events.push(newEvent)
    setLocalItinerary(updated)
  }

  // Handle add menu close
  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null)
    setAddMenuOpen(false)
  }

  // Remove event from day
  const removeEvent = (eventIndex: number) => {
    const updated = [...localItinerary]
    updated[selectedDayIndex].events.splice(eventIndex, 1)
    setLocalItinerary(updated)
  }

  // If user edits an event, update local state
  const handleEventChange = (eventIndex: number, field: string, value: any) => {
    const updated = [...localItinerary]
    updated[selectedDayIndex].events[eventIndex] = {
      ...updated[selectedDayIndex].events[eventIndex],
      [field]: value,
    }
    setLocalItinerary(updated)
  }

  // Navigate to next/previous day
  const goToNextDay = () => {
    if (selectedDayIndex < localItinerary.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1)
    }
  }

  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1)
    }
  }

  if (!tripData.startDate || !tripData.endDate) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="h6" gutterBottom>
          Pridėkite datas, kad galėtumėte sudėlioti kelionę
        </Typography>
        <Button variant="contained" onClick={onBack} sx={{ mt: 3 }}>
          Grįžti ir pridėti datas
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
      {/* Day sidebar for desktop */}
      {isDayByDay && (
        <DaySidebar
          days={localItinerary}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
          sidebarWidth={SIDEBAR_WIDTH}
        />
      )}

      {/* Mobile day drawer */}
      <MobileDayDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        days={localItinerary}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
      />

      <Box sx={{ flexGrow: 1, width: "100%" }}>
        {/* Mobile day selector */}
        {isDayByDay && isMobile && (
          <MobileDaySelector
            selectedDayIndex={selectedDayIndex}
            totalDays={localItinerary.length}
            currentDayLabel={currentDay.dayLabel}
            onOpenDrawer={() => setMobileOpen(true)}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
          />
        )}

        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                {tripData.tripName || "(nepavadinta kelionė)"}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {isDayByDay ? `Diena ${selectedDayIndex + 1}` : "Bendras sąrašas"}
              </Typography>
            </Box>

            {isDayByDay && !isMobile && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={goToPreviousDay}
                  disabled={selectedDayIndex === 0}
                  color="primary"
                  startIcon={<ArrowBack />}
                >
                  Ankstesnė
                </Button>
                <Button
                  onClick={goToNextDay}
                  disabled={selectedDayIndex === localItinerary.length - 1}
                  color="primary"
                  endIcon={<ArrowForward />}
                >
                  Kita
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Day description */}
          <DayDescription
            description={currentDay.dayDescription}
            isDayByDay={isDayByDay}
            onChange={handleDayDescriptionChange}
          />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Pridėti naują įvykį
            </Typography>

            {/* Add event menu */}
            <AddEventMenu
              isSmall={isSmall}
              addMenuOpen={addMenuOpen}
              setAddMenuOpen={setAddMenuOpen}
              addMenuAnchorEl={addMenuAnchorEl}
              setAddMenuAnchorEl={setAddMenuAnchorEl}
              onAddTransport={addTransport}
              onAddAccommodation={addAccommodation}
              onAddActivity={addActivity}
              onAddCruise={addCruise}
            />
          </Box>

          {/* Event list */}
          <Grid container spacing={3}>
            <EventList
              events={currentDay.events}
              dayByDay={isDayByDay}
              dayDate={currentDay.dayLabel}
              tripStart={dayjs(tripData.startDate).startOf("day")}
              tripEnd={dayjs(tripData.endDate).endOf("day")}
              onRemoveEvent={removeEvent}
              onEventChange={handleEventChange}
            />
          </Grid>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 6 }}>
          <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
            Atgal
          </Button>
          <Button variant="contained" onClick={handleNext} size="large" endIcon={<ArrowForward />}>
            Toliau
          </Button>
        </Box>
      </Box>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  )
}

export default Step2Itinerary

