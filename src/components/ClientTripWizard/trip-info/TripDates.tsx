"use client"

import type React from "react"
import { Grid, Typography } from "@mui/material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../../CustomDatePicker"

interface TripDatesProps {
  startDate: Dayjs | null
  endDate: Dayjs | null
  dateError: string | null
  onStartDateChange: (newDate: Dayjs | null) => void
  onEndDateChange: (newDate: Dayjs | null) => void
}

const TripDates: React.FC<TripDatesProps> = ({ startDate, endDate, dateError, onStartDateChange, onEndDateChange }) => {
  return (
    <>
      <Grid item xs={12} md={6}>
        <CustomDateTimePicker label="Data nuo" value={startDate} onChange={onStartDateChange} showTime={false} />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomDateTimePicker
          label="Data iki"
          value={endDate}
          onChange={onEndDateChange}
          showTime={false}
          minDate={startDate}
        />
        {dateError && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
            {dateError}
          </Typography>
        )}
      </Grid>
    </>
  )
}

export default TripDates

