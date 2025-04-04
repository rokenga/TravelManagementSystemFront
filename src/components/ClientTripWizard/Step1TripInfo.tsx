"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Grid, Button, Box } from "@mui/material"
import dayjs from "dayjs"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import ConfirmationDialog from "../ConfirmationDialog"

// Import types
import type { Client, TripFormData, ItineraryDay } from "../../types"

// Import components
import BasicTripInfo from "./trip-info/BasicTripInfo"
//import TripDates from "./trip-info/TripDates"
import TripDetails from "./trip-info/TripDetails"
import ItineraryOptions from "./trip-info/ItineraryOptions"

interface Step1Props {
  initialData: TripFormData
  currentItinerary: ItineraryDay[]
  onSubmit: (data: TripFormData, updatedItinerary?: ItineraryDay[]) => void
  onDataChange?: (hasData: boolean) => void
}

// Add a global variable to store the current form data
let currentFormData: TripFormData = {
  tripName: "",
  clientId: "",
  clientName: null,
  description: "",
  startDate: null,
  endDate: null,
  category: "",
  price: 0,
  adultsCount: null,
  childrenCount: null,
  insuranceTaken: false,
  dayByDayItineraryNeeded: false,
  itineraryTitle: "",
  itineraryDescription: "",
}

// Export a function to get the current form data
export function getCurrentFormData(): TripFormData {
  console.log("Getting current form data:", currentFormData)
  return { ...currentFormData }
}

