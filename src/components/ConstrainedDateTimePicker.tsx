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
  const [hasShownError, setHasShownError] = useState(false)

  const handleChange = (newDateTime: Dayjs | null) => {
    if (!newDateTime) {
      onChange(null)
      return
    }

    let isValid = true
    let errorMessage = ""

    if (minDate && newDateTime.isBefore(minDate)) {
      isValid = false
      errorMessage = `${label} negali būti ankstesnis nei ${minDate.format("YYYY-MM-DD HH:mm")}`
    }

    if (maxDate && newDateTime.isAfter(maxDate)) {
      isValid = false
      errorMessage = `${label} negali būti vėlesnis nei ${maxDate.format("YYYY-MM-DD HH:mm")}`
    }

    if (isValid) {
      onChange(newDateTime)
      setHasShownError(false)
    } else if (onValidationError && !hasShownError) {
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

