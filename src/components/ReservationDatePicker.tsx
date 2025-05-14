"use client"

import type React from "react"
import { Box, FormHelperText, TextField, InputAdornment } from "@mui/material"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import type { Dayjs } from "dayjs"
import "dayjs/locale/lt"
import CalendarIcon from "@mui/icons-material/CalendarToday"

interface CustomDateTimePickerProps {
  label: string
  value: Dayjs | null
  onChange: (newDateTime: Dayjs | null) => void
  showTime?: boolean
  minDate?: Date | null
  maxDate?: Date | null
  disablePast?: boolean
  disableFuture?: boolean
  disabled?: boolean
  helperText?: string
  readOnly?: boolean
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
  const minDateDayjs = minDate ? dayjs(minDate) : undefined
  const maxDateDayjs = maxDate ? dayjs(maxDate) : undefined

  if (readOnly) {
    const formattedValue = value ? value.format(showTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD") : ""

    return (
      <Box>
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
              color: "rgba(0, 0, 0, 0.87)",
            },
          }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="lt">
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        format="YYYY-MM-DD"
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            error: !!helperText && (helperText.includes("privaloma") || helperText.includes("negali")),
            helperText: helperText,
            InputProps: {
              sx: {
                height: "40px", 
                "& .MuiInputBase-input": {
                  height: "22px", 
                  padding: "8.5px 14px", 
                },
              },
            },
          },
        }}
        minDate={minDateDayjs}
        maxDate={maxDateDayjs}
        disablePast={disablePast}
        disableFuture={disableFuture}
        disabled={disabled}
        sx={{
          width: "100%",
          "& .MuiInputBase-root": {
            borderRadius: 1,
          },
        }}
      />
    </LocalizationProvider>
  )
}

export default CustomDateTimePicker
