export interface Agent {
  id: string
  email: string
  firstName: string
  lastName: string
  birthday: string
  totalTrips: number
  newClientTripsThisMonth: number
  newClientTripOffersThisMonth: number
  thisMonthsRevenue: number
  totalClients: number
  newClientsThisMonth: number
}

export interface AgentQueryParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
}
