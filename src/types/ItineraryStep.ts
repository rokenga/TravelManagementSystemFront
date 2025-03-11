import { TransportResponse, TransportRequest } from "./Transport";
import { AccommodationResponse, AccommodationRequest } from "./Accommodation";
import { ActivityResponse, ActivityRequest } from "./Activity";

export interface ItineraryStepResponse {
  id: string;
  dayNumber?: number;
  description?: string;
  transports?: TransportResponse[];
  accommodations?: AccommodationResponse[];
  activities?: ActivityResponse[];
}

export interface ItineraryStepRequest {
  dayNumber?: number;
  description?: string;
  transports?: TransportRequest[];
  accommodations?: AccommodationRequest[];
  activities?: ActivityRequest[];
}
