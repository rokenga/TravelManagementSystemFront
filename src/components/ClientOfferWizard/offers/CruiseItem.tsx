"use client"

import type React from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  TextField,
  IconButton,
  Box,
} from "@mui/material"
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Sailing } from "@mui/icons-material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../../CustomDatePicker"

export interface Cruise {
  departureTime: Dayjs | null
  arrivalTime: Dayjs | null
  departurePlace: string
  arrivalPlace: string
  description: string
  companyName: string
  transportName: string
  transportCode: string
  cabinType: string
  price: number
}

interface CruiseItemProps {
  cruise: Cruise
  cruiseIndex: number
  stepIndex: number
  formatDate: (date: Dayjs | null) => string
  onRemoveCruise: (stepIndex: number, cruiseIndex: number) => void
  onCruiseChange: (
    stepIndex: number,
    cruiseIndex: number,
    field: keyof Cruise,
    value: string | number | Dayjs | null,
  ) => void
  timeError?: string | null
  onTimeChange: (
    stepIndex: number,
    cruiseIndex: number,
    field: "departureTime" | "arrivalTime",
    value: Dayjs | null,
  ) => void
  isSmall: boolean
}

const CruiseItem: React.FC<CruiseItemProps> = ({
  cruise,
  cruiseIndex,
  stepIndex,
  formatDate,
  onRemoveCruise,
  onCruiseChange,
  timeError,
  onTimeChange,
  isSmall,
}) => {
  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`cruise-content-${cruiseIndex}`}
        id={`cruise-header-${cruiseIndex}`}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
            flexDirection: isSmall ? "column" : "row",
            alignItems: isSmall ? "flex-start" : "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: isSmall ? 1 : 0 }}>
            <Sailing sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              {cruise.transportName ? `Kruizas - ${cruise.transportName}` : "Kruizas"}
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
              {`${cruise.departurePlace || "Išvykimas"} (${formatDate(cruise.departureTime)}) - ${
                cruise.arrivalPlace || "Atvykimas"
              } (${formatDate(cruise.arrivalTime)})`}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {cruise.price.toFixed(2)} €
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveCruise(stepIndex, cruiseIndex)
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
        {/* First row: Company, Ship name, Code, Cabin type */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kruizo kompanija"
              value={cruise.companyName}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "companyName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Laivo pavadinimas"
              value={cruise.transportName}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "transportName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kruizo kodas"
              value={cruise.transportCode}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "transportCode", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kajutės tipas"
              value={cruise.cabinType}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "cabinType", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {/* Second row: Departure and arrival ports and times */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Išvykimo uostas"
              value={cruise.departurePlace}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "departurePlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Išvykimo laikas"
              value={cruise.departureTime}
              onChange={(newDate) => onTimeChange(stepIndex, cruiseIndex, "departureTime", newDate)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Atvykimo uostas"
              value={cruise.arrivalPlace}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "arrivalPlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Atvykimo laikas"
              value={cruise.arrivalTime}
              onChange={(newDate) => onTimeChange(stepIndex, cruiseIndex, "arrivalTime", newDate)}
              minDate={cruise.departureTime}
            />
            {timeError && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeError}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Third row: Description */}
        <TextField
          label="Papildomas aprašymas"
          value={cruise.description}
          onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "description", e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Fourth row: Price */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={9}></Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Kaina (€)"
              type="number"
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              value={cruise.price}
              onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "price", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default CruiseItem
