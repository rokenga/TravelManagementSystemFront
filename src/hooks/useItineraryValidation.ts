"use client"

import { useState } from "react"
import { validateEventDates, validateEventInTripRange, getEarliestTime } from "../Utils/eventValidation"

interface Day {
  dayLabel: string
  dayDescription: string
  events: any[]
}

export function useItineraryValidation() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "error" | "success" }>({
    open: false,
    message: "",
    severity: "error",
  })

  const validateItinerary = (itinerary: Day[], tripData: any): boolean => {
    for (const day of itinerary) {
      for (const event of day.events) {
        if (!validateEventDates(event)) {
          setSnackbar({
            open: true,
            message: "Kai kurie įvykiai turi neteisingai nustatytas datas. Patikrinkite ir pataisykite prieš tęsdami.",
            severity: "error",
          })
          return false
        }

        if (
          !tripData.dayByDayItineraryNeeded &&
          !validateEventInTripRange(event, tripData.startDate, tripData.endDate)
        ) {
          setSnackbar({
            open: true,
            message:
              "Kai kurie įvykiai yra už kelionės datų ribų. Prašome pataisyti įvykių datas arba kelionės intervalą.",
            severity: "error",
          })
          return false
        }
      }
    }
    return true
  }

  const sortItineraryEvents = (itinerary: Day[]): Day[] => {
    return itinerary.map((day) => ({
      ...day,
      events: [...day.events].sort((a, b) => (getEarliestTime(a) || 0) - (getEarliestTime(b) || 0)),
    }))
  }

  return {
    snackbar,
    setSnackbar,
    validateItinerary,
    sortItineraryEvents,
  }
}

