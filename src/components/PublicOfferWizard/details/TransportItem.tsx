"use client"

import React from "react"
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
import {
  ExpandMore,
  Delete as DeleteIcon,
  Flight,
  Train,
  DirectionsBus,
  DirectionsCar,
  Sailing,
} from "@mui/icons-material"
import ConstrainedDateTimePicker from "../../ConstrainedDateTimePicker"
import type { Transport } from "../CreatePublicOfferWizardForm"
import { useMediaQuery, useTheme } from "@mui/material"

interface TransportItemProps {
  transport: Transport
  index: number
  formData: any
  handleTransportChange: (transIndex: number, field: keyof Transport, value: any) => void
  handleTransportTimeChange: (transIndex: number, field: "departureTime" | "arrivalTime", value: any) => void
  handleRemoveTransport: (transIndex: number) => void
  timeErrors: Record<string, string | null>
  setSnackbarMessage: (message: string) => void
  setSnackbarSeverity: (severity: "success" | "error" | "info" | "warning") => void
  setSnackbarOpen: (open: boolean) => void
  isEditing: boolean
}

const TransportItem: React.FC<TransportItemProps> = ({
  transport,
  index: transIndex,
  formData,
  handleTransportChange,
  handleTransportTimeChange,
  handleRemoveTransport,
  timeErrors,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  isEditing,
}) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  const transportTypeOptions = [
    { value: "Flight", label: "Skrydis", icon: <Flight /> },
    { value: "Train", label: "Traukinys", icon: <Train /> },
    { value: "Bus", label: "Autobusas", icon: <DirectionsBus /> },
    { value: "Car", label: "Automobilis", icon: <DirectionsCar /> },
    { value: "Ferry", label: "Keltas", icon: <Sailing /> },
  ]

  // Format date for display in the header
  const formatDate = (date: any) => {
    if (!date) return "Nenustatyta"
    return date.format("YYYY-MM-DD")
  }

  // Get transport type icon
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
        return <DirectionsCar fontSize="small" color="primary" />
    }
  }

  // Get transport type label
  const getTransportTypeLabel = (type: string): string => {
    const option = transportTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type
  }

  return (
    <Accordion key={`trans-${transIndex}`} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`trans-content-${transIndex}`}
        id={`trans-header-${transIndex}`}
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
                handleRemoveTransport(transIndex)
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
        {/* First row: Type, Company, Name, Code */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Transporto tipas</InputLabel>
              <Select
                value={transport.transportType}
                onChange={(e) => handleTransportChange(transIndex, "transportType", e.target.value)}
                label="Transporto tipas"
              >
                <MenuItem value="">-- Pasirinkite --</MenuItem>
                {transportTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {React.cloneElement(opt.icon, { fontSize: "small", color: "primary" })}
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
              onChange={(e) => handleTransportChange(transIndex, "companyName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Transporto pavadinimas"
              value={transport.transportName}
              onChange={(e) => handleTransportChange(transIndex, "transportName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Transporto kodas"
              value={transport.transportCode}
              onChange={(e) => handleTransportChange(transIndex, "transportCode", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        {/* Second row: Departure and arrival places and times */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Išvykimo vieta"
              value={transport.departurePlace}
              onChange={(e) => handleTransportChange(transIndex, "departurePlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Išvykimo laikas"
              value={transport.departureTime}
              onChange={(newDate) => handleTransportTimeChange(transIndex, "departureTime", newDate)}
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
            <TextField
              label="Atvykimo vieta"
              value={transport.arrivalPlace}
              onChange={(e) => handleTransportChange(transIndex, "arrivalPlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Atvykimo laikas"
              value={transport.arrivalTime}
              onChange={(newDate) => handleTransportTimeChange(transIndex, "arrivalTime", newDate)}
              minDate={transport.departureTime || formData.startDate}
              maxDate={formData.endDate ? formData.endDate.endOf("day") : undefined}
              onValidationError={(errorMessage) => {
                setSnackbarMessage(errorMessage)
                setSnackbarSeverity("error")
                setSnackbarOpen(true)
              }}
            />
            {timeErrors[`trans-${transIndex}`] && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeErrors[`trans-${transIndex}`]}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Third row: Description */}
        <TextField
          label="Aprašymas"
          value={transport.description}
          onChange={(e) => handleTransportChange(transIndex, "description", e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Fourth row: Price */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}></Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Kaina (€)"
              type="number"
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              value={transport.price}
              onChange={(e) => handleTransportChange(transIndex, "price", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default TransportItem
