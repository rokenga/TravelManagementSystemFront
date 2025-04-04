"use client"

import type React from "react"
import { useState } from "react"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "./CustomDatePicker"

interface ConstrainedDateTimePickerProps {
  label: string
  value: Dayjs | null
  onChange: (newDateTime: Dayjs | null) => void
  minDate?: Dayjs | null
  maxDate?: Dayjs | null
  onValidationError?: (errorMessage: string) => void
  disablePast?: boolean
  disableFuture?: boolean
}

const ConstrainedDateTimePicker: React.FC<ConstrainedDateTimePickerProps> = ({
  label,
  value,
  onChange,
  minDate = null,
  maxDate = null,
  onValidationError,
  disablePast = false,
  disableFuture = false,
}) => {
  // Track if we've shown an error for this field to avoid duplicate messages
  const [hasShownError, setHasShownError] = useState(false)

  const handleChange = (newDateTime: Dayjs | null) => {
    // Always accept null values (user clearing the field)
    if (!newDateTime) {
      onChange(null)
      return
    }

    let isValid = true
    let errorMessage = ""

    // Check minDate constraint
    if (minDate && newDateTime.isBefore(minDate)) {
      isValid = false
      errorMessage = `${label} negali būti ankstesnis nei ${minDate.format("YYYY-MM-DD HH:mm")}`
    }

    // Check maxDate constraint
    if (maxDate && newDateTime.isAfter(maxDate)) {
      isValid = false
      errorMessage = `${label} negali būti vėlesnis nei ${maxDate.format("YYYY-MM-DD HH:mm")}`
    }

    if (isValid) {
      // Valid date - clear any previous error state
      onChange(newDateTime)
      setHasShownError(false)
    } else if (onValidationError && !hasShownError) {
      // Show error message and mark that we've shown it
      onValidationError(errorMessage)
      setHasShownError(true)
    }
  }

  return (
    <CustomDateTimePicker
      label={label}
      value={value}
      onChange={handleChange}
      showTime={true}
      minDate={minDate}
      maxDate={maxDate}
      disablePast={disablePast}
      disableFuture={disableFuture}
    />
  )
}

export default ConstrainedDateTimePicker

