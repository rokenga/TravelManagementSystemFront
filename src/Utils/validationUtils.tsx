import type { Dayjs } from "dayjs"

export function validateDateTimeConstraints(
  startDate: Dayjs | null,
  endDate: Dayjs | null,
): { isValid: boolean; errorMessage: string | null } {
  if (!startDate || !endDate) {
    return { isValid: true, errorMessage: null }
  }

  if (endDate.isBefore(startDate)) {
    return {
      isValid: false,
      errorMessage: "Pabaigos data ir laikas negali būti ankstesni už pradžios datą ir laiką",
    }
  }

  return { isValid: true, errorMessage: null }
}

