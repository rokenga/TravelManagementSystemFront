"use client"

import React from "react"
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
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Flight,
  Train,
  DirectionsBus,
  DirectionsCar,
  Sailing,
  FlightTakeoff,
  FlightLand,
  LocationOn as LocationOnIcon,
} from "@mui/icons-material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../../CustomDatePicker"

export interface Transport {
  transportType: string
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

interface TransportItemProps {
  transport: Transport
  transIndex: number
  stepIndex: number
  formatDate: (date: Dayjs | null) => string
  onRemoveTransport: (stepIndex: number, transIndex: number) => void
  onTransportChange: (
    stepIndex: number,
    transIndex: number,
    field: keyof Transport,
    value: string | number | Dayjs | null,
  ) => void
  transportTypeOptions: Array<{ value: string; label: string; icon: React.ReactNode }>
  timeError?: string | null
  onTimeChange: (
    stepIndex: number,
    transIndex: number,
    field: "departureTime" | "arrivalTime",
    value: Dayjs | null,
  ) => void
  isSmall: boolean
  tripStartDate?: Dayjs | null
  tripEndDate?: Dayjs | null
}

const TransportItem: React.FC<TransportItemProps> = ({
  transport,
  transIndex,
  stepIndex,
  formatDate,
  onRemoveTransport,
  onTransportChange,
  transportTypeOptions,
  timeError,
  onTimeChange,
  isSmall,
  tripStartDate,
  tripEndDate,
}) => {
  const getTransportTypeIcon = (type: string) => {
    switch (type) {
      case "Flight":
        return <Flight fontSize="small" color="primary" />
      case "Train":
        return <Train fontSize="small" color="primary" />
      case "Bus":
        return <DirectionsBus fontSize="small" color="primary" />
      case "Car":
        return <DirectionsCar fontSize="small" color="primary" />
      case "Ferry":
        return <Sailing fontSize="small" color="primary" />
      default:
        return null
    }
  }

  const getDepartureIcon = (type: string, isArrival = false) => {
    switch (type) {
      case "Flight":
        return isArrival ? (
          <FlightLand fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
        ) : (
          <FlightTakeoff fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
        )
      default:
        return <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
    }
  }

  const getTransportTypeLabel = (type: string): string => {
    const option = transportTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type
  }

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`trans-content-${transIndex}`}
        id={`trans-header-${transIndex}`}
        data-tab-button="true"
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
            {getTransportTypeIcon(transport.transportType)}
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              {transport.transportName
                ? `${getTransportTypeLabel(transport.transportType)} - ${transport.transportName}`
                : getTransportTypeLabel(transport.transportType)}
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
              {`${transport.departurePlace || "Išvykimas"} (${formatDate(transport.departureTime)}) - ${
                transport.arrivalPlace || "Atvykimas"
              } (${formatDate(transport.arrivalTime)})`}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {transport.price.toFixed(2)} €
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveTransport(stepIndex, transIndex)
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Transporto tipas</InputLabel>
              <Select
                value={transport.transportType}
                onChange={(e) => onTransportChange(stepIndex, transIndex, "transportType", e.target.value)}
                label="Transporto tipas"
              >
                {transportTypeOptions
                  .filter((opt) => opt.value !== "Cruise")
                  .map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {React.cloneElement(getTransportTypeIcon(opt.value) as React.ReactElement, {
                          color: "primary",
                        })}
                        <Box sx={{ ml: 1 }}>{opt.label}</Box>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kompanijos pavadinimas"
              value={transport.companyName}
              onChange={(e) => onTransportChange(stepIndex, transIndex, "companyName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Transporto pavadinimas"
              value={transport.transportName}
              onChange={(e) => onTransportChange(stepIndex, transIndex, "transportName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Transporto kodas"
              value={transport.transportCode}
              onChange={(e) => onTransportChange(stepIndex, transIndex, "transportCode", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Išvykimo vieta"
              value={transport.departurePlace}
              onChange={(e) => onTransportChange(stepIndex, transIndex, "departurePlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Išvykimo laikas"
              value={transport.departureTime}
              onChange={(newDate) => onTimeChange(stepIndex, transIndex, "departureTime", newDate)}
              data-datepicker="true"
              minDate={tripStartDate}
              maxDate={tripEndDate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Atvykimo vieta"
              value={transport.arrivalPlace}
              onChange={(e) => onTransportChange(stepIndex, transIndex, "arrivalPlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateTimePicker
              label="Atvykimo laikas"
              value={transport.arrivalTime}
              onChange={(newDate) => onTimeChange(stepIndex, transIndex, "arrivalTime", newDate)}
              minDate={transport.departureTime || tripStartDate}
              maxDate={tripEndDate}
              data-datepicker="true"
            />
            {timeError && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeError}
              </Typography>
            )}
          </Grid>
        </Grid>
        {(tripStartDate || tripEndDate) && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
            </Grid>
          </Grid>
        )}

        <TextField
          label="Papildomas aprašymas"
          value={transport.description}
          onChange={(e) => onTransportChange(stepIndex, transIndex, "description", e.target.value)}
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
              value={transport.price}
              onChange={(e) => {
                const value = Number.parseFloat(e.target.value)
                onTransportChange(stepIndex, transIndex, "price", value >= 0 ? value : 0)
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

export default TransportItem
