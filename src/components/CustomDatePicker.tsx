import React from "react";
import { Box } from "@mui/material";
import { DatePicker, TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/lt";

// Ensure month names start with capital letters
const capitalizeMonths = (locale: any) => {
  const originalMonths = locale.options?.months;
  if (originalMonths) {
    locale.options.months = originalMonths.map(
      (month: string) => month.charAt(0).toUpperCase() + month.slice(1)
    );
  }
  return locale;
};

interface CustomDateTimePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (newDateTime: Dayjs | null) => void;
  showTime?: boolean; // Whether to show the time picker
  minDate?: Dayjs | null; // Minimum allowed date
  maxDate?: Dayjs | null; // Maximum allowed date
  disablePast?: boolean; // Whether to disable past dates
  disableFuture?: boolean; // Whether to disable future dates
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
}) => {
  const handleDateChange = (date: Dayjs | null) => {
    if (!date) {
      onChange(null);
      return;
    }
    
    // If we have a current value, preserve the time when changing the date
    if (value) {
      onChange(date.hour(value.hour()).minute(value.minute()));
    } else {
      // Otherwise, set default time (noon)
      onChange(date.hour(12).minute(0));
    }
  };

  const handleTimeChange = (time: Dayjs | null) => {
    if (!time || !value) return;
    
    // Keep the current date but update the time
    onChange(value.hour(time.hour()).minute(time.minute()));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={capitalizeMonths("lt")}>
      <Box display="flex" gap={2}>
        <DatePicker
          label={`${label} (Data)`}
          value={value}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          slotProps={{ 
            textField: { 
              fullWidth: true,
              size: "small" 
            }
          }}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
          disableFuture={disableFuture}
        />
        {showTime && (
          <TimePicker
            label={`${label} (Laikas)`}
            value={value}
            onChange={handleTimeChange}
            ampm={false}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                size: "small"
              }
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default CustomDateTimePicker;
