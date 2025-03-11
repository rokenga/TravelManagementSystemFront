"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Divider } from "@mui/material"

interface ItineraryInfoCardProps {
  itineraryTitle?: string
  itineraryDescription?: string
  showItineraryInfo: boolean
}

const ItineraryInfoCard: React.FC<ItineraryInfoCardProps> = ({
  itineraryTitle,
  itineraryDescription,
  showItineraryInfo,
}) => {
  if (!showItineraryInfo) return null

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Maršruto informacija
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {itineraryTitle && (
          <Box sx={{ mb: 1 }}>
            <strong>Pavadinimas:</strong> {itineraryTitle}
          </Box>
        )}
        {itineraryDescription && (
          <Box sx={{ mb: 1 }}>
            <strong>Aprašymas:</strong> {itineraryDescription}
          </Box>
        )}
      </Paper>
    </Grid>
  )
}

export default ItineraryInfoCard

