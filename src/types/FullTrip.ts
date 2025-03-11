import { TripCategory, TripStatus } from "./ClientTrip"

/**
 * Your front-end wizard state shape:
 * All properties are optional except those you truly require in the wizard steps.
 * We removed `itinerary` from here because you're storing it separately in the wizard.
 */
export interface TripFormData {
  tripName?: string
  description?: string
  startDate?: string
  endDate?: string
  clientId?: string
  category?: TripCategory
  status?: TripStatus

  price?: number
  dayByDayItineraryNeeded?: boolean
  insuranceTaken?: boolean

  // unify adult/child naming with the backend
  adultsCount?: number
  childrenCount?: number
}

/**
 * If you want day-by-day info in the same object, you could add it. But
 * you store it separately in the wizard's local state.
 */
export interface ItineraryDay {
  dayLabel: string
  dayDescription: string
  events: TripEvent[]
}

export interface TripEvent {
  type: "transport" | "accommodation" | "activity" | ""
  transportType?: string
  departureTime?: string
  arrivalTime?: string
  departurePlace?: string
  arrivalPlace?: string
  hotelName?: string
  checkIn?: string
  checkOut?: string
  description?: string
  activityTime?: string
}
