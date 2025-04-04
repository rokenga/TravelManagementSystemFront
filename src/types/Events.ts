// Types for different event types in the trip

import type { TransportType, BoardBasisType } from "./Enums"

// Base interface for all events
export interface BaseEvent {
  id?: string
  description?: string
}

// Transport event
export interface TransportEvent extends BaseEvent {
  type: "transport" | "cruise"
  transportType: TransportType
  departureTime?: string
  arrivalTime?: string
  departurePlace?: string
  arrivalPlace?: string
  companyName?: string
  transportName?: string
  transportCode?: string
  cabinType?: string
}

// Accommodation event
export interface AccommodationEvent extends BaseEvent {
  type: "accommodation"
  hotelName?: string
  checkIn?: string
  checkOut?: string
  hotelLink?: string
  boardBasis?: BoardBasisType
  roomType?: string
}

// Activity event
export interface ActivityEvent extends BaseEvent {
  type: "activity"
  activityTime?: string
}

// Image event
export interface ImageEvent extends BaseEvent {
  type: "images"
  description?: string
}

// Union type for all event types
export type TripEvent = TransportEvent | AccommodationEvent | ActivityEvent | ImageEvent

// Type guard functions
export function isTransportEvent(event: TripEvent): event is TransportEvent {
  return event.type === "transport" || event.type === "cruise"
}

export function isAccommodationEvent(event: TripEvent): event is AccommodationEvent {
  return event.type === "accommodation"
}

export function isActivityEvent(event: TripEvent): event is ActivityEvent {
  return event.type === "activity"
}

export function isImageEvent(event: TripEvent): event is ImageEvent {
  return event.type === "images"
}

