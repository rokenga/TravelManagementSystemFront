import type { TripEvent } from "../types"

/* Return time information from event */
export function formatEarliestTime(e: TripEvent): {
  timeStr: string
  date: Date | null
  departureTime: Date | null
  departureTimeStr: string
  arrivalTime: Date | null
  arrivalTimeStr: string
  isMultiDay: boolean
} {
  let departureTime: Date | null = null
  let arrivalTime: Date | null = null
  let departureTimeStr = ""
  let arrivalTimeStr = ""

  // Get departure and arrival times for transport and cruise
  if (e.type === "transport" || e.type === "cruise") {
    if (e.departureTime) {
      departureTime = new Date(e.departureTime)
      departureTimeStr = departureTime.toLocaleTimeString("lt-LT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    if (e.arrivalTime) {
      arrivalTime = new Date(e.arrivalTime)
      arrivalTimeStr = arrivalTime.toLocaleTimeString("lt-LT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  // Find earliest time for sorting
  const times: number[] = []
  if (e.type === "transport" || e.type === "cruise") {
    if (e.departureTime) times.push(new Date(e.departureTime).getTime())
    if (e.arrivalTime) times.push(new Date(e.arrivalTime).getTime())
  } else if (e.type === "accommodation") {
    if (e.checkIn) times.push(new Date(e.checkIn).getTime())
    if (e.checkOut) times.push(new Date(e.checkOut).getTime())
  } else if (e.type === "activity") {
    if (e.activityTime) times.push(new Date(e.activityTime).getTime())
  }

  const valid = times.filter((x) => !isNaN(x))
  if (!valid.length)
    return {
      timeStr: "",
      date: null,
      departureTime,
      departureTimeStr,
      arrivalTime,
      arrivalTimeStr,
      isMultiDay: false,
    }

  const earliest = Math.min(...valid)
  const d = new Date(earliest)

  // Check if transport or cruise spans multiple days
  const isMultiDay = departureTime && arrivalTime && departureTime.toDateString() !== arrivalTime.toDateString()

  return {
    timeStr: d.toLocaleTimeString("lt-LT", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: d,
    departureTime,
    departureTimeStr,
    arrivalTime,
    arrivalTimeStr,
    isMultiDay,
  }
}

/* Build main line for event */
export function buildLine(e: TripEvent): string {
  switch (e.type) {
    case "transport":
      return transportLine(e)
    case "cruise":
      return cruiseLine(e)
    case "accommodation":
      return accommodationLine(e)
    case "activity":
      return e.description || "Veikla"
    default:
      return e.description || "Kita veikla"
  }
}

/* For transport, e.g. "Skrydis iš ??? į ???" */
export function transportLine(e: TripEvent): string {
  if (e.type !== "transport") return ""

  const from = e.departurePlace || "?"
  const to = e.arrivalPlace || "?"

  // Map transport type to Lithuanian label
  const transportTypes = [
    { value: "flight", label: "Skrydis" },
    { value: "train", label: "Traukinys" },
    { value: "bus", label: "Autobusas" },
    { value: "car", label: "Automobilis" },
    { value: "ferry", label: "Keltas" },
  ]

  const typeObj = transportTypes.find((t) => t.value === e.transportType) || { label: "Transportas" }
  const type = typeObj.label

  return `${type} iš ${from} į ${to}`
}

/* For cruise, e.g. "Kruizas iš ??? į ???" */
export function cruiseLine(e: TripEvent): string {
  if (e.type !== "cruise") return ""

  const from = e.departurePlace || "?"
  const to = e.arrivalPlace || "?"
  const cruiseName = e.transportName ? `"${e.transportName}"` : ""

  return `Kruizas ${cruiseName} iš ${from} į ${to}`
}

/* For accommodation, e.g. "Įsiregistravimas: Hotel X" or "Įsiregistravimas/Išsiregistravimas: Hotel X" */
export function accommodationLine(e: TripEvent): string {
  if (e.type !== "accommodation") return ""

  const hotel = e.hotelName || "Viešbutis"
  if (e.checkIn && e.checkOut) {
    return `Įsiregistravimas/Išsiregistravimas: ${hotel}`
  } else if (e.checkIn && !e.checkOut) {
    return `Įsiregistravimas: ${hotel}`
  } else if (!e.checkIn && e.checkOut) {
    return `Išsiregistravimas: ${hotel}`
  }
  return `Nakvynė: ${hotel}`
}

