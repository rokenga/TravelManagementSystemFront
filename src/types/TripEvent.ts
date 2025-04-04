export interface TripEvent {
    stepDayNumber: number;
    description: string;
    time?: string;
    details?: string;
    images?: FileResponse[];
  }
  
  export interface FileResponse {
    id: string;
    url: string;
    altText?: string;
  }
  