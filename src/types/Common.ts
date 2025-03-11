// Common types used across the application

export type Severity = "success" | "error" | "info" | "warning"

export interface SnackbarState {
  open: boolean
  message: string
  severity: Severity
}

export interface ValidationWarning {
  message: string
  type: "info" | "warning"
}

export interface Client {
  id: string
  name: string
  surname: string
  email?: string
}

