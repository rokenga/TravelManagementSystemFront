"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Typography, Box, Paper, useTheme, useMediaQuery, Button, Grid, Divider } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import dayjs from "dayjs"

import DaySidebar from "./itinerary/DaySidebar"
import MobileDaySelector from "./itinerary/MobileDaySelector"
import MobileDayDrawer from "./itinerary/MobileDayDrawer"
import DayDescription from "./itinerary/DayDescription"
import AddEventMenu from "./itinerary/AddEventMenu"
import EventList from "./itinerary/EventList"
import CustomSnackbar from "../CustomSnackBar"

import { getEarliestTime, validateAllEvents, checkEventsOutsideRange } from "../../Utils/eventValidation"
import {
  createTransportEvent,
  createAccommodationEvent,
  createActivityEvent,
  createCruiseEvent,
} from "../../Utils/eventFactory"

import type {
  TripFormData,
  ItineraryDay,
  SnackbarState,
  TripEvent,
  TransportEvent,
  AccommodationEvent,
  ActivityEvent,
} from "../../types"

declare global {
  interface Window {
    __currentStepImagesData: {
      stepImages: { [key: number]: File[] }
      stepImagesToDelete: { [key: number]: string[] }
    } | null
    __currentItineraryData: ItineraryDay[] | null
  }
}

export function getCurrentStepImagesData() {
  return window.__currentStepImagesData || null
}

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

function getStorageKey(tripData: TripFormData): string {
  const identifier = tripData.id || `${tripData.tripName || "unnamed"}_${tripData.startDate || "nodate"}`
  return `nonDayByDayDescription_${identifier}`
}

export function validateItineraryData(itinerary: ItineraryDay[]): { valid: boolean; message: string } {
  const hasEvents = itinerary.some((day) => day.events.length > 0)

  if (!hasEvents) {
    return { valid: true, message: "" } 
  }

  return validateAllEvents(itinerary)
}

