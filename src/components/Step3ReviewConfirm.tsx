"use client"

import type React from "react"
import { useState } from "react"
import { Grid, Typography, Button, Paper, Box, Divider, Badge, IconButton } from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"
import PDFActions from "./PDFActions"

// Import types
import type { TripFormData, ItineraryDay, ValidationWarning } from "../types"

// Import components
import TripInfoCard from "./review/TripInfoCard"
import ItineraryInfoCard from "./review/ItineraryInfoCard"
import SingleDayPreview from "./review/SingleDayPreview"
import MultiDayPreview from "./review/MultiDayPreview"
import ValidationWarningsDialog from "./review/ValidationWarningsDialog"

interface Step3Props {
  tripData: TripFormData
  itinerary: ItineraryDay[]
  onBack: () => void
  onConfirm: () => void
  onSaveDraft: () => void
  validationWarnings?: ValidationWarning[]
}

const Step3ReviewConfirm: React.FC<Step3Props> = ({
  tripData,
  itinerary,
  onBack,
  onConfirm,
  onSaveDraft,
  validationWarnings = [],
}) => {
  const dayByDay = tripData.dayByDayItineraryNeeded

  // Skip empty days
  const nonEmptyDays = itinerary
    .map((day, i) => ({
      ...day,
      originalIndex: i + 1,
    }))
    .filter((day) => day.events.length > 0 || (day.dayDescription && day.dayDescription.trim() !== ""))

  // Only show itinerary info if title or description exists
  const showItineraryInfo = tripData.itineraryTitle || tripData.itineraryDescription

  // State for validation warnings dialog
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false)

  // Count warnings by type
  const hasWarnings = validationWarnings.length > 0

  console.log("Validation warnings:", validationWarnings) // Debug log

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" gutterBottom>
            Peržiūra ir patvirtinimas
          </Typography>

          {hasWarnings && (
            <Badge badgeContent={validationWarnings.length} color="error" sx={{ mr: 2 }}>
              <IconButton
                color="error"
                onClick={() => setWarningsDialogOpen(true)}
                sx={{
                  border: "1px solid",
                  borderColor: "error.main",
                  "&:hover": {
                    backgroundColor: "error.light",
                  },
                }}
              >
                <WarningIcon />
              </IconButton>
            </Badge>
          )}
        </Box>
      </Grid>

      {/* Add PDF Actions */}
      <Grid item xs={12}>
        <PDFActions tripData={tripData} itinerary={itinerary} />
      </Grid>

      {/* Trip info */}
      <TripInfoCard tripData={tripData} />

      {/* Itinerary info - Only shown if title or description exists */}
      <ItineraryInfoCard
        itineraryTitle={tripData.itineraryTitle}
        itineraryDescription={tripData.itineraryDescription}
        showItineraryInfo={showItineraryInfo}
      />

      {/* Itinerary preview */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Planas
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {!dayByDay ? <SingleDayPreview day={itinerary[0]} /> : <MultiDayPreview days={nonEmptyDays} />}
        </Paper>
      </Grid>

      {/* Buttons */}
      <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }}>
          Atgal
        </Button>
        <Button variant="outlined" onClick={onSaveDraft} sx={{ mr: 2 }}>
          Išsaugoti juodraštį
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm}>
          Patvirtinti
        </Button>
      </Grid>

      {/* Validation Warnings Dialog */}
      <ValidationWarningsDialog
        open={warningsDialogOpen}
        onClose={() => setWarningsDialogOpen(false)}
        warnings={validationWarnings}
      />
    </Grid>
  )
}

export default Step3ReviewConfirm

