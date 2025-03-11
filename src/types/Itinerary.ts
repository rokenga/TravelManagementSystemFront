// Types for itinerary and itinerary steps

import type { TripEvent } from "./Events"

export interface ItineraryDay {
  dayLabel: string
  dayDescription: string
  events: TripEvent[]
  originalIndex?: number
}

export interface ItineraryStep {
  id?: string
  dayNumber?: number
  description?: string
  transports?: any[]
  accommodations?: any[]
  activities?: any[]
}

export interface Itinerary {
  id?: string
  title?: string
  description?: string
  itinerarySteps?: ItineraryStep[]
}

