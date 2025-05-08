export enum ReservationStatus {
    New = 0,
    Contacted = 1,
    InProgress = 2,
    Confirmed = 3,
    Cancelled = 4
  }
  
  export interface ParticipantResponse {
    id: string
    name: string
    surname: string
    birthDate: string
  }
  
  export interface ReservationResponse {
    id: string
    email: string | null
    phoneNumber: string | null
    status: ReservationStatus
    createdAt: string
    participants: ParticipantResponse[]
  }
  
  export interface PublicOfferWithReservationCountResponse {
    id: string
    tripName: string | null
    startDate: string | null
    endDate: string | null
    reservationCount: number
  }

  export interface ReservationQueryParams
  {
    pageNumber: number,
    pageSize: number,
    statuses: string[]
  }
