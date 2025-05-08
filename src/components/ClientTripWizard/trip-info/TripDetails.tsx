"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, TextField, MenuItem, FormControlLabel, Checkbox, InputAdornment, Box } from "@mui/material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../../CustomDatePicker"
import CustomSnackbar from "../../CustomSnackBar"

interface TripDetailsProps {
  category: string
  price: number | string
  adultsCount: number | null
  childrenCount: number | null
  insuranceTaken: boolean
  startDate: Dayjs | null
  endDate: Dayjs | null
  dateError: string | null
  onInputChange: (name: string, value: any) => void
  onStartDateChange: (newDate: Dayjs | null) => void
  onEndDateChange: (newDate: Dayjs | null) => void
}

const TripDetails: React.FC<TripDetailsProps> = ({
  category,
  price,
  adultsCount,
  childrenCount,
  insuranceTaken,
  startDate,
  endDate,
  dateError,
  onInputChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error" as "error" | "success" | "info" | "warning",
  })

  // Set default adult count to 2 when component mounts if it's null
  useEffect(() => {
    if (adultsCount === null) {
      onInputChange("adultsCount", 2)
    }
  }, [adultsCount, onInputChange])

  // Handle price change with validation
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = Number.parseFloat(value)

    // Don't allow negative values
    if (numValue < 0) {
      setSnackbar({
        open: true,
        message: "Kaina negali būti neigiama",
        severity: "error",
      })
      onInputChange("price", 0)
    } else {
      onInputChange("price", value === "" ? 0 : numValue)
    }
  }

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    })
  }

  // Custom styles to match heights
  const datePickerStyle = {
    "& .MuiInputBase-root": {
      height: "56px", // Match the height of other controls
    },
    "& .MuiOutlinedInput-input": {
      paddingTop: "16.5px",
      paddingBottom: "16.5px",
    },
  }

  return (
    <>
      {/* First row: Date fields only */}
      <Grid item xs={12} sm={6} md={6}>
        <Box sx={datePickerStyle}>
          <CustomDateTimePicker label="Data nuo" value={startDate} onChange={onStartDateChange} showTime={false} />
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={6}>
        <Box sx={datePickerStyle}>
          <CustomDateTimePicker
            label="Data iki"
            value={endDate}
            onChange={onEndDateChange}
            showTime={false}
            minDate={startDate}
            helperText={dateError || ""}
          />
        </Box>
      </Grid>

      {/* Second row: Category, Price, Adults count, Children count */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select
          label="Kelionės kategorija"
          value={category}
          onChange={(e) => onInputChange("category", e.target.value)}
          fullWidth
        >
          <MenuItem value="">--Nepasirinkta--</MenuItem>
          <MenuItem value="Tourist">Pažintinė</MenuItem>
          <MenuItem value="Group">Grupinė</MenuItem>
          <MenuItem value="Relax">Poilsinė</MenuItem>
          <MenuItem value="Business">Verslo</MenuItem>
          <MenuItem value="Cruise">Kruizas</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label="Kaina"
          type="number"
          value={price}
          onChange={handlePriceChange}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">€</InputAdornment>,
            inputProps: {
              min: 0,
              step: "0.01",
            },
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label="Suaugusių skaičius"
          type="number"
          value={adultsCount === null ? 2 : adultsCount}
          onChange={(e) => {
            const value = e.target.value
            const numValue = Number.parseInt(value, 10)

            // Ensure value is at least 1
            if (value === "" || numValue < 1) {
              onInputChange("adultsCount", 1)
            } else {
              onInputChange("adultsCount", numValue)
            }
          }}
          fullWidth
          inputProps={{ min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label="Vaikų skaičius"
          type="number"
          value={childrenCount === null ? 0 : childrenCount}
          onChange={(e) => {
            const value = e.target.value
            const numValue = Number.parseInt(value, 10)

            // Ensure value is not negative
            if (value === "" || numValue < 0) {
              onInputChange("childrenCount", 0)
            } else {
              onInputChange("childrenCount", numValue)
            }
          }}
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Grid>

      {/* Insurance checkbox */}
      <Grid item xs={12} sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Checkbox checked={insuranceTaken} onChange={(e) => onInputChange("insuranceTaken", e.target.checked)} />
          }
          label="Ar reikalingas draudimas?"
        />
      </Grid>

      {/* Custom Snackbar for error messages */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </>
  )
}

export default TripDetails
