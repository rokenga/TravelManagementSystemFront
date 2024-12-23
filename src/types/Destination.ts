import { RecordResponse, RecordWithCommentsResponse } from "../types/Record";

export interface DestinationRequest {
    country: string;
    city: string;
    description:string;
  }

export interface DestinationResponse {
    id: string;
    country: string;
    city: string;
    description:string;
  }

  export interface DestinationWithAllRecordsResponse extends DestinationResponse {
    records: RecordResponse[];
  }

  export interface DestinationWithRecordsAndCommentsResponse extends DestinationResponse {
    record: RecordWithCommentsResponse;
  }