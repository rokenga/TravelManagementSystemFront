
import type { TransportType, BoardBasisType } from "./Enums"

export interface BaseEvent {
  id?: string
  description?: string
}

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

export interface AccommodationEvent extends BaseEvent {
  type: "accommodation"
  hotelName?: string
  checkIn?: string
  checkOut?: string
  hotelLink?: string
  boardBasis?: BoardBasisType
  roomType?: string
}

export interface ActivityEvent extends BaseEvent {
  type: "activity"
  activityTime?: string
}

export interface ImageEvent extends BaseEvent {
  type: "images"
  description?: string
}

export type TripEvent = TransportEvent | AccommodationEvent | ActivityEvent | ImageEvent

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

