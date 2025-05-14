import dayjs from "dayjs"

export const getEarliestTime = (e: any): number | null => {
  const times: number[] = []
  if (e.departureTime) times.push(new Date(e.departureTime).getTime())
  if (e.arrivalTime) times.push(new Date(e.arrivalTime).getTime())
  if (e.checkIn) times.push(new Date(e.checkIn).getTime())
  if (e.checkOut) times.push(new Date(e.checkOut).getTime())
  if (e.activityTime) times.push(new Date(e.activityTime).getTime())
  const valid = times.filter((t) => !isNaN(t))
  if (!valid.length) return null
  return Math.min(...valid)
}

export const validateEventDates = (event: any): boolean => {
  if (event.type === "transport" || event.type === "cruise") {
    if (event.departureTime && isNaN(new Date(event.departureTime).getTime())) return false
    if (event.arrivalTime && isNaN(new Date(event.arrivalTime).getTime())) return false

    if (event.departureTime && event.arrivalTime) {
      const departureTime = new Date(event.departureTime).getTime()
      const arrivalTime = new Date(event.arrivalTime).getTime()
      if (arrivalTime < departureTime) return false
    }
  } else if (event.type === "accommodation") {
    if (event.checkIn && isNaN(new Date(event.checkIn).getTime())) return false
    if (event.checkOut && isNaN(new Date(event.checkOut).getTime())) return false

    if (event.checkIn && event.checkOut) {
      const checkInTime = new Date(event.checkIn).getTime()
      const checkOutTime = new Date(event.checkOut).getTime()
      if (checkOutTime < checkInTime) return false
    }
  } else if (event.type === "activity") {
    if (event.activityTime && isNaN(new Date(event.activityTime).getTime())) return false
  }
  return true
}

export const validateEventInTripRange = (event: any, startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true

  const tripStartDate = new Date(startDate)
  tripStartDate.setHours(0, 0, 0, 0) // Set to start of day

  const tripEndDate = new Date(endDate)
  tripEndDate.setHours(23, 59, 59, 999) // Set to end of day

  if (event.type === "transport" || event.type === "cruise") {
    if (event.departureTime) {
      const departureDate = new Date(event.departureTime)
      if (departureDate < tripStartDate || departureDate > tripEndDate) {
        return false
      }
    }

    if (event.arrivalTime) {
      const arrivalDate = new Date(event.arrivalTime)
      if (arrivalDate < tripStartDate || arrivalDate > tripEndDate) {
        return false
      }
    }
  } else if (event.type === "accommodation") {
    if (event.checkIn) {
      const checkInDate = new Date(event.checkIn)
      if (checkInDate < tripStartDate || checkInDate > tripEndDate) {
        return false
      }
    }

    if (event.checkOut) {
      const checkOutDate = new Date(event.checkOut)
      if (checkOutDate < tripStartDate || checkOutDate > tripEndDate) {
        return false
      }
    }
  } else if (event.type === "activity") {
    if (event.activityTime) {
      const activityDate = new Date(event.activityTime)
      if (activityDate < tripStartDate || activityDate > tripEndDate) {
        return false
      }
    }
  }

  return true
}

export const formatDayDate = (dateStr: string) => {
  const date = dayjs(dateStr)
  if (!date.isValid()) return ""
  return date.format("YYYY-MM-DD")
}

export const getEventTitle = (event: any): string => {
  switch (event.type) {
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

export const isEventComplete = (event: any): boolean => {
  if (!event || !event.type) return false

  switch (event.type) {
    case "transport":
      return Boolean(
        event.transportType && event.departureTime && event.arrivalTime && event.departurePlace && event.arrivalPlace,
      )

    case "cruise":
      return Boolean(event.departureTime && event.arrivalTime && event.departurePlace && event.arrivalPlace)

    case "accommodation":
      return Boolean(event.hotelName && event.checkIn && event.checkOut)

    case "activity":
      return Boolean(event.activityTime && event.description)

    case "images":
      const hasNewImages = Boolean(event.stepImages && event.stepImages.length > 0)
      const hasExistingImages = Boolean(event.existingImageUrls && event.existingImageUrls.length > 0)
      return hasNewImages || hasExistingImages

    default:
      return false
  }
}

export const validateAllEvents = (
  itinerary: any[],
  requireComplete = false,
): {
  valid: boolean
  message: string
  incompleteEvents: { dayIndex: number; eventIndex: number; type: string }[]
} => {
  const incompleteEvents: { dayIndex: number; eventIndex: number; type: string }[] = []

  for (let dayIndex = 0; dayIndex < itinerary.length; dayIndex++) {
    const day = itinerary[dayIndex]

    for (let eventIndex = 0; eventIndex < day.events.length; eventIndex++) {
      const event = day.events[eventIndex]

      if (!validateEventDates(event)) {
        return {
          valid: false,
          message: "Kai kurie įvykiai turi neteisingai nustatytas datas. Patikrinkite ir pataisykite prieš tęsdami.",
          incompleteEvents: [],
        }
      }

      if (requireComplete && !isEventComplete(event)) {
        incompleteEvents.push({
          dayIndex,
          eventIndex,
          type: event.type,
        })
      }
    }
  }

  if (requireComplete && incompleteEvents.length > 0) {
    return {
      valid: false,
      message: `${incompleteEvents.length} įvykiai neturi visų reikalingų duomenų. Prašome užpildyti visus privalomus laukus.`,
      incompleteEvents,
    }
  }

  return {
    valid: true,
    message: "",
    incompleteEvents: [],
  }
}

export const checkEventsOutsideRange = (
  itinerary: any[],
  startDateStr: string | null,
  endDateStr: string | null,
): any[] => {
  if (!startDateStr || !endDateStr) return []

  const startDate = new Date(startDateStr)
  startDate.setHours(0, 0, 0, 0) 

  const endDate = new Date(endDateStr)
  endDate.setHours(23, 59, 59, 999) 

  const eventsOutsideRange: any[] = []

  itinerary.forEach((day) => {
    day.events.forEach((event: any) => {
      if (!validateEventInTripRange(event, startDateStr, endDateStr)) {
        eventsOutsideRange.push(event)
      }
    })
  })

  return eventsOutsideRange
}

