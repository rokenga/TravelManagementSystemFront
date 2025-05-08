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

export enum OfferStatus {
  Draft = "Draft",
  Confirmed = "Confirmed"
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
  clientFullName?: string
  tripName?: string
  description?: string
  category?: TripCategory
  status?: TripStatus
  paymentStatus?: PaymentStatus
  insuranceTaken?: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  price?: number
  adultsCount?: number
  childrenCount?: number
  dayByDayItineraryNeeded: boolean
  destination?: string
  isTransferred?: boolean
  transferredFromAgentName?: string
  agentFirstName?: string
  agentLastName?: string
}

/** ======= Pagination & Filtering Types ======= **/

export interface TripQueryParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sortBy?: string
  descending?: boolean
  category?: TripCategory
  status?: TripStatus
  startDate?: string
  endDate?: string
  priceMin?: number
  priceMax?: number
  // Add these new fields for array support
  categories?: TripCategory[]
  statuses?: TripStatus[]
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export enum TransportType {
  Flight = "Flight",
  Train = "Train",
  Bus = "Bus",
  Car = "Car",
  Ferry = "Ferry",
  Cruise = "Cruise",
}

