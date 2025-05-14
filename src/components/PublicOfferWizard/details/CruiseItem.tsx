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
} from "@mui/material"
import { ExpandMore, Delete as DeleteIcon, Sailing } from "@mui/icons-material"
import ConstrainedDateTimePicker from "../../ConstrainedDateTimePicker"
import type { Cruise } from "../CreatePublicOfferWizardForm"
import { useMediaQuery, useTheme } from "@mui/material"

interface CruiseItemProps {
  cruise: Cruise
  index: number
  formData: any
  handleCruiseChange: (cruiseIndex: number, field: keyof Cruise, value: any) => void
  handleCruiseTimeChange: (cruiseIndex: number, field: "departureTime" | "arrivalTime", value: any) => void
  handleRemoveCruise: (cruiseIndex: number) => void
  timeErrors: Record<string, string | null>
  setSnackbarMessage: (message: string) => void
  setSnackbarSeverity: (severity: "success" | "error" | "info" | "warning") => void
  setSnackbarOpen: (open: boolean) => void
  isEditing: boolean
}

const CruiseItem: React.FC<CruiseItemProps> = ({
  cruise,
  index: cruiseIndex,
  formData,
  handleCruiseChange,
  handleCruiseTimeChange,
  handleRemoveCruise,
  timeErrors,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  isEditing,
}) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  const formatDate = (date: any) => {
    if (!date) return "Nenustatyta"
    return date.format("YYYY-MM-DD")
  }

  return (
    <Accordion key={`cruise-${cruiseIndex}`} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
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
              {cruise.transportName ? `Kruizas - ${cruise.transportName}` : `Kruizas ${cruiseIndex + 1}`}
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
                handleRemoveCruise(cruiseIndex)
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
            <TextField
              label="Kruizo kompanija"
              value={cruise.companyName}
              onChange={(e) => handleCruiseChange(cruiseIndex, "companyName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Laivo pavadinimas"
              value={cruise.transportName}
              onChange={(e) => handleCruiseChange(cruiseIndex, "transportName", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kruizo kodas"
              value={cruise.transportCode}
              onChange={(e) => handleCruiseChange(cruiseIndex, "transportCode", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Kajutės tipas"
              value={cruise.cabinType}
              onChange={(e) => handleCruiseChange(cruiseIndex, "cabinType", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Išvykimo uostas"
              value={cruise.departurePlace}
              onChange={(e) => handleCruiseChange(cruiseIndex, "departurePlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Išvykimo laikas"
              value={cruise.departureTime}
              onChange={(newDate) => handleCruiseTimeChange(cruiseIndex, "departureTime", newDate)}
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
              label="Atvykimo uostas"
              value={cruise.arrivalPlace}
              onChange={(e) => handleCruiseChange(cruiseIndex, "arrivalPlace", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ConstrainedDateTimePicker
              label="Atvykimo laikas"
              value={cruise.arrivalTime}
              onChange={(newDate) => handleCruiseTimeChange(cruiseIndex, "arrivalTime", newDate)}
              minDate={cruise.departureTime || formData.startDate}
              maxDate={formData.endDate ? formData.endDate.endOf("day") : undefined}
              onValidationError={(errorMessage) => {
                setSnackbarMessage(errorMessage)
                setSnackbarSeverity("error")
                setSnackbarOpen(true)
              }}
            />
            {timeErrors[`cruise-${cruiseIndex}`] && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                {timeErrors[`cruise-${cruiseIndex}`]}
              </Typography>
            )}
          </Grid>
        </Grid>

        <TextField
          label="Papildomas aprašymas"
          value={cruise.description}
          onChange={(e) => handleCruiseChange(cruiseIndex, "description", e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={9}></Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Kaina (€)"
              type="number"
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              value={cruise.price}
              onChange={(e) => handleCruiseChange(cruiseIndex, "price", e.target.value)}
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
