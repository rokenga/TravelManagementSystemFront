export enum TransportType {
  Flight = "Flight",
  Train = "Train",
  Bus = "Bus",
  Car = "Car",
  Ferry = "Ferry",
  Cruise = "Cruise",
}

export interface TransportRequest {
  transportType: TransportType;
  departureTime?: string;
  arrivalTime?: string;
  departurePlace?: string;
  arrivalPlace?: string;
  description?: string;
  companyName?: string;
  transportName?: string;
  transportCode?: string;
  cabinType?: string;
}

export interface TransportResponse {
  id: string;
  transportType: TransportType;
  departureTime?: string;
  arrivalTime?: string;
  departurePlace?: string;
  arrivalPlace?: string;
  description?: string;
  companyName?: string;
  transportName?: string;
  transportCode?: string;
  cabinType?: string;
}
