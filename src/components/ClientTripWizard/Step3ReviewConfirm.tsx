"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Typography, Button, Paper, Box, Divider, Badge, IconButton } from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"

// Import types
import type { TripFormData, ItineraryDay, ValidationWarning } from "../../types"

// Import components
import TripInfoCard from "./review/TripInfoCard"
import ItineraryInfoCard from "./review/ItineraryInfoCard"
import SingleDayPreview from "./review/SingleDayPreview"
import MultiDayPreview from "./review/MultiDayPreview"
import ValidationWarningsDialog from "./review/ValidationWarningsDialog"
import TripMediaCard from "./review/TripMediaCard"

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
  // Add props for images
  stepImages?: { [key: number]: File[] }
  existingStepImages?: { [key: number]: Array<{ id: string; url: string; urlInline?: string }> }
  // Add props for existing files
  existingTripImages?: Array<{ id: string; url: string; fileName?: string }>
  existingTripDocuments?: Array<{ id: string; url: string; fileName: string }>
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
  stepImages = {},
  existingStepImages = {},
  existingTripImages = [],
  existingTripDocuments = [],
}) => {
  const dayByDay = tripData.dayByDayItineraryNeeded

  // Process itinerary to include image data
  const processedItinerary = itinerary.map((day, index) => {
    // Find image events in this day
    const imageEvents = day.events.filter((event) => event.type === "images")

    // If there are image events, add image data to them
    if (imageEvents.length > 0) {
      const updatedEvents = day.events.map((event) => {
        if (event.type === "images") {
          // Create URLs for new images
          const newImageUrls = stepImages[index]
            ? Array.from(stepImages[index]).map((file) => ({
                url: URL.createObjectURL(file),
                isNew: true,
              }))
            : []

          // Get existing image URLs
          const existingImageUrls = existingStepImages[index]
            ? existingStepImages[index].map((img) => ({
                id: img.id,
                url: img.urlInline || img.url,
                isExisting: true,
              }))
            : []

          // Combine both types of images
          return {
            ...event,
            images: [...newImageUrls, ...existingImageUrls],
          }
        }
        return event
      })

      return {
        ...day,
        events: updatedEvents,
      }
    }

    return day
  })

  // Skip empty days
  const nonEmptyDays = processedItinerary
    .map((day, i) => ({
      ...day,
      originalIndex: i + 1,
    }))
    .filter((day) => day.events.length > 0 || (day.dayDescription && day.dayDescription.trim() !== ""))

  // Only show itinerary info if title or description exists
  const showItineraryInfo = tripData.itineraryTitle || tripData.itineraryDescription

  // State for validation warnings dialog
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false)

  // Add local state to track highlighting
  const [localHideHighlighting, setLocalHideHighlighting] = useState(hideHighlighting)

  // Update local state when props change
  useEffect(() => {
    setLocalHideHighlighting(hideHighlighting)
  }, [hideHighlighting])

  // Handle hide highlighting change
  const handleHideHighlightingChange = (hide: boolean) => {
    setLocalHideHighlighting(hide)
    onHideHighlightingChange(hide)
  }

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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 2 }}>
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

      {/* Trip info */}
      <TripInfoCard tripData={tripData} hideHighlighting={localHideHighlighting} />

      {/* Trip media (images and documents) - No props needed, it will fetch data internally */}
      <TripMediaCard
        existingStepImages={existingStepImages}
        tripImages={tripData.images || []}
        tripDocuments={tripData.documents || []}
        existingTripImages={existingTripImages}
        existingTripDocuments={existingTripDocuments}
      />

      {/* Itinerary info - Only shown if title or description exists */}
      <ItineraryInfoCard
        itineraryTitle={tripData.itineraryTitle}
        itineraryDescription={tripData.itineraryDescription}
        showItineraryInfo={showItineraryInfo}
        hideHighlighting={localHideHighlighting}
      />

      {/* Itinerary preview */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 500, color: "primary.main", mb: 2, textAlign: "left" }}
          >
            Planas
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {!dayByDay ? (
            <SingleDayPreview
              day={processedItinerary[0]}
              warnings={allWarnings}
              hideHighlighting={localHideHighlighting}
            />
          ) : (
            <MultiDayPreview days={nonEmptyDays} warnings={allWarnings} hideHighlighting={localHideHighlighting} />
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
        <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }} disabled={isSaving} size="large">
          Atgal
        </Button>
        <Button variant="outlined" onClick={onSaveDraft} sx={{ mr: 2 }} disabled={isSaving} size="large">
          {isSaving ? "Išsaugoma..." : "Išsaugoti juodraštį"}
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={isSaving} size="large">
          {isSaving ? "Išsaugoma..." : "Patvirtinti"}
        </Button>
      </Grid>

      {/* Validation Warnings Dialog */}
      <ValidationWarningsDialog
        open={warningsDialogOpen}
        onClose={() => setWarningsDialogOpen(false)}
        warnings={allWarnings}
        hideHighlighting={localHideHighlighting}
        onHideHighlightingChange={handleHideHighlightingChange}
      />
    </Grid>
  )
}

export default Step3ReviewConfirm
