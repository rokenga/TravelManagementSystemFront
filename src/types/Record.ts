import { CommentResponse } from "./Comment";
export interface RecordRequest {
    title: string;
    content: string;
    destinationId: string
  }

export interface RecordResponse {
    id: string;
    title: string;
    author: string;
    content: string;
    destinationId: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface RecordWithCommentsResponse extends RecordResponse{
    comments: CommentResponse[];
}
