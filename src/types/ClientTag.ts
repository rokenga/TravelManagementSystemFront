export interface ClientTagResponse {
    id: string;
    name: string;
    category: TagCategory;
  }

  export interface CreateClientTagRequest {
    name: string;
    category: TagCategory;
  }

  export interface UpdateClientTagRequest {
    id: string;
    name: string;
    category: TagCategory;
  }

  export enum TagCategory {
    TravelFrequency = "TravelFrequency",
    TravelPreference = "TravelPreference",
    DestinationInterest = "DestinationInterest",
    SpecialRequirements = "SpecialRequirements",
    Other = "Other",
  }
  