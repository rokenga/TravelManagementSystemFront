export interface AgentOnboardingRequest {
    token: string
    password: string
    firstName: string
    lastName: string
    birthday: string
    wantsToReceiveReminders: boolean
  }
  
  export interface AgentOnboardingResponse {
    accessToken: string
    refreshToken: string
  }
  