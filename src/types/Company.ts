export interface CompanyRequest {
    name: string
    companyCode: string
    vatCode?: string
    phoneNumber?: string
    email?: string
    website?: string
    address?: string
}
  
export interface CompanyResponse {
    id: string
    name: string
    companyCode: string
    vatCode?: string
    phoneNumber?: string
    email?: string
    website?: string
    address?: string
}
  
export interface CompanyClientResponse {
    id: string
    name: string
    surname: string
    email: string
    phoneNumber: string
    occupation?: string
}
  
export interface CompanyWithEmployeesResponse {
    id: string
    name: string
    companyCode: string
    vatCode?: string
    phoneNumber?: string
    email?: string
    website?: string
    address?: string
    employees: CompanyClientResponse[]
}
  