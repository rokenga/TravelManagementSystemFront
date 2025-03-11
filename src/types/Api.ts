// Types for API requests and responses

import type { TransportType, BoardBasisType } from "./Enums"

// Transport
export interface TransportRequest {
  transportType?: TransportType | null
  departureTime?: Date | null
  arrivalTime?: Date | null
  departurePlace?: string | null
  arrivalPlace?: string | null
  description?: string | null
  companyName?: string | null
  transportName?: string | null
  transportCode?: string | null
  cabinType?: string | null
}

export interface TransportResponse {
  id: string
  transportType: TransportType
  departureTime?: string
  arrivalTime?: string
  departurePlace?: string
  arrivalPlace?: string
  description?: string
  companyName?: string
  transportName?: string
  transportCode?: string
  cabinType?: string
}

// Accommodation
export interface AccommodationRequest {
  hotelName?: string | null
  checkIn?: Date | null
  checkOut?: Date | null
  hotelLink?: string | null
  description?: string | null
  boardBasis?: BoardBasisType | null
  roomType?: string | null
}

export interface AccommodationResponse {
  id: string
  hotelName?: string
  checkIn?: string
  checkOut?: string
  hotelLink?: string
  description?: string
  boardBasis?: BoardBasisType
  roomType?: string
}

// Activity
export interface ActivityRequest {
  description?: string | null
  activityTime?: Date | null
}

export interface ActivityResponse {
  id: string
  description?: string
  activityTime?: string
}

// Itinerary Step
export interface ItineraryStepRequest {
  dayNumber?: number | null
  description?: string | null
  transports?: TransportRequest[]
  accommodations?: AccommodationRequest[]
  activities?: ActivityRequest[]
}

export interface ItineraryStepResponse {
  id: string
  dayNumber?: number
  description?: string
  transports?: TransportResponse[]
  accommodations?: AccommodationResponse[]
  activities?: ActivityResponse[]
}

// Itinerary
export interface ItineraryRequest {
  title?: string | null
  description?: string | null
  itinerarySteps?: ItineraryStepRequest[]
}

export interface ItineraryResponse {
  id: string
  title?: string
  description?: string
  itinerarySteps?: ItineraryStepResponse[]
}

// Trip
export interface CreateTripRequest {
  agentId?: string | null
  clientId?: string | null
  tripName?: string | null
  description?: string | null
  category?: string | null
  status?: string | null
  paymentStatus?: string | null
  insuranceTaken?: boolean | null
  startDate?: Date | null
  endDate?: Date | null
  price?: number | null
  dayByDayItineraryNeeded?: boolean | null
  itinerary?: ItineraryRequest
  adultsCount?: number | null
  childrenCount?: number | null
}

