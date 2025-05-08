"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import CustomSnackbar from "../CustomSnackBar"

// Import utilities
import { getEarliestTime, validateAllEvents, checkEventsOutsideRange } from "../../Utils/eventValidation"
import {
  createTransportEvent,
  createAccommodationEvent,
  createActivityEvent,
  createCruiseEvent,
} from "../../Utils/eventFactory"

// Import types
import type {
  TripFormData,
  ItineraryDay,
  SnackbarState,
  TripEvent,
  TransportEvent,
  AccommodationEvent,
  ActivityEvent,
} from "../../types"

// Declare global window properties
declare global {
  interface Window {
    __currentStepImagesData: {
      stepImages: { [key: number]: File[] }
      stepImagesToDelete: { [key: number]: string[] }
    } | null
    __currentItineraryData: ItineraryDay[] | null
  }
}

// Add global state management functions
export function getCurrentStepImagesData() {
  return window.__currentStepImagesData || null
}

// Export a function to get the current itinerary data
export function getCurrentItineraryData() {
  return window.__currentItineraryData || null
}

interface Step2Props {
  tripData: TripFormData
  itinerary: ItineraryDay[]
  onSubmit: (data: ItineraryDay[]) => void
  onBack: () => void
  stepImages?: { [key: number]: File[] }
  onStepImagesChange?: (dayIndex: number, files: File[]) => void
  existingStepImages?: { [key: number]: Array<{ id: string; url: string }> }
  onStepImageDelete?: (dayIndex: number, imageId: string) => void
}

const SIDEBAR_WIDTH = 240

