export interface ClientRequest {
  name: string
  surname: string
  email: string
  phoneNumber: string
  birthday?: Date
  notes: string
  idCardValidUntil?: Date
  companyId?: string
  occupation?: string
}

export interface ClientResponse {
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  birthday: Date
  notes: string
  createdAt: Date
  isTransferred: boolean
  transferredFromAgentName?: string
  idCardValidUntil?: Date
  companyId?: string
  occupation?: string
  companyName?: string
}

export interface Client {
  id: string
  name: string
  surname: string
  email?: string
}

export interface Tag {
  id: string
  name: string
  color: string
}
