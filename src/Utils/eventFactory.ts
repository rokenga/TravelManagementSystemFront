import type { TransportEvent, AccommodationEvent, ActivityEvent } from "../types"
import { TransportType } from "../types"

export const createTransportEvent = (): TransportEvent => ({
  type: "transport",
  transportType: TransportType.Flight,
  departureTime: "",
  arrivalTime: "",
  departurePlace: "",
  arrivalPlace: "",
  description: "",
  companyName: "",
  transportName: "",
  transportCode: "",
})

export const createAccommodationEvent = (): AccommodationEvent => ({
  type: "accommodation",
  hotelName: "",
  hotelLink: "",
  checkIn: "",
  checkOut: "",
  description: "",
  boardBasis: undefined,
  roomType: "",
})

export const createActivityEvent = (): ActivityEvent => ({
  type: "activity",
  activityTime: "",
  description: "",
})

export const createCruiseEvent = (): TransportEvent => ({
  type: "cruise",
  transportType: TransportType.Cruise,
  cruiseName: "",
  departureTime: "",
  arrivalTime: "",
  departurePort: "",
  arrivalPort: "",
  description: "",
})

