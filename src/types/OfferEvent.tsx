export interface FileResponse {
    id: string
    url: string
    altText?: string
  }
  
  export interface OfferEvent {
    stepDayNumber: number
    optionName?: string
    eventType?: string
    startDate?: string
    endDate?: string
    startTimeDisplay?: string
    endTimeDisplay?: string
    title?: string
    details?: string
    images?: FileResponse[]
  }
  
  export interface ClientOfferItineraryResponse {
    sortedEvents?: OfferEvent[]
  }
  
  export interface SpecialOfferResponse {
    id: string
    agentId?: string
    clientId?: string
    tripName?: string
    description?: string
    clientWishes?: string
    status?: number
    category?: string
    startDate?: string
    endDate?: string
    childrenCount?: number
    adultsCount?: number
    price?: number
    itinerary?: ClientOfferItineraryResponse
    images?: FileResponse[]
  }
  
  