const Step1TripInfo: React.FC<Step1Props> = ({ initialData, currentItinerary, onSubmit, onDataChange }) => {
  // Store the selected client ID in a ref to ensure it's not lost
  const selectedClientIdRef = useRef<string>(initialData?.clientId || "")

  const [formData, setFormData] = useState<TripFormData>({
    tripName: initialData?.tripName || "",
    clientId: initialData?.clientId || "",
    clientName: initialData?.clientName || null,
    description: initialData?.description || "",
    startDate: initialData?.startDate || null,
    endDate: initialData?.endDate || null,
    category: initialData?.category || "",
    price: initialData?.price || 0,
    adultsCount: initialData?.adultsCount || null,
    childrenCount: initialData?.childrenCount || null,
    insuranceTaken: initialData?.insuranceTaken || false,
    dayByDayItineraryNeeded: initialData?.dayByDayItineraryNeeded || false,
    itineraryTitle: initialData?.itineraryTitle || "",
    itineraryDescription: initialData?.itineraryDescription || "",
  })

  // Update the global currentFormData whenever formData changes
  useEffect(() => {
    currentFormData = { ...formData }
    console.log("Updated current form data:", currentFormData)

    // Check if any data has been entered
    const hasData =
      formData.tripName?.trim() !== "" ||
      formData.clientId?.trim() !== "" ||
      formData.startDate !== null ||
      formData.endDate !== null ||
      formData.category?.trim() !== "" ||
      formData.description?.trim() !== "" ||
      formData.adultsCount !== null ||
      formData.childrenCount !== null ||
      formData.price !== 0 ||
      formData.dayByDayItineraryNeeded !== false

    // Notify parent component
    if (onDataChange) {
      onDataChange(hasData)
    }

    // Also dispatch a custom event for components that can't receive props
    const event = new CustomEvent("step1DataChanged", { detail: { hasData } })
    window.dispatchEvent(event)
  }, [formData, onDataChange])

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialData?.startDate ? dayjs(initialData.startDate) : null,
  )
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(initialData?.endDate ? dayjs(initialData.endDate) : null)
  const [isMultipleDays, setIsMultipleDays] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [warningDialogType, setWarningDialogType] = useState<"dayByDay" | "dateChange">("dayByDay")
  const [dateError, setDateError] = useState<string | null>(null)
  const [eventsOutsideRange, setEventsOutsideRange] = useState<any[]>([])

  // Check if we're in edit mode by looking at the URL
  const isEditMode = window.location.pathname.includes("/edit")

  // Initialize the ref with the initial client ID
  useEffect(() => {
    if (initialData?.clientId) {
      selectedClientIdRef.current = initialData.clientId
      console.log("Initialized clientIdRef with:", selectedClientIdRef.current)
    }
  }, [initialData])

  useEffect(() => {
    fetchClients()
  }, [])

  // Initialize from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdParam = urlParams.get("clientId")
    const clientNameParam = urlParams.get("clientName")

    if (clientIdParam && clientNameParam) {
      console.log("Setting client from URL params:", clientIdParam, clientNameParam)
      setFormData((prev) => ({
        ...prev,
        clientId: clientIdParam,
        clientName: clientNameParam,
      }))
      selectedClientIdRef.current = clientIdParam
      initializeSelectedClient(clientIdParam)
    } else if (initialData?.clientId) {
      // If no URL params but we have initialData, use that
      console.log("Setting client from initialData:", initialData.clientId, initialData.clientName)
      selectedClientIdRef.current = initialData.clientId
      initializeSelectedClient(initialData.clientId)
    }
  }, [initialData])

  useEffect(() => {
    if (startDate && endDate) {
      if (endDate.isBefore(startDate)) {
        setDateError("Pabaigos data negali būti ankstesnė už pradžios datą")
      } else {
        setDateError(null)
        setIsMultipleDays(endDate.diff(startDate, "day") > 0)
      }
    } else {
      setDateError(null)
    }
  }, [startDate, endDate])

  async function fetchClients() {
    try {
      const response = await axios.get<Client[]>(`${API_URL}/Client/lookup`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClients(response.data)

      // If we have a clientId, try to select it
      if (selectedClientIdRef.current) {
        initializeSelectedClient(selectedClientIdRef.current)
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
    }
  }

  async function initializeSelectedClient(clientId: string) {
    console.log("Initializing selected client with ID:", clientId)

    // If we already have the list of clients, see if we can find one matching
    const found = clients.find((c) => c.id === clientId)
    if (found) {
      console.log("Found client in existing list:", found)
      setSelectedClient(found)
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: `${found.name} ${found.surname}`,
      }))
      return
    }

    // Otherwise try a direct fetch
    try {
      const response = await axios.get<Client>(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      if (response.data) {
        console.log("Fetched client directly:", response.data)
        setSelectedClient(response.data)
        setFormData((prev) => ({
          ...prev,
          clientId: response.data.id,
          clientName: `${response.data.name} ${response.data.surname}`,
        }))
      }
    } catch (err) {
      console.error("Failed to load single client:", err)
    }
  }

  function handleInputChange(name: string, value: any) {
    console.log(`Setting ${name} to:`, value, "Type:", typeof value)

    // Special handling for clientId to ensure it's also updated in the ref
    if (name === "clientId") {
      selectedClientIdRef.current = value
    }

    // Update form state
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Notify parent component directly about changes
    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleClientChange(newValue: Client | null) {
    setSelectedClient(newValue || null)

    // Explicitly convert to string and ensure it's not undefined
    const clientIdValue = newValue && newValue.id ? String(newValue.id) : ""
    console.log("Setting client ID:", clientIdValue, "Type:", typeof clientIdValue)

    // Update both the form state and the ref
    selectedClientIdRef.current = clientIdValue

    handleInputChange("clientId", clientIdValue)
    handleInputChange("clientName", newValue ? `${newValue.name} ${newValue.surname}` : null)

    // Notify parent component directly about changes
    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleStartDateChange(newDate: dayjs.Dayjs | null) {
    setStartDate(newDate)
    setFormData((prev) => ({
      ...prev,
      startDate: newDate ? newDate.format("YYYY-MM-DD") : null,
    }))

    // Notify parent component directly about changes
    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleEndDateChange(newDate: dayjs.Dayjs | null) {
    setEndDate(newDate)
    setFormData((prev) => ({
      ...prev,
      endDate: newDate ? newDate.format("YYYY-MM-DD") : null,
    }))

    // Notify parent component directly about changes
    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (dateError) {
      return
    }

    // Build new itinerary (or merge) if needed
    const newStart = startDate ? startDate.format("YYYY-MM-DD") : null
    const newEnd = endDate ? endDate.format("YYYY-MM-DD") : null
    const newDayByDay = formData.dayByDayItineraryNeeded

    // Check if dates have actually changed from the initial data
    const datesChanged =
      newStart !== initialData.startDate ||
      newEnd !== initialData.endDate ||
      newDayByDay !== initialData.dayByDayItineraryNeeded

    // Only check for events outside range if dates have actually changed
    if (datesChanged) {
      // Check if any events would be lost due to date changes
      const eventsOutsideRange = checkEventsOutsideRange(currentItinerary, newStart, newEnd, newDayByDay)

      if (eventsOutsideRange.length > 0) {
        // Show warning dialog about events that would be lost
        setWarningDialogType("dateChange")
        setEventsOutsideRange(eventsOutsideRange)
        setShowWarningDialog(true)
        return
      }
    }

    // If no events would be lost or user confirmed, proceed
    proceedWithSubmit(newStart, newEnd, newDayByDay)
  }

  function checkEventsOutsideRange(
    itinerary: any[],
    newStart: string | null,
    newEnd: string | null,
    isDayByDay: boolean,
  ): any[] {
    if (!newStart || !newEnd) return []

    const startDate = new Date(newStart)
    const endDate = new Date(newEnd)
    const eventsOutsideRange: any[] = []

    itinerary.forEach((day) => {
      const dayDate = new Date(day.dayLabel)

      // For day-by-day itinerary, check if the day is outside the new range
      if (isDayByDay) {
        if (dayDate < startDate || dayDate > endDate) {
          if (day.events.length > 0) {
            eventsOutsideRange.push({
              dayLabel: day.dayLabel,
              eventCount: day.events.length,
            })
          }
        }
      }
      // For non-day-by-day itinerary, check individual events
      else {
        day.events.forEach((event: any) => {
          let eventDate: Date | null = null

          // Get the relevant date from the event based on its type
          if (event.type === "transport" || event.type === "cruise") {
            eventDate = event.departureTime ? new Date(event.departureTime) : null
          } else if (event.type === "accommodation") {
            eventDate = event.checkIn ? new Date(event.checkIn) : null
          } else if (event.type === "activity") {
            eventDate = event.activityTime ? new Date(event.activityTime) : null
          }

          if (eventDate && (eventDate < startDate || eventDate > endDate)) {
            eventsOutsideRange.push({
              eventType: event.type,
              eventDate: eventDate.toISOString().split("T")[0],
            })
          }
        })
      }
    })

    return eventsOutsideRange
  }

  function proceedWithSubmit(newStart: string | null, newEnd: string | null, newDayByDay: boolean) {
    let updatedItinerary = [...currentItinerary]

    // If dayByDay is true, build or merge the date range
    if (newDayByDay && newStart && newEnd) {
      updatedItinerary = rebuildDateRangeWithEvents(currentItinerary, newStart, newEnd)
    } else if (!newDayByDay) {
      // Single-day approach
      // Flatten or store events in a single array
      const allEvents = flattenAllEvents(currentItinerary)
      updatedItinerary = [
        {
          dayLabel: newStart || "",
          dayDescription: formData.itineraryDescription || "",
          events: allEvents,
        },
      ]
    }

    // Use the client ID from the ref to ensure it's not lost
    const clientId = selectedClientIdRef.current
    console.log("Using clientId from ref:", clientId)

    const dataToSubmit = {
      ...formData,
      clientId: clientId,
      startDate: newStart,
      endDate: newEnd,
    }

    console.log("Submitting from Step1, clientId:", dataToSubmit.clientId, "Type:", typeof dataToSubmit.clientId)
    console.log("Full form data being submitted:", dataToSubmit)

    onSubmit(dataToSubmit, updatedItinerary)
  }

  function handleDayByDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (currentItinerary.some((d: any) => d.events?.length > 0) && e.target.checked) {
      // Show warning dialog
      setWarningDialogType("dayByDay")
      setShowWarningDialog(true)
    } else {
      // Directly update the state if no itinerary exists
      handleInputChange("dayByDayItineraryNeeded", e.target.checked)
    }
  }

  function handleConfirmChange() {
    if (warningDialogType === "dayByDay") {
      // If user says "Yes," we disable dayByDay
      handleInputChange("dayByDayItineraryNeeded", false)
    } else if (warningDialogType === "dateChange") {
      // If user confirms date change, proceed with submission
      const newStart = startDate ? startDate.format("YYYY-MM-DD") : null
      const newEnd = endDate ? endDate.format("YYYY-MM-DD") : null
      const newDayByDay = formData.dayByDayItineraryNeeded

      proceedWithSubmit(newStart, newEnd, newDayByDay)
    }

    setShowWarningDialog(false)
  }

  /**
   * Rebuild a day-by-day itinerary from a new start/end date,
   * merging existing events if the dayLabel matches.
   */
  function rebuildDateRangeWithEvents(oldDays: any[], newStartStr: string, newEndStr: string) {
    // step 1: build array of all days from newStart to newEnd
    const newDays: any[] = []
    const start = dayjs(newStartStr)
    const end = dayjs(newEndStr)
    let current = start.clone()
    while (current.isBefore(end) || current.isSame(end, "day")) {
      newDays.push({
        dayLabel: current.format("YYYY-MM-DD"),
        dayDescription: "",
        events: [],
      })
      current = current.add(1, "day")
    }

    // step 2: try to merge from oldDays
    oldDays.forEach((oldDay) => {
      const found = newDays.find((d) => d.dayLabel === oldDay.dayLabel)
      if (found) {
        found.dayDescription = oldDay.dayDescription
        found.events = oldDay.events
      }
    })

    return newDays
  }

  /**
   * Flatten all events from multiple day arrays into one big array
   */
  function flattenAllEvents(days: any[]) {
    let all: any[] = []
    days.forEach((d) => {
      all = all.concat(d.events)
    })
    return all
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <BasicTripInfo
          tripName={formData.tripName}
          clientId={formData.clientId}
          clientName={formData.clientName}
          description={formData.description}
          clients={clients}
          selectedClient={selectedClient}
          isEditMode={isEditMode}
          onInputChange={handleInputChange}
          onClientChange={handleClientChange}
        />

        <TripDetails
          category={formData.category}
          price={formData.price}
          adultsCount={formData.adultsCount}
          childrenCount={formData.childrenCount}
          insuranceTaken={formData.insuranceTaken}
          startDate={startDate}
          endDate={endDate}
          dateError={dateError}
          onInputChange={handleInputChange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />

        <ItineraryOptions
          isMultipleDays={isMultipleDays}
          dayByDayItineraryNeeded={formData.dayByDayItineraryNeeded}
          itineraryTitle={formData.itineraryTitle || ""}
          itineraryDescription={formData.itineraryDescription || ""}
          onDayByDayChange={handleDayByDayChange}
          onInputChange={handleInputChange}
        />

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" size="large" disabled={!!dateError}>
              Toliau
            </Button>
          </Box>
        </Grid>
      </Grid>

      <ConfirmationDialog
        open={showWarningDialog}
        title={warningDialogType === "dayByDay" ? "Dėmesio" : "Įspėjimas dėl datų keitimo"}
        message={
          warningDialogType === "dayByDay"
            ? "Pakeitus maršruto tipą, visi įvesti įvykiai bus ištrinti. Ar tikrai norite tęsti?"
            : formData.dayByDayItineraryNeeded
              ? `Pakeitus kelionės datas, ${eventsOutsideRange.length} dienos su įvykiais nebepateks į kelionės intervalą. Šie įvykiai bus pašalinti. Ar tikrai norite tęsti?`
              : `Pakeitus kelionės datas, ${eventsOutsideRange.length} įvykiai nebepateks į kelionės intervalą. Prašome pataisyti įvykių datas arba kelionės intervalą. Ar tikrai norite tęsti?`
        }
        onConfirm={handleConfirmChange}
        onCancel={() => setShowWarningDialog(false)}
      />
    </form>
  )
}

export default Step1TripInfo

