"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Typography, Button, Paper, Box, Divider, Badge, IconButton } from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"

import type { TripFormData, ItineraryDay, ValidationWarning } from "../../types"

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
  stepImages?: { [key: number]: File[] }
  existingStepImages?: { [key: number]: Array<{ id: string; url: string; urlInline?: string }> }
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

  const processedItinerary = itinerary.map((day, index) => {
    const imageEvents = day.events.filter((event) => event.type === "images")

    if (imageEvents.length > 0) {
      const updatedEvents = day.events.map((event) => {
        if (event.type === "images") {
          const newImageUrls = stepImages[index]
            ? Array.from(stepImages[index]).map((file) => ({
                url: URL.createObjectURL(file),
                isNew: true,
              }))
            : []

          const existingImageUrls = existingStepImages[index]
            ? existingStepImages[index].map((img) => ({
                id: img.id,
                url: img.urlInline || img.url,
                isExisting: true,
              }))
            : []

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

  const nonEmptyDays = processedItinerary
    .map((day, i) => ({
      ...day,
      originalIndex: i + 1,
    }))
    .filter((day) => day.events.length > 0 || (day.dayDescription && day.dayDescription.trim() !== ""))

  const showItineraryInfo = tripData.itineraryTitle || tripData.itineraryDescription

  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false)

  const [localHideHighlighting, setLocalHideHighlighting] = useState(hideHighlighting)

  useEffect(() => {
    setLocalHideHighlighting(hideHighlighting)
  }, [hideHighlighting])

  const handleHideHighlightingChange = (hide: boolean) => {
    setLocalHideHighlighting(hide)
    onHideHighlightingChange(hide)
  }

  const [syntheticWarnings, setSyntheticWarnings] = useState<ValidationWarning[]>([])

  useEffect(() => {
    const warnings: ValidationWarning[] = []

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

  const allWarnings = [...(validationWarnings || []), ...syntheticWarnings]
  const hasWarnings = allWarnings.length > 0

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 2 }}>
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

      <TripInfoCard tripData={tripData} hideHighlighting={localHideHighlighting} />

      <TripMediaCard
        existingStepImages={existingStepImages}
        tripImages={tripData.images || []}
        tripDocuments={tripData.documents || []}
        existingTripImages={existingTripImages}
        existingTripDocuments={existingTripDocuments}
      />

      <ItineraryInfoCard
        itineraryTitle={tripData.itineraryTitle}
        itineraryDescription={tripData.itineraryDescription}
        showItineraryInfo={showItineraryInfo}
        hideHighlighting={localHideHighlighting}
      />

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
