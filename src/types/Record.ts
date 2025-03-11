export interface RecordRequest {
    title: string;
    content: string;
  }

export interface RecordResponse {
    id: string;
    title: string;
    author: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }

