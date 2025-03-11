export interface ClientRequest {
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    address: string;
    notes: string;
    tags?: Tag[]
  }

export interface ClientResponse {
    id: string;
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    address: string;
    notes: string;
    createdAt: Date;
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
  

