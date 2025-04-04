import type { Dayjs } from "dayjs"

// Validation utilities for date/time constraints
export function validateDateTimeConstraints(
  startDate: Dayjs | null,
  endDate: Dayjs | null,
): { isValid: boolean; errorMessage: string | null } {
  // If either date is null, validation passes (incomplete data)
  if (!startDate || !endDate) {
    return { isValid: true, errorMessage: null }
  }

  // Check if end date is before start date
  if (endDate.isBefore(startDate)) {
    return {
      isValid: false,
      errorMessage: "Pabaigos data ir laikas negali būti ankstesni už pradžios datą ir laiką",
    }
  }

  return { isValid: true, errorMessage: null }
}

