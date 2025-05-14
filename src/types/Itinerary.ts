
import type { TripEvent } from "./Events"

export interface ItineraryDay {
  id?: string
  dayLabel: string
  dayDescription: string
  events: TripEvent[]
  originalIndex?: number
  
  existingStepImages?: Array<{ 
    id: string; 
    url: string; 
  }>
  newStepImages?: File[]        
  stepImagesToDelete?: string[] 
}

export interface ItineraryStep {
  id?: string
  dayNumber?: number
  description?: string
  transports?: any[]
  accommodations?: any[]
  activities?: any[]
  stepImages?: File[]
  stepImageUrls?: string[] 
  stepImagesToDelete?: string[] 
}

export interface Itinerary {
  id?: string
  title?: string
  description?: string
  itinerarySteps?: ItineraryStep[]
}

export interface EditItineraryRequest {
  title?: string
  description?: string
  steps?: EditItineraryStepRequest[]
}

export interface EditItineraryStepRequest {
  id?: string
  dayNumber?: number
  description?: string
  transports?: any[]
  accommodations?: any[]
  activities?: any[]
  stepImagesToDelete?: string[] 
}