// Generate a unique key for localStorage based on trip ID or name
function getStorageKey(tripData: TripFormData): string {
  // Use trip ID if available, otherwise use name + start date
  const identifier = tripData.id || `${tripData.tripName || "unnamed"}_${tripData.startDate || "nodate"}`
  return `nonDayByDayDescription_${identifier}`
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

// Helper function to check if an event's date matches its day's date
function checkEventDateMatchesDay(event: any, dayDate: string): boolean {
  if (!dayDate) return true // If no day date, can't validate

  const dayStart = dayjs(dayDate).startOf("day")
  const dayEnd = dayjs(dayDate).endOf("day")

  // Check based on event type
  if (event.type === "transport" || event.type === "cruise") {
    // For transport and cruise, check departure time
    if (event.departureTime) {
      const departureTime = dayjs(event.departureTime)
      if (departureTime.isBefore(dayStart) || departureTime.isAfter(dayEnd)) {
        return false
      }
    }
  } else if (event.type === "accommodation") {
    // For accommodation, check check-in time
    if (event.checkIn) {
      const checkInTime = dayjs(event.checkIn)
      if (checkInTime.isBefore(dayStart) || checkInTime.isAfter(dayEnd)) {
        return false
      }
    }
  } else if (event.type === "activity") {
    // For activity, check activity time
    if (event.activityTime) {
      const activityTime = dayjs(event.activityTime)
      if (activityTime.isBefore(dayStart) || activityTime.isAfter(dayEnd)) {
        return false
      }
    }
  }

  return true
}

// Function to validate that all events in day-by-day mode have dates matching their day
function validateDayByDayEventDates(itinerary: ItineraryDay[]): {
  valid: boolean
  message: string
  mismatchedEvents: Array<{ dayIndex: number; eventIndex: number; eventType: string }>
} {
  const mismatchedEvents: Array<{ dayIndex: number; eventIndex: number; eventType: string }> = []

  itinerary.forEach((day, dayIndex) => {
    day.events.forEach((event, eventIndex) => {
      if (!checkEventDateMatchesDay(event, day.dayLabel)) {
        mismatchedEvents.push({
          dayIndex,
          eventIndex,
          eventType: event.type,
        })
      }
    })
  })

  if (mismatchedEvents.length > 0) {
    return {
      valid: false,
      message: `Rasta ${mismatchedEvents.length} įvykių, kurių datos nesutampa su dienos data. Prašome pataisyti įvykių datas arba perkelti juos į tinkamą dieną.`,
      mismatchedEvents,
    }
  }

  return { valid: true, message: "", mismatchedEvents: [] }
}

const Step2Itinerary: React.FC<Step2Props> = ({
  tripData,
  itinerary,
  onSubmit,
  onBack,
  stepImages = {},
  onStepImagesChange = () => {},
  existingStepImages = {},
  onStepImageDelete,
}) => {
  // Add console logs to debug
  console.log("Step2Itinerary - itinerary:", itinerary)
  console.log("Step2Itinerary - stepImages:", stepImages)
  console.log("Step2Itinerary - existingStepImages:", existingStepImages)

  const [localItinerary, setLocalItinerary] = useState<ItineraryDay[]>(itinerary)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "error",
  })
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null)

  // Add new state variables for step images management
  const [currentStepImages, setCurrentStepImages] = useState(stepImages || {})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<{ [key: number]: string[] }>({})
  const [existingStepImagesState, setExistingStepImages] = useState(existingStepImages || {})

  // Get a unique storage key for this trip
  const storageKey = getStorageKey(tripData)

  // Store the non-day-by-day description separately to preserve it
  const [nonDayByDayDescription, setNonDayByDayDescription] = useState<string>("")

  // Initialize nonDayByDayDescription from localStorage or itinerary if available
  useEffect(() => {
    if (!tripData.dayByDayItineraryNeeded) {
      // Try to get description from localStorage first
      const savedDescription = localStorage.getItem(storageKey)

      if (savedDescription) {
        setNonDayByDayDescription(savedDescription)

        // Also update the itinerary with this description
        if (localItinerary.length > 0) {
          const updatedItinerary = localItinerary.map((day) => ({
            ...day,
            dayDescription: savedDescription,
          }))
          setLocalItinerary(updatedItinerary)
        }
      } else if (itinerary.length > 0 && itinerary[0].dayDescription) {
        // If not in localStorage, try to get from itinerary
        setNonDayByDayDescription(itinerary[0].dayDescription)
      }
    }
  }, [tripData.dayByDayItineraryNeeded, storageKey])

  // Save nonDayByDayDescription to localStorage whenever it changes
  useEffect(() => {
    if (!tripData.dayByDayItineraryNeeded && nonDayByDayDescription) {
      localStorage.setItem(storageKey, nonDayByDayDescription)
    }
  }, [nonDayByDayDescription, tripData.dayByDayItineraryNeeded, storageKey])

  useEffect(() => {
    // Update the global currentItineraryData whenever localItinerary changes
    // If not day-by-day, ensure all days have the same description
    if (!tripData.dayByDayItineraryNeeded) {
      const updatedItinerary = localItinerary.map((day) => ({
        ...day,
        dayDescription: nonDayByDayDescription,
      }))
      window.__currentItineraryData = [...updatedItinerary]
    } else {
      window.__currentItineraryData = [...localItinerary]
    }
    console.log("Updated current itinerary data:", window.__currentItineraryData)

    // Notify parent component about changes if the itinerary has changed from the initial state
    if (JSON.stringify(window.__currentItineraryData) !== JSON.stringify(itinerary)) {
      console.log("Itinerary changed, notifying parent")
      // This will trigger the hasChanges state in the parent
      if (onSubmit) {
        // We're not actually submitting, just notifying about changes
        // The parent should detect this and update its state
        onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
      }
    }
  }, [
    localItinerary,
    nonDayByDayDescription,
    tripData.dayByDayItineraryNeeded,
    itinerary,
    onSubmit,
    onStepImagesChange,
    selectedDayIndex,
    stepImages,
  ])

  // Store the current step images data in a global variable for access from outside
  useEffect(() => {
    window.__currentStepImagesData = {
      stepImages: currentStepImages,
      stepImagesToDelete,
    }

    // Clean up when component unmounts
    return () => {
      window.__currentStepImagesData = null
    }
  }, [currentStepImages, stepImagesToDelete])

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))
  const isDayByDay = tripData.dayByDayItineraryNeeded

  const currentDay = localItinerary[selectedDayIndex] || {
    dayLabel: "",
    dayDescription: "",
    events: [],
  }

  // Check if current day already has an image event
  const hasImageEvent = currentDay.events.some((event) => event.type === "images")

  // Get existing image URLs for the current day
  const currentDayExistingImages = existingStepImagesState[selectedDayIndex] || []
  const currentDayExistingImageUrls = currentDayExistingImages.map((img) => img.url || img.urlInline).filter(Boolean)

  // Add more detailed logging
  console.log("Step2Itinerary - currentDayExistingImages:", currentDayExistingImages)
  console.log("Step2Itinerary - currentDayExistingImageUrls:", currentDayExistingImageUrls)

  // Log the current day's existing image URLs
  console.log("Step2Itinerary - currentDay:", currentDay)
  console.log("Step2Itinerary - selectedDayIndex:", selectedDayIndex)

  // Handle step image change
  const handleStepImagesChange = (dayIndex: number, files: File[]) => {
    setCurrentStepImages((prev) => {
      const updated = {
        ...prev,
        [dayIndex]: files,
      }

      // Call the parent handler
      if (onStepImagesChange) {
        onStepImagesChange(dayIndex, files)
      }

      return updated
    })
  }

  // Handle step image delete
  const handleStepImageDelete = (dayIndex: number, imageIdOrUrl: string) => {
    console.log(`Step2Itinerary - handleStepImageDelete called with imageIdOrUrl:`, imageIdOrUrl)

    // Find the image in existingStepImages by URL or ID
    const images = existingStepImagesState[dayIndex] || []
    const imageToDelete = images.find((img) => img.url === imageIdOrUrl || img.id === imageIdOrUrl)

    if (imageToDelete) {
      console.log(`Found image to delete:`, imageToDelete)

      // Add the image ID to the list of images to delete
      setStepImagesToDelete((prev) => {
        const current = prev[dayIndex] || []
        const updated = {
          ...prev,
          [dayIndex]: [...current, imageToDelete.id],
        }

        // Call the parent handler
        if (onStepImageDelete) {
          onStepImageDelete(dayIndex, imageToDelete.id)
        }

        return updated
      })

      // Also remove it from the existingStepImages array in local state
      setExistingStepImages((prev) => {
        const updatedImages = [...(prev[dayIndex] || [])].filter(
          (img) => img.id !== imageToDelete.id && img.url !== imageIdOrUrl,
        )
        return {
          ...prev,
          [dayIndex]: updatedImages,
        }
      })
    } else {
      console.warn(`Could not find image with ID or URL: ${imageIdOrUrl} in day ${dayIndex}`)

      // If we can't find the image by ID, try to delete it directly
      if (onStepImageDelete) {
        onStepImageDelete(dayIndex, imageIdOrUrl)
      }
    }
  }

  // Update the existing handleImageChange to use the new handler
  const handleImageChange = (files: File[]) => {
    console.log("Step2Itinerary - handleImageChange called with files:", files)
    handleStepImagesChange(selectedDayIndex, files)
  }

  // Update the existing handleExistingImageDelete to use the new handler
  const handleExistingImageDelete = (imageIdOrUrl: string) => {
    console.log("Step2Itinerary - handleExistingImageDelete called with imageIdOrUrl:", imageIdOrUrl)
    handleStepImageDelete(selectedDayIndex, imageIdOrUrl)
  }

  // Day description
  const handleDayDescriptionChange = (value: string) => {
    if (isDayByDay) {
      // For day-by-day mode, update the current day's description
      const updated = [...localItinerary]
      updated[selectedDayIndex].dayDescription = value
      setLocalItinerary(updated)
    } else {
      // For non-day-by-day mode, store the description in a separate state
      setNonDayByDayDescription(value)

      // Also update all days to have this description
      const updated = [...localItinerary]
      updated.forEach((day) => {
        day.dayDescription = value
      })
      setLocalItinerary(updated)
    }

    // Notify about changes by triggering the image change handler
    // This is a bit of a hack, but it will ensure the parent detects changes
    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  // When user clicks "Toliau"
  const handleNext = () => {
    // Ensure all days have the same description in non-day-by-day mode
    let finalItinerary = [...localItinerary]
    if (!isDayByDay) {
      finalItinerary = finalItinerary.map((day) => ({
        ...day,
        dayDescription: nonDayByDayDescription,
      }))
    } else {
      // In day-by-day mode, check if all events have dates matching their day
      const dayByDayValidation = validateDayByDayEventDates(finalItinerary)
      if (!dayByDayValidation.valid) {
        setSnackbar({
          open: true,
          message: dayByDayValidation.message,
          severity: "error",
        })
        return
      }
    }

    // First validate that all events have valid dates
    const dateValidationResult = validateAllEvents(finalItinerary)

    if (!dateValidationResult.valid) {
      setSnackbar({
        open: true,
        message: dateValidationResult.message,
        severity: "error",
      })
      return
    }

    // Then validate that all events have required fields filled
    // For image events, we need to include both stepImages and existingImageUrls
    const itineraryWithImages = finalItinerary.map((day, dayIndex) => ({
      ...day,
      events: day.events.map((event) =>
        event.type === "images"
          ? {
              ...event,
              stepImages: stepImages[dayIndex] || [],
              existingImageUrls: (existingStepImagesState[dayIndex] || []).map((img) => img.url),
            }
          : event,
      ),
    }))

    const completenessValidationResult = validateAllEvents(itineraryWithImages, true)

    if (!completenessValidationResult.valid) {
      setSnackbar({
        open: true,
        message: completenessValidationResult.message,
        severity: "error",
      })
      return
    }

    // Check if events are within trip date range
    const eventsOutsideRange = checkEventsOutsideRange(finalItinerary, tripData.startDate, tripData.endDate)

    if (eventsOutsideRange.length > 0) {
      setSnackbar({
        open: true,
        message: `${eventsOutsideRange.length} įvykiai yra už kelionės datų ribų. Prašome pataisyti įvykių datas arba kelionės intervalą.`,
        severity: "error",
      })
      return
    }

    // Sort events by earliest time
    const sortedItinerary = finalItinerary.map((day) => ({
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

    // Notify about changes
    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  // Handle add menu close
  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null)
    setAddMenuOpen(false)
  }

  // Remove event from day
  const removeEvent = (eventIndex: number) => {
    const updated = [...localItinerary]
    const eventToRemove = updated[selectedDayIndex].events[eventIndex]

    // If removing an image event, mark all existing images for deletion
    if (eventToRemove.type === "images") {
      // Get all existing images for this day
      const existingImages = existingStepImagesState[selectedDayIndex] || []

      // Mark all existing images for deletion
      if (existingImages.length > 0) {
        console.log(`Marking all ${existingImages.length} images for deletion in day ${selectedDayIndex}`)

        // Add all image IDs to the stepImagesToDelete array
        const imageIds = existingImages.map((img) => img.id)
        setStepImagesToDelete((prev) => ({
          ...prev,
          [selectedDayIndex]: [...(prev[selectedDayIndex] || []), ...imageIds],
        }))

        // Call onStepImageDelete for each image
        if (onStepImageDelete) {
          existingImages.forEach((img) => {
            onStepImageDelete(selectedDayIndex, img.id)
          })
        }

        // Clear the existing images for this day
        setExistingStepImages((prev) => ({
          ...prev,
          [selectedDayIndex]: [],
        }))
      }

      // Clear the new images for this day
      handleStepImagesChange(selectedDayIndex, [])
    }

    // Remove the event
    updated[selectedDayIndex].events.splice(eventIndex, 1)
    setLocalItinerary(updated)

    // Notify about changes
    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  // If user edits an event, update local state
  const handleEventChange = (eventIndex: number, field: string, value: any) => {
    const updated = [...localItinerary]
    updated[selectedDayIndex].events[eventIndex] = {
      ...updated[selectedDayIndex].events[eventIndex],
      [field]: value,
    }
    setLocalItinerary(updated)

    // Notify about changes
    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
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

  // Add images function
  const addImages = () => {
    // Check if this day already has an image event
    if (hasImageEvent) {
      setSnackbar({
        open: true,
        message: "Ši diena jau turi nuotraukų įvykį. Galima pridėti tik vieną nuotraukų įvykį dienai.",
        severity: "warning",
      })
      handleCloseAddMenu()
      return
    }

    const newEvent = {
      type: "images",
      description: "Nuotraukos",
    }
    addEventToCurrentDay(newEvent)
    handleCloseAddMenu()
  }

  // Handle back button click - save description to localStorage before going back
  const handleBack = () => {
    if (!isDayByDay && nonDayByDayDescription) {
      localStorage.setItem(storageKey, nonDayByDayDescription)
    }
    onBack()
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
            description={isDayByDay ? currentDay.dayDescription : nonDayByDayDescription}
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
              onAddImages={addImages}
              hasImageEvent={hasImageEvent}
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
              stepImages={stepImages[selectedDayIndex] || []}
              onImageChange={handleImageChange}
              existingImageUrls={currentDayExistingImageUrls}
              onExistingImageDelete={handleExistingImageDelete}
            />
          </Grid>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 6 }}>
          <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
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
