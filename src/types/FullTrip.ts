import { TripCategory, TripStatus } from "./ClientTrip"

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

  adultsCount?: number
  childrenCount?: number
}

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
