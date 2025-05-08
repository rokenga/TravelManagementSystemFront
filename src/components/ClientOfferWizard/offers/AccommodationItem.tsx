"use client"

import type React from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
} from "@mui/material"
import { ExpandMore as ExpandMoreIcon, Hotel, Delete as DeleteIcon } from "@mui/icons-material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../../CustomDatePicker"
import StarRating from "../../StarRating"
import { starRatingEnumToNumber } from "../../../Utils/starRatingUtils"

export interface Accommodation {
  hotelName: string
  checkIn: Dayjs | null
  checkOut: Dayjs | null
  hotelLink: string
  description: string
  boardBasis: string
  roomType: string
  price: number
  starRating?: number | null
}

interface AccommodationItemProps {
  accommodation: Accommodation
  accIndex: number
  stepIndex: number
  formatDate: (date: Dayjs | null) => string
  onRemoveAccommodation: (stepIndex: number, accIndex: number) => void
  onAccommodationChange: (
    stepIndex: number,
    accIndex: number,
    field: keyof Accommodation,
    value: string | number | Dayjs | null,
  ) => void
  boardBasisOptions: Array<{ value: string; label: string }>
  timeError?: string | null
  onTimeChange: (stepIndex: number, accIndex: number, field: "checkIn" | "checkOut", value: Dayjs | null) => void
  isSmall: boolean
  tripStartDate?: Dayjs | null
  tripEndDate?: Dayjs | null
}

const Star = ({ color = "gold" }: { color?: string }) => <span style={{ fontSize: "1rem", color }}>★</span>

const AccommodationItem: React.FC<AccommodationItemProps> = ({
  accommodation,
  accIndex,
  stepIndex,
  formatDate,
  onRemoveAccommodation,
  onAccommodationChange,
  boardBasisOptions,
  timeError,
  onTimeChange,
  isSmall,
  tripStartDate,
  tripEndDate,
}) => {
  const handleStarRatingChange = (value: number | null) => {
    onAccommodationChange(stepIndex, accIndex, "starRating", value)
  }

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null
    return (
      <Box sx={{ display: "inline-flex", ml: 1, verticalAlign: "middle" }}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} />
        ))}
      </Box>
    )
  }

  return (
    <Accordion sx={{ mb: 2, width: "100%" }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`acc-content-${accIndex}`}
        id={`acc-header-${accIndex}`}
        data-tab-button="true"
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          width: "100%",
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
              {accommodation.hotelName ? `Apgyvendinimas - ${accommodation.hotelName}` : "Apgyvendinimas"}
            </Typography>
            {accommodation.starRating && renderStars(accommodation.starRating)}
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
              {`${formatDate(accommodation.checkIn)} - ${formatDate(accommodation.checkOut)}`}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {accommodation.price.toFixed(2)} €
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveAccommodation(stepIndex, accIndex)
              }}
              sx={{ ml: 1 }}
              data-delete-offer-button="true"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Viešbučio pavadinimas"
              value={accommodation.hotelName}
              onChange={(e) => onAccommodationChange(stepIndex, accIndex, "hotelName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Viešbučio adresas"
              placeholder="Maldyvai, ..."
              value={accommodation.hotelLink}
              onChange={(e) => onAccommodationChange(stepIndex, accIndex, "hotelLink", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <StarRating
                label="Žvaigždučių reitingas"
                value={
                  typeof accommodation.starRating === "string"
                    ? starRatingEnumToNumber(accommodation.starRating as string)
                    : accommodation.starRating || null
                }
                onChange={handleStarRatingChange}
                size="medium"
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Įsiregistravimas"
              value={accommodation.checkIn}
              onChange={(newDate) => onTimeChange(stepIndex, accIndex, "checkIn", newDate)}
              data-datepicker="true"
              minDate={tripStartDate}
              maxDate={tripEndDate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Išsiregistravimas"
              value={accommodation.checkOut}
              onChange={(newDate) => onTimeChange(stepIndex, accIndex, "checkOut", newDate)}
              minDate={accommodation.checkIn || tripStartDate}
              maxDate={tripEndDate}
              data-datepicker="true"
            />
            {timeError && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeError}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Maitinimo tipas</InputLabel>
              <Select
                value={accommodation.boardBasis}
                onChange={(e) => onAccommodationChange(stepIndex, accIndex, "boardBasis", e.target.value)}
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
              value={accommodation.roomType}
              onChange={(e) => onAccommodationChange(stepIndex, accIndex, "roomType", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {(tripStartDate || tripEndDate) && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              {/* We don't show explicit error messages, just rely on the date picker color */}
            </Grid>
          </Grid>
        )}

        <TextField
          label="Papildomas aprašymas"
          value={accommodation.description}
          onChange={(e) => onAccommodationChange(stepIndex, accIndex, "description", e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={9}></Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Kaina"
              type="number"
              value={accommodation.price}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value)
                onAccommodationChange(stepIndex, accIndex, "price", value >= 0 ? value : 0)
              }}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <Typography variant="body2">€</Typography>,
              }}
              inputProps={{ min: "0" }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default AccommodationItem
