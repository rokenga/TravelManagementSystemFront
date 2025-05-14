import { TripStatus, TripCategory } from "./ClientTrip"
import { TripReviewResponse } from "./TripReview"
export interface PaginationParams {
  pageNumber: number
  pageSize: number
}


export interface ClientTripListResponse {
  id: string
  tripName?: string
  destination?: string
  startDate?: string
  endDate?: string
  status?: TripStatus
  category?: TripCategory
  price?: number
  adultCount: number
  childCount: number
  review?: TripReviewResponse
}
