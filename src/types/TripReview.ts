export interface CreateTripReviewRequest {
    tripId: string
    text: string
    rating: number
  }
  
  export interface TripReviewResponse {
    id: string
    tripId: string
    text: string
    rating: number
    createdAt: string
  }
  