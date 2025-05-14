"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Grid, Button, Box, Typography } from "@mui/material"
import { ArrowForward } from "@mui/icons-material"
import dayjs from "dayjs"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import ConfirmationDialog from "../ConfirmationDialog"
import CustomSnackbar from "../CustomSnackBar"

import type { Client, TripFormData, ItineraryDay } from "../../types"
import type { Country } from "../DestinationAutocomplete"

import BasicTripInfo from "./trip-info/BasicTripInfo"
import TripDetails from "./trip-info/TripDetails"
import ItineraryOptions from "./trip-info/ItineraryOptions"
import fullCountriesList from "../../assets/full-countries-lt.json"

interface Step1Props {
  initialData: TripFormData
  currentItinerary: ItineraryDay[]
  onSubmit: (data: TripFormData, updatedItinerary?: ItineraryDay[]) => void
  onDataChange?: (hasData: boolean) => void
}

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
  destination: null, 
}

export function getCurrentFormData(): TripFormData {
  return { ...currentFormData }
}

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

const Step1TripInfo: React.FC<Step1Props> = ({ initialData, currentItinerary, onSubmit, onDataChange }) => {
  const selectedClientIdRef = useRef<string>(initialData?.clientId || "")

  const initialDestination = initialData.destination ? stringToCountry(initialData.destination) : null

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
    destination: initialData?.destination || null, 
  })

  useEffect(() => {
    currentFormData = { ...formData }

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
      formData.dayByDayItineraryNeeded !== false ||
      formData.destination !== null 

    if (onDataChange) {
      onDataChange(hasData)
    }

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
  const [destination, setDestination] = useState<Country | null>(initialDestination)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")
  const [pendingDayByDayState, setPendingDayByDayState] = useState<boolean | null>(null)

  const isEditMode = window.location.pathname.includes("/edit")

  useEffect(() => {
    if (initialData?.clientId) {
      selectedClientIdRef.current = initialData.clientId
    }
  }, [initialData])

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdParam = urlParams.get("clientId")
    const clientNameParam = urlParams.get("clientName")

    if (clientIdParam && clientNameParam) {
      setFormData((prev) => ({
        ...prev,
        clientId: clientIdParam,
        clientName: clientNameParam,
      }))
      selectedClientIdRef.current = clientIdParam
      initializeSelectedClient(clientIdParam)
    } else if (initialData?.clientId) {
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

  useEffect(() => {
    if (initialData.destination) {
      const country = stringToCountry(initialData.destination)
      setDestination(country)
      setFormData((prev) => ({
        ...prev,
        destination: initialData.destination,
      }))
    }
  }, [initialData.destination])

  async function fetchClients() {
    try {
      const response = await axios.get<Client[]>(`${API_URL}/Client/lookup`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClients(response.data)

      if (selectedClientIdRef.current) {
        initializeSelectedClient(selectedClientIdRef.current)
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
    }
  }

  async function initializeSelectedClient(clientId: string) {
    const found = clients.find((c) => c.id === clientId)
    if (found) {
      setSelectedClient(found)
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: `${found.name} ${found.surname}`,
      }))
      return
    }

    try {
      const response = await axios.get<Client>(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      if (response.data) {
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
    if (name === "clientId") {
      selectedClientIdRef.current = value
    }

    setFormData((prev) => ({ ...prev, [name]: value }))

    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleClientChange(newValue: Client | null) {
    setSelectedClient(newValue || null)

    const clientIdValue = newValue && newValue.id ? String(newValue.id) : ""

    selectedClientIdRef.current = clientIdValue

    handleInputChange("clientId", clientIdValue)
    handleInputChange("clientName", newValue ? `${newValue.name} ${newValue.surname}` : null)

    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleDestinationChange(newValue: Country | null) {
    setDestination(newValue)
    handleInputChange("destination", newValue?.name || null)
  }

  function handleStartDateChange(newDate: dayjs.Dayjs | null) {
    setStartDate(newDate)
    setFormData((prev) => ({
      ...prev,
      startDate: newDate ? newDate.format("YYYY-MM-DD") : null,
    }))

    if (endDate && newDate && endDate.isBefore(newDate)) {
      setSnackbarMessage("Pabaigos data negali būti ankstesnė už pradžios datą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    }

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

    if (startDate && newDate && newDate.isBefore(startDate)) {
      setSnackbarMessage("Pabaigos data negali būti ankstesnė už pradžios datą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    }

    if (onDataChange) {
      onDataChange(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (dateError) {
      return
    }

    const newStart = startDate ? startDate.format("YYYY-MM-DD") : null
    const newEnd = endDate ? endDate.format("YYYY-MM-DD") : null
    const newDayByDay = formData.dayByDayItineraryNeeded

    const onlyDatesChanged =
      ((newStart !== initialData.startDate && initialData.startDate !== null) ||
        (newEnd !== initialData.endDate && initialData.endDate !== null)) &&
      newDayByDay === initialData.dayByDayItineraryNeeded

    if (onlyDatesChanged) {
      const eventsOutsideRange = checkEventsOutsideRange(currentItinerary, newStart, newEnd, newDayByDay)

      if (eventsOutsideRange.length > 0) {
        setWarningDialogType("dateChange")
        setEventsOutsideRange(eventsOutsideRange)
        setShowWarningDialog(true)
        return
      }
    }

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
      else {
        day.events.forEach((event: any) => {
          let eventDate: Date | null = null

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

    if (newDayByDay && newStart && newEnd) {
      updatedItinerary = rebuildDateRangeWithEvents(currentItinerary, newStart, newEnd)
    } else if (!newDayByDay) {
      const allEvents = flattenAllEvents(currentItinerary)
      updatedItinerary = [
        {
          dayLabel: newStart || "",
          dayDescription: formData.itineraryDescription || "",
          events: allEvents,
        },
      ]
    }

    const clientId = selectedClientIdRef.current

    const dataToSubmit = {
      ...formData,
      clientId: clientId,
      startDate: newStart,
      endDate: newEnd,
      destination: formData.destination, 
    }

    onSubmit(dataToSubmit, updatedItinerary)
  }

  function handleDayByDayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newCheckedState = e.target.checked
    const hasEvents = currentItinerary.some((d: any) => d.events?.length > 0)

    if (hasEvents) {
      setPendingDayByDayState(newCheckedState)
      setWarningDialogType("dayByDay")
      setShowWarningDialog(true)
    } else {
      handleInputChange("dayByDayItineraryNeeded", newCheckedState)

      if (!newCheckedState) {
        handleInputChange("itineraryTitle", "")
        handleInputChange("itineraryDescription", "")
      }
    }
  }

  function handleConfirmChange() {
    if (warningDialogType === "dayByDay") {
      if (pendingDayByDayState !== null) {
        handleInputChange("dayByDayItineraryNeeded", pendingDayByDayState)

        if (pendingDayByDayState === false) {
          handleInputChange("itineraryTitle", "")
          handleInputChange("itineraryDescription", "")
        }

        setPendingDayByDayState(null)
      }
    } else if (warningDialogType === "dateChange") {
      const newStart = startDate ? startDate.format("YYYY-MM-DD") : null
      const newEnd = endDate ? endDate.format("YYYY-MM-DD") : null
      const newDayByDay = formData.dayByDayItineraryNeeded

      proceedWithSubmit(newStart, newEnd, newDayByDay)
    }

    setShowWarningDialog(false)
  }

  function handleCancelChange() {
    setPendingDayByDayState(null)
    setShowWarningDialog(false)
  }

  function rebuildDateRangeWithEvents(oldDays: any[], newStartStr: string, newEndStr: string) {
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
    oldDays.forEach((oldDay) => {
      const found = newDays.find((d) => d.dayLabel === oldDay.dayLabel)
      if (found) {
        found.dayDescription = oldDay.dayDescription
        found.events = oldDay.events
      }
    })

    return newDays
  }

  function flattenAllEvents(days: any[]) {
    let all: any[] = []
    days.forEach((d) => {
      all = all.concat(d.events)
    })
    return all
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Pagrindinė informacija
          </Typography>
        </Grid>

        <BasicTripInfo
          tripName={formData.tripName}
          clientId={formData.clientId}
          clientName={formData.clientName}
          description={formData.description}
          clients={clients}
          selectedClient={selectedClient}
          isEditMode={isEditMode}
          destination={destination}
          onInputChange={handleInputChange}
          onClientChange={handleClientChange}
          onDestinationChange={handleDestinationChange}
        />

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Kelionės detalės
          </Typography>
        </Grid>

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
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!!dateError}
              endIcon={<ArrowForward />}
              sx={{ minWidth: 120 }}
            >
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
        onCancel={handleCancelChange}
      />

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </form>
  )
}

export default Step1TripInfo
