"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Typography, Button, Paper, Box, Divider, Badge, IconButton } from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"
import PDFActions from "../PDFActions"

// Import types
import type { TripFormData, ItineraryDay, ValidationWarning } from "../../types"

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
  isSaving?: boolean
  hideHighlighting?: boolean
  onHideHighlightingChange?: (hide: boolean) => void
}

const Step3ReviewConfirm: React.FC<Step3Props> = ({
  tripData,
  itinerary,
  onBack,
  onConfirm,
  onSaveDraft,
  validationWarnings = [],
  isSaving = false,
  hideHighlighting = false,
  onHideHighlightingChange = () => {},
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

  // Generate synthetic warnings if none exist but fields are highlighted
  const [syntheticWarnings, setSyntheticWarnings] = useState<ValidationWarning[]>([])

  // Use useEffect to generate synthetic warnings based on missing fields
  useEffect(() => {
    const warnings: ValidationWarning[] = []

    // Always generate warnings regardless of hideHighlighting
    // This ensures the button remains visible even when highlighting is turned off
    if (!validationWarnings || validationWarnings.length === 0) {
      if (!tripData.tripName || tripData.tripName.trim() === "") {
        warnings.push({
          message: "Kelionė neturi pavadinimo.",
          type: "warning",
        })
      }

      if (!tripData.clientName || tripData.clientName.trim() === "") {
        warnings.push({
          message: "Nepasirinkote kliento.",
          type: "info",
        })
      }

      if (!tripData.category || tripData.category.trim() === "") {
        warnings.push({
          message: "Nepasirinkote kelionės kategorijos.",
          type: "info",
        })
      }

      if (!tripData.price || tripData.price === 0) {
        warnings.push({
          message: "Kelionės kaina yra nulis",
          type: "info",
        })
      }

      setSyntheticWarnings(warnings)
    } else {
      setSyntheticWarnings([])
    }
  }, [tripData, validationWarnings])

  // Combine actual warnings with synthetic ones
  const allWarnings = [...(validationWarnings || []), ...syntheticWarnings]
  const hasWarnings = allWarnings.length > 0

  // Debug logs
  useEffect(() => {
    console.log("Validation warnings:", validationWarnings)
    console.log("Synthetic warnings:", syntheticWarnings)
    console.log("All warnings:", allWarnings)
    console.log("Has warnings:", hasWarnings)
    console.log("Hide highlighting:", hideHighlighting)
  }, [validationWarnings, syntheticWarnings, hasWarnings, hideHighlighting])

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" gutterBottom>
            Peržiūra ir patvirtinimas
          </Typography>

          {/* Always show the button if there are warnings, regardless of hideHighlighting */}
          {hasWarnings && (
            <Badge badgeContent={allWarnings.length} color="warning" sx={{ mr: 2 }}>
              <IconButton
                color="warning"
                onClick={() => setWarningsDialogOpen(true)}
                sx={{
                  border: "1px solid",
                  borderColor: "warning.main",
                  "&:hover": {
                    backgroundColor: "warning.light",
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
      <TripInfoCard tripData={tripData} hideHighlighting={hideHighlighting} />

      {/* Itinerary info - Only shown if title or description exists */}
      <ItineraryInfoCard
        itineraryTitle={tripData.itineraryTitle}
        itineraryDescription={tripData.itineraryDescription}
        showItineraryInfo={showItineraryInfo}
        hideHighlighting={hideHighlighting}
      />

      {/* Itinerary preview */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Planas
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {!dayByDay ? (
            <SingleDayPreview day={itinerary[0]} warnings={allWarnings} hideHighlighting={hideHighlighting} />
          ) : (
            <MultiDayPreview days={nonEmptyDays} warnings={allWarnings} hideHighlighting={hideHighlighting} />
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }} disabled={isSaving}>
          Atgal
        </Button>
        <Button variant="outlined" onClick={onSaveDraft} sx={{ mr: 2 }} disabled={isSaving}>
          {isSaving ? "Išsaugoma..." : "Išsaugoti juodraštį"}
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={isSaving}>
          {isSaving ? "Išsaugoma..." : "Patvirtinti"}
        </Button>
      </Grid>

      {/* Validation Warnings Dialog */}
      <ValidationWarningsDialog
        open={warningsDialogOpen}
        onClose={() => setWarningsDialogOpen(false)}
        warnings={allWarnings}
        hideHighlighting={hideHighlighting}
        onHideHighlightingChange={onHideHighlightingChange}
      />
    </Grid>
  )
}

export default Step3ReviewConfirm

