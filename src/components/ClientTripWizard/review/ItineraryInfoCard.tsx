"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Divider } from "@mui/material"

interface ItineraryInfoCardProps {
  itineraryTitle?: string
  itineraryDescription?: string
  showItineraryInfo: boolean
  hideHighlighting?: boolean
}

const ItineraryInfoCard: React.FC<ItineraryInfoCardProps> = ({
  itineraryTitle,
  itineraryDescription,
  showItineraryInfo,
  hideHighlighting = false,
}) => {
  if (!showItineraryInfo) return null

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Maršruto informacija
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !itineraryTitle ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !itineraryTitle ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Pavadinimas:</strong>{" "}
          {itineraryTitle || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !itineraryDescription ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !itineraryDescription ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Aprašymas:</strong>{" "}
          {itineraryDescription || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
      </Paper>
    </Grid>
  )
}

export default ItineraryInfoCard

