"use client"

import type React from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import { ExpandMore, Delete as DeleteIcon, Hotel } from "@mui/icons-material"
import ConstrainedDateTimePicker from "../../ConstrainedDateTimePicker"
import StarRating from "../../StarRating"
import type { Accommodation } from "../CreatePublicOfferWizardForm"
import { useMediaQuery, useTheme } from "@mui/material"

interface AccommodationItemProps {
  accommodation: Accommodation
  index: number
  formData: any
  handleAccommodationChange: (accIndex: number, field: keyof Accommodation, value: any) => void
  handleAccommodationDateChange: (accIndex: number, field: "checkIn" | "checkOut", value: any) => void
  handleRemoveAccommodation: (accIndex: number) => void
  timeErrors: Record<string, string | null>
  setSnackbarMessage: (message: string) => void
  setSnackbarSeverity: (severity: "success" | "error" | "info" | "warning") => void
  setSnackbarOpen: (open: boolean) => void
  isEditing: boolean
}

const Star = ({ color = "gold" }: { color?: string }) => <span style={{ fontSize: "1rem", color }}>★</span>

const AccommodationItem: React.FC<AccommodationItemProps> = ({
  accommodation: acc,
  index: accIndex,
  formData,
  handleAccommodationChange,
  handleAccommodationDateChange,
  handleRemoveAccommodation,
  timeErrors,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  isEditing,
}) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  const boardBasisOptions = [
    { value: "BedAndBreakfast", label: "Nakvynė su pusryčiais" },
    { value: "HalfBoard", label: "Pusryčiai ir vakarienė" },
    { value: "FullBoard", label: "Pusryčiai, pietūs ir vakarienė" },
    { value: "AllInclusive", label: "Viskas įskaičiuota" },
    { value: "UltraAllInclusive", label: "Ultra viskas įskaičiuota" },
  ]

  // Format date for display in the header
  const formatDate = (date: any) => {
    if (!date) return "Nenustatyta"
    return date.format("YYYY-MM-DD")
  }

  return (
    <Accordion key={`acc-${accIndex}`} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`acc-content-${accIndex}`}
        id={`acc-header-${accIndex}`}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            flexDirection: isSmall ? "column" : "row",
            alignItems: isSmall ? "flex-start" : "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: isSmall ? 1 : 0 }}>
            <Hotel sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              {acc.hotelName ? `Apgyvendinimas - ${acc.hotelName}` : `Apgyvendinimas ${accIndex + 1}`}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              ml: isSmall ? 0 : 2,
              width: isSmall ? "100%" : "auto",
              justifyContent: isSmall ? "space-between" : "flex-end",
            }}
          >
            <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
              {`${formatDate(acc.checkIn)} - ${formatDate(acc.checkOut)}`}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {acc.price.toFixed(2)} €
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveAccommodation(accIndex)
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
        {/* First row: Hotel name and link */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Viešbučio pavadinimas"
              value={acc.hotelName}
              onChange={(e) => handleAccommodationChange(accIndex, "hotelName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Viešbučio nuoroda"
              placeholder="https://..."
              value={acc.hotelLink}
              onChange={(e) => handleAccommodationChange(accIndex, "hotelLink", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {/* Second row: Check-in/Check-out times, Meal type, Room type */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Atvykimo data"
              value={acc.checkIn}
              onChange={(newDate) => handleAccommodationDateChange(accIndex, "checkIn", newDate)}
              minDate={isEditing ? undefined : formData.startDate}
              maxDate={formData.endDate ? formData.endDate.endOf("day") : undefined}
              onValidationError={(errorMessage) => {
                setSnackbarMessage(errorMessage)
                setSnackbarSeverity("error")
                setSnackbarOpen(true)
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Išvykimo data"
              value={acc.checkOut}
              onChange={(newDate) => handleAccommodationDateChange(accIndex, "checkOut", newDate)}
              minDate={acc.checkIn || formData.startDate}
              maxDate={formData.endDate ? formData.endDate.endOf("day") : undefined}
              onValidationError={(errorMessage) => {
                setSnackbarMessage(errorMessage)
                setSnackbarSeverity("error")
                setSnackbarOpen(true)
              }}
            />
            {timeErrors[`acc-${accIndex}`] && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeErrors[`acc-${accIndex}`]}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Maitinimo tipas</InputLabel>
              <Select
                value={acc.boardBasis}
                onChange={(e) => handleAccommodationChange(accIndex, "boardBasis", e.target.value)}
                label="Maitinimo tipas"
              >
                <MenuItem value="">-- Pasirinkite --</MenuItem>
                {boardBasisOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kambario tipas"
              value={acc.roomType}
              onChange={(e) => handleAccommodationChange(accIndex, "roomType", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {/* Third row: Star rating and description */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <StarRating
              value={acc.starRating ?? null}
              onChange={(newValue) => handleAccommodationChange(accIndex, "starRating", newValue)}
              label="Žvaigždučių reitingas"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <TextField
              label="Papildomas aprašymas"
              value={acc.description}
              onChange={(e) => handleAccommodationChange(accIndex, "description", e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>

        {/* Fourth row: Price */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}></Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Kaina (€)"
              type="number"
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              value={acc.price}
              onChange={(e) => handleAccommodationChange(accIndex, "price", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default AccommodationItem
