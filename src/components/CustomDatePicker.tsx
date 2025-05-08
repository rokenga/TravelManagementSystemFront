"use client"

import type React from "react"
import { Box, FormHelperText, TextField, InputAdornment } from "@mui/material"
import { DateTimePicker, DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import type { Dayjs } from "dayjs"
import "dayjs/locale/lt"
import CalendarIcon from "@mui/icons-material/CalendarToday"

// Ensure month names start with capital letters
const capitalizeMonths = (locale: any) => {
  const originalMonths = locale.options?.months
  if (originalMonths) {
    locale.options.months = originalMonths.map((month: string) => month.charAt(0).toUpperCase() + month.slice(1))
  }
  return locale
}

interface CustomDateTimePickerProps {
  label: string
  value: Dayjs | null
  onChange: (newDateTime: Dayjs | null) => void
  showTime?: boolean // Whether to show the time picker
  minDate?: Dayjs | null // Minimum allowed date
  maxDate?: Dayjs | null // Maximum allowed date
  disablePast?: boolean // Whether to disable past dates
  disableFuture?: boolean // Whether to disable future dates
  disabled?: boolean // Whether the field is disabled
  helperText?: string // Optional helper text
  readOnly?: boolean // Whether the field is read-only but looks normal
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  showTime = true,
  minDate = null,
  maxDate = null,
  disablePast = false,
  disableFuture = false,
  disabled = false,
  helperText,
  readOnly = false,
}) => {
  // For read-only mode, we'll use a custom TextField instead of the DatePicker
  if (readOnly) {
    const formattedValue = value ? value.format(showTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD") : ""

    return (
      <Box data-datepicker="true">
        <TextField
          label={label}
          value={formattedValue}
          fullWidth
          size="small"
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <CalendarIcon sx={{ color: "rgba(0, 0, 0, 0.54)" }} />
              </InputAdornment>
            ),
            sx: {
              cursor: "default",
              color: "rgba(0, 0, 0, 0.87)", // Normal text color
            },
          }}
          data-datepicker="true"
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </Box>
    )
  }

  // Regular date picker for non-read-only mode
  const commonProps = {
    label,
    value,
    onChange,
    slotProps: {
      textField: {
        fullWidth: true,
        size: "small" as const,
        disabled,
        inputProps: {
          "data-tab-button": "true",
          "data-datepicker": "true",
        },
        "data-datepicker": "true",
      },
      popper: {
        sx: {
          "& .MuiPaper-root": {
            "data-tab-button": "true",
            "data-datepicker": "true",
          },
        },
      },
      // Add data attributes to all other slots
      day: {
        "data-datepicker": "true",
      },
      calendarHeader: {
        "data-datepicker": "true",
      },
      actionBar: {
        "data-datepicker": "true",
      },
      toolbar: {
        "data-datepicker": "true",
      },
      layout: {
        "data-datepicker": "true",
      },
      field: {
        "data-datepicker": "true",
      },
    },
    minDate: minDate || undefined,
    maxDate: maxDate || undefined,
    disablePast,
    disableFuture,
    "data-datepicker": "true",
  }

  return (
    <Box data-datepicker="true">
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={capitalizeMonths("lt")}>
        {showTime ? (
          <DateTimePicker {...commonProps} format="YYYY-MM-DD HH:mm" ampm={false} />
        ) : (
          <DatePicker {...commonProps} format="YYYY-MM-DD" />
        )}
      </LocalizationProvider>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </Box>
  )
}

export default CustomDateTimePicker