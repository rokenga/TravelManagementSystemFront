// Types for trip data

import type { TripCategory, TripStatus, PaymentStatus } from "./Enums"
import type { Itinerary, ItineraryDay } from "./Itinerary"

// Form data used in the wizard
export interface TripFormData {
  tripName: string
  clientId: string
  clientName: string | null
  description: string
  startDate: string | null
  endDate: string | null
  category: string
  status?: TripStatus
  paymentStatus?: PaymentStatus
  price: number
  adultsCount: number | null
  childrenCount: number | null
  insuranceTaken: boolean
  dayByDayItineraryNeeded: boolean
  itineraryTitle?: string
  itineraryDescription?: string
  images?: File[]
  documents?: File[]
}

// State for the wizard form
export interface WizardFormState {
  tripData: TripFormData
  itinerary: ItineraryDay[]
  validationWarnings: ValidationWarning[]
  images: File[]
  documents: File[]
}

// Request to create or update a trip
export interface TripRequest {
  agentId?: string | null
  clientId?: string | null
  tripName?: string | null
  description?: string | null
  category?: TripCategory | null
  status?: TripStatus | null
  paymentStatus?: PaymentStatus | null
  insuranceTaken?: boolean | null
  startDate?: Date | null
  endDate?: Date | null
  price?: number | null
  dayByDayItineraryNeeded?: boolean | null
  itinerary?: Itinerary
  adultsCount?: number | null
  childrenCount?: number | null
  images?: File[]
  documents?: File[]
}

// Response from the server
export interface TripResponse {
  id: string
  agentId?: string
  clientId?: string
  tripName?: string
  description?: string
  category?: TripCategory
  status?: TripStatus
  paymentStatus?: PaymentStatus
  insuranceTaken?: boolean
  startDate?: string
  endDate?: string
  price?: number
  adultsCount?: number
  childrenCount?: number
  dayByDayItineraryNeeded: boolean
  itinerary?: Itinerary
  images?: string[]
  documents?: string[]
}

// Import ValidationWarning
import type { ValidationWarning } from "./Common"

