export enum TripRequestStatus {
    New ="New",
    Locked ="Locked",
    Confirmed ="Confirmed",
  }
  
  export interface TripRequestCreate {
    fullName: string
    phoneNumber: string
    email: string
    message?: string
  }
  
  export interface TripRequestResponse {
    id: string
    fullName: string
    phoneNumber: string
    email: string
    message?: string
    status: TripRequestStatus
    createdAt: string 
    agentId?: string
  }
  
  