function checkEventDateMatchesDay(event: any, dayDate: string): boolean {
  if (!dayDate) return true 

  const dayStart = dayjs(dayDate).startOf("day")
  const dayEnd = dayjs(dayDate).endOf("day")

  if (event.type === "transport" || event.type === "cruise") {
    if (event.departureTime) {
      const departureTime = dayjs(event.departureTime)
      if (departureTime.isBefore(dayStart) || departureTime.isAfter(dayEnd)) {
        return false
      }
    }
  } else if (event.type === "accommodation") {
    if (event.checkIn) {
      const checkInTime = dayjs(event.checkIn)
      if (checkInTime.isBefore(dayStart) || checkInTime.isAfter(dayEnd)) {
        return false
      }
    }
  } else if (event.type === "activity") {
    if (event.activityTime) {
      const activityTime = dayjs(event.activityTime)
      if (activityTime.isBefore(dayStart) || activityTime.isAfter(dayEnd)) {
        return false
      }
    }
  }

  return true
}

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

  const [currentStepImages, setCurrentStepImages] = useState(stepImages || {})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<{ [key: number]: string[] }>({})
  const [existingStepImagesState, setExistingStepImages] = useState(existingStepImages || {})

  const storageKey = getStorageKey(tripData)

  const [nonDayByDayDescription, setNonDayByDayDescription] = useState<string>("")

  useEffect(() => {
    if (!tripData.dayByDayItineraryNeeded) {
      const savedDescription = localStorage.getItem(storageKey)

      if (savedDescription) {
        setNonDayByDayDescription(savedDescription)

        if (localItinerary.length > 0) {
          const updatedItinerary = localItinerary.map((day) => ({
            ...day,
            dayDescription: savedDescription,
          }))
          setLocalItinerary(updatedItinerary)
        }
      } else if (itinerary.length > 0 && itinerary[0].dayDescription) {
        setNonDayByDayDescription(itinerary[0].dayDescription)
      }
    }
  }, [tripData.dayByDayItineraryNeeded, storageKey])

  useEffect(() => {
    if (!tripData.dayByDayItineraryNeeded && nonDayByDayDescription) {
      localStorage.setItem(storageKey, nonDayByDayDescription)
    }
  }, [nonDayByDayDescription, tripData.dayByDayItineraryNeeded, storageKey])

  useEffect(() => {

    if (!tripData.dayByDayItineraryNeeded) {
      const updatedItinerary = localItinerary.map((day) => ({
        ...day,
        dayDescription: nonDayByDayDescription,
      }))
      window.__currentItineraryData = [...updatedItinerary]
    } else {
      window.__currentItineraryData = [...localItinerary]
    }

    if (JSON.stringify(window.__currentItineraryData) !== JSON.stringify(itinerary)) {
      if (onSubmit) {
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

  useEffect(() => {
    window.__currentStepImagesData = {
      stepImages: currentStepImages,
      stepImagesToDelete,
    }

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

  const hasImageEvent = currentDay.events.some((event) => event.type === "images")

  const currentDayExistingImages = existingStepImagesState[selectedDayIndex] || []
  const currentDayExistingImageUrls = currentDayExistingImages.map((img) => img.url || img.urlInline).filter(Boolean)


  const handleStepImagesChange = (dayIndex: number, files: File[]) => {
    setCurrentStepImages((prev) => {
      const updated = {
        ...prev,
        [dayIndex]: files,
      }

      if (onStepImagesChange) {
        onStepImagesChange(dayIndex, files)
      }

      return updated
    })
  }

  const handleStepImageDelete = (dayIndex: number, imageIdOrUrl: string) => {

    const images = existingStepImagesState[dayIndex] || []
    const imageToDelete = images.find((img) => img.url === imageIdOrUrl || img.id === imageIdOrUrl)

    if (imageToDelete) {

      setStepImagesToDelete((prev) => {
        const current = prev[dayIndex] || []
        const updated = {
          ...prev,
          [dayIndex]: [...current, imageToDelete.id],
        }

        if (onStepImageDelete) {
          onStepImageDelete(dayIndex, imageToDelete.id)
        }

        return updated
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
    } else {

      if (onStepImageDelete) {
        onStepImageDelete(dayIndex, imageIdOrUrl)
      }
    }
  }

  const handleImageChange = (files: File[]) => {
    handleStepImagesChange(selectedDayIndex, files)
  }

  const handleExistingImageDelete = (imageIdOrUrl: string) => {
    handleStepImageDelete(selectedDayIndex, imageIdOrUrl)
  }

  const handleDayDescriptionChange = (value: string) => {
    if (isDayByDay) {
      const updated = [...localItinerary]
      updated[selectedDayIndex].dayDescription = value
      setLocalItinerary(updated)
    } else {
      setNonDayByDayDescription(value)

      const updated = [...localItinerary]
      updated.forEach((day) => {
        day.dayDescription = value
      })
      setLocalItinerary(updated)
    }

    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  const handleNext = () => {
    let finalItinerary = [...localItinerary]
    if (!isDayByDay) {
      finalItinerary = finalItinerary.map((day) => ({
        ...day,
        dayDescription: nonDayByDayDescription,
      }))
    } else {
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

    const dateValidationResult = validateAllEvents(finalItinerary)

    if (!dateValidationResult.valid) {
      setSnackbar({
        open: true,
        message: dateValidationResult.message,
        severity: "error",
      })
      return
    }

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

    const eventsOutsideRange = checkEventsOutsideRange(finalItinerary, tripData.startDate, tripData.endDate)

    if (eventsOutsideRange.length > 0) {
      setSnackbar({
        open: true,
        message: `${eventsOutsideRange.length} įvykiai yra už kelionės datų ribų. Prašome pataisyti įvykių datas arba kelionės intervalą.`,
        severity: "error",
      })
      return
    }

    const sortedItinerary = finalItinerary.map((day) => ({
      ...day,
      events: [...day.events].sort((a, b) => (getEarliestTime(a) || 0) - (getEarliestTime(b) || 0)),
    }))

    onSubmit(sortedItinerary)
  }

  const checkEventsOutsideRange = (
    itinerary: ItineraryDay[],
    startDateStr: string | null,
    endDateStr: string | null,
  ): TripEvent[] => {
    if (!startDateStr || !endDateStr) return []

    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0) 

    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999) 

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

    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null)
    setAddMenuOpen(false)
  }

  const removeEvent = (eventIndex: number) => {
    const updated = [...localItinerary]
    const eventToRemove = updated[selectedDayIndex].events[eventIndex]

    if (eventToRemove.type === "images") {
      const existingImages = existingStepImagesState[selectedDayIndex] || []

      if (existingImages.length > 0) {

        const imageIds = existingImages.map((img) => img.id)
        setStepImagesToDelete((prev) => ({
          ...prev,
          [selectedDayIndex]: [...(prev[selectedDayIndex] || []), ...imageIds],
        }))

        if (onStepImageDelete) {
          existingImages.forEach((img) => {
            onStepImageDelete(selectedDayIndex, img.id)
          })
        }

        setExistingStepImages((prev) => ({
          ...prev,
          [selectedDayIndex]: [],
        }))
      }

      handleStepImagesChange(selectedDayIndex, [])
    }

    updated[selectedDayIndex].events.splice(eventIndex, 1)
    setLocalItinerary(updated)

    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

  const handleEventChange = (eventIndex: number, field: string, value: any) => {
    const updated = [...localItinerary]
    updated[selectedDayIndex].events[eventIndex] = {
      ...updated[selectedDayIndex].events[eventIndex],
      [field]: value,
    }
    setLocalItinerary(updated)

    onStepImagesChange(selectedDayIndex, stepImages[selectedDayIndex] || [])
  }

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

  const addImages = () => {
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
      {isDayByDay && (
        <DaySidebar
          days={localItinerary}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
          sidebarWidth={SIDEBAR_WIDTH}
        />
      )}

      <MobileDayDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        days={localItinerary}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
      />

      <Box sx={{ flexGrow: 1, width: "100%" }}>
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

          <DayDescription
            description={isDayByDay ? currentDay.dayDescription : nonDayByDayDescription}
            isDayByDay={isDayByDay}
            onChange={handleDayDescriptionChange}
          />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Pridėti naują įvykį
            </Typography>

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
