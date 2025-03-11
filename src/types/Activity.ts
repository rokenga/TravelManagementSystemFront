export interface ActivityResponse {
  id: string;
  description?: string;
  activityTime?: string;
}

export interface ActivityRequest {
  description?: string;
  activityTime?: string;
}
