// Types for itinerary and itinerary steps

import type { TripEvent } from "./Events"

export interface ItineraryDay {
  id?: string
  dayLabel: string
  dayDescription: string
  events: TripEvent[]
  originalIndex?: number
  
  // New approach:
  existingStepImages?: Array<{ 
    id: string; 
    url: string; 
  }>
  newStepImages?: File[]         // local files user uploads
  stepImagesToDelete?: string[]  // IDs of images to delete
}

export interface ItineraryStep {
  id?: string
  dayNumber?: number
  description?: string
  transports?: any[]
  accommodations?: any[]
  activities?: any[]
  stepImages?: File[]
  stepImageUrls?: string[] // For displaying existing images
  stepImagesToDelete?: string[] // IDs of images to delete
}

export interface Itinerary {
  id?: string
  title?: string
  description?: string
  itinerarySteps?: ItineraryStep[]
}

// New interface for edit requests
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
  stepImagesToDelete?: string[] // IDs of images to delete
}
