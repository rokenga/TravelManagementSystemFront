"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
} from "@mui/material"
import CustomDateTimePicker from "./CustomDatePicker"
import CloseIcon from "@mui/icons-material/Close"
import dayjs from "dayjs"

export interface CloneTripOptions {
  newStartDate: string | null
  newEndDate: string | null
  cloneMainInformation: boolean
  cloneItinerary: boolean
  newDayByDay: boolean
  cloneImages: boolean
}

interface CloneTripModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (options: CloneTripOptions) => void
  initialStartDate?: string | null
  initialEndDate?: string | null
  loading?: boolean
}

const CloneTripModal: React.FC<CloneTripModalProps> = ({
  open,
  onClose,
  onConfirm,
  initialStartDate,
  initialEndDate,
  loading = false,
}) => {
  const [options, setOptions] = useState<CloneTripOptions>({
    newStartDate: initialStartDate || null,
    newEndDate: initialEndDate || null,
    cloneMainInformation: true,
    cloneItinerary: true,
    cloneImages: true,
    newDayByDay: true,
  })

  // Calculate the duration between original start and end dates
  const calculateTripDuration = () => {
    if (initialStartDate && initialEndDate) {
      const start = dayjs(initialStartDate)
      const end = dayjs(initialEndDate)
      // Return the difference in days, adding 1 to include the last day
      return end.diff(start, "day") + 1
    }
    return 0
  }

  // Update end date when start date changes
  useEffect(() => {
    if (options.newStartDate) {
      const tripDuration = calculateTripDuration()
      if (tripDuration > 0) {
        // Calculate new end date by adding the original duration (minus 1 day) to the new start date
        const newEndDate = dayjs(options.newStartDate).add(tripDuration - 1, "day")
        setOptions((prev) => ({
          ...prev,
          newEndDate: newEndDate.format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        }))
      }
    }
  }, [options.newStartDate, initialStartDate, initialEndDate])

  const handleDateChange = (field: "newStartDate" | "newEndDate", value: dayjs.Dayjs | null) => {
    if (field === "newStartDate") {
      setOptions({
        ...options,
        [field]: value ? value.format("YYYY-MM-DDTHH:mm:ss.SSSZ") : null,
      })
    }
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    })
  }

  const handleConfirm = () => {
    onConfirm(options)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 5,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">Klonuoti kelionę</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Pasirinkite naujos kelionės datas:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <CustomDateTimePicker
                  label="Pradžios data"
                  value={options.newStartDate ? dayjs(options.newStartDate) : null}
                  onChange={(date) => handleDateChange("newStartDate", date)}
                  showTime={false}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomDateTimePicker
                  label="Pabaigos data"
                  value={options.newEndDate ? dayjs(options.newEndDate) : null}
                  onChange={(date) => handleDateChange("newEndDate", date)}
                  showTime={false}
                  readOnly={true} // Use read-only mode instead of disabled
                  helperText="Automatiškai apskaičiuota pagal pradinės kelionės trukmę"
                />
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Pasirinkite, ką norite kopijuoti:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, ml: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.cloneMainInformation}
                    onChange={handleCheckboxChange}
                    name="cloneMainInformation"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Kopijuoti pagrindinę kelionės informaciją"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.cloneItinerary}
                    onChange={handleCheckboxChange}
                    name="cloneItinerary"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Kopijuoti maršruto informaciją"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.cloneImages}
                    onChange={handleCheckboxChange}
                    name="cloneImages"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Kopijuoti nuotraukas"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.newDayByDay}
                    onChange={handleCheckboxChange}
                    name="newDayByDay"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Reikalingas kiekvienos dienos planas"
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ textTransform: "none" }}
        >
          {loading ? "Vykdoma..." : "Klonuoti kelionę"}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="secondary"
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Atšaukti
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CloneTripModal

