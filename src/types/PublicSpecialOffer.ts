
export interface FileItem {
  id: string
  url: string
  urlInline: string 
  fileName: string 
  container: string
  type: string
  altText: string
  tripId: string
}

export interface Transport {
  transportType: "Flight" | "Car" | "Bus" | "Cruise" | "Train"
  companyName: string
  transportName: string
  transportCode: string
  cabinType?: string
  departurePlace: string
  arrivalPlace: string
  departureTime: string
  arrivalTime: string
  description?: string
  price: number
}

export interface Accommodation {
  accommodationType: string
  hotelLink: string
  hotelName: string
  roomType?: string
  checkIn: string
  checkOut: string
  boardBasis?: string
  description?: string
  price: number
  starRating?: string 
}

export interface ItineraryStep {
  description: string
  price: number
  transports: Transport[]
  accommodations: Accommodation[]
}

export interface Itinerary {
  title: string
  description: string
  steps: ItineraryStep[]
}

export interface PublicOfferDetails {
  id: string
  agentId: string
  destination: string
  tripName: string
  description: string
  category: string
  status: string
  offerStatus: string
  price: number
  startDate: string
  endDate: string
  validUntil: string
  adultsCount: number
  childrenCount: number
  itinerary: Itinerary
  files: FileItem[]
}
