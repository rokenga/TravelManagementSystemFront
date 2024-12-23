export interface CommentRequest {
    text: string;
    recordId: string
  }

export interface CommentResponse {
    id: string;
    text: string;
    recordId: string
    author: string
    createdAt: Date
    updatedAt: Date
  }