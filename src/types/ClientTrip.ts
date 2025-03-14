export enum TripCategory {
  Tourist = "Tourist",
  Group = "Group",
  Relax = "Relax",
  Business = "Business",
  Cruise = "Cruise",
}

export enum TripStatus {
  Draft = "Draft",
  Confirmed = "Confirmed",
  Cancelled = "Cancelled",
}

export enum PaymentStatus {
  Unpaid = "Unpaid",
  PartiallyPaid = "PartiallyPaid",
  Paid = "Paid",
}

export interface CreateTripRequest {
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
  dayByDayItineraryNeeded?: boolean

  // The final itinerary structure
  itinerary?: {
    title?: string
    description?: string
    itinerarySteps?: Array<{
      dayNumber?: number
      description?: string
      transports?: any[]
      accommodations?: any[]
      activities?: any[]
    }>
  }

  childrenCount?: number
  adultsCount?: number
}

export interface TripResponse {
  itinerary: any
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
}
