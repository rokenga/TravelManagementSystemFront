export enum PartnerType {
    HotelSystem = 0,
    Guide = 1,
    DestinationPartner = 2,
    TransportCompany = 3,
    Other = 4,
  }
  
  export const partnerTypeColors: Record<PartnerType, string> = {
    [PartnerType.HotelSystem]: "#42A5F5", // Blue
    [PartnerType.Guide]: "#AB47BC", // Purple
    [PartnerType.DestinationPartner]: "#FFA726", // Orange
    [PartnerType.TransportCompany]: "#66BB6A", // Green
    [PartnerType.Other]: "#757575", // Grey
  }
  
  export interface CreatePartnerRequest {
    name?: string
    type: PartnerType
    region?: string
    country?: string
    city?: string
    websiteUrl?: string
    email?: string
    phone?: string
    facebook?: string
    loginInfo?: string
    notes?: string
    isVisibleToAll: boolean
  }
  
  export interface PartnerResponse {
    id: string
    name?: string
    type: PartnerType
    region?: string
    country?: string
    city?: string
    websiteUrl?: string
    email?: string
    phone?: string
    facebook?: string
    loginInfo?: string
    notes?: string
    createdAt: string
    logoUrl?: string
    isVisibleToAll: boolean
    createdBy: string
  }
  