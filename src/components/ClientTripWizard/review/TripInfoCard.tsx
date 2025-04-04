"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Divider } from "@mui/material"
import type { TripFormData } from "../../../types"

interface TripInfoCardProps {
  tripData: TripFormData
  hideHighlighting?: boolean
}

const TripInfoCard: React.FC<TripInfoCardProps> = ({ tripData, hideHighlighting = false }) => {
  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Kelionės informacija
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !tripData.tripName ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !tripData.tripName ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Pavadinimas:</strong>{" "}
          {tripData.tripName || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor:
              !hideHighlighting && (!tripData.clientName || tripData.clientName.trim() === "")
                ? "rgba(255, 167, 38, 0.08)"
                : "transparent",
            borderLeft:
              !hideHighlighting && (!tripData.clientName || tripData.clientName.trim() === "") ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Klientas:</strong>{" "}
          {tripData.clientName && tripData.clientName.trim() !== "" ? (
            `${tripData.clientName}`
          ) : (
            <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>
          )}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Aprašymas:</strong> {tripData.description || "Nėra"}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !tripData.startDate ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !tripData.startDate ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Data nuo:</strong>{" "}
          {tripData.startDate || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !tripData.endDate ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !tripData.endDate ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Data iki:</strong>{" "}
          {tripData.endDate || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor:
              !hideHighlighting && (!tripData.price || tripData.price === 0)
                ? "rgba(255, 167, 38, 0.08)"
                : "transparent",
            borderLeft: !hideHighlighting && (!tripData.price || tripData.price === 0) ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Kaina:</strong>{" "}
          {tripData.price ? tripData.price : <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Nėra</span>}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !tripData.category ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !tripData.category ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Kategorija:</strong>{" "}
          {tripData.category || <span style={{ color: "#ED6C02", fontStyle: "italic" }}>Neužpildyta</span>}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Draudimas:</strong> {tripData.insuranceTaken ? "Taip" : "Ne"}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor:
              !hideHighlighting &&
              (!tripData.adultsCount || tripData.adultsCount === 0) &&
              (!tripData.childrenCount || tripData.childrenCount === 0)
                ? "rgba(255, 167, 38, 0.08)"
                : "transparent",
            borderLeft:
              !hideHighlighting &&
              (!tripData.adultsCount || tripData.adultsCount === 0) &&
              (!tripData.childrenCount || tripData.childrenCount === 0)
                ? "4px solid"
                : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Suaugę:</strong> {tripData.adultsCount || 0}
        </Box>
        <Box
          sx={{
            mb: 1,
            p: 1,
            borderRadius: "4px",
            bgcolor:
              !hideHighlighting &&
              (!tripData.adultsCount || tripData.adultsCount === 0) &&
              (!tripData.childrenCount || tripData.childrenCount === 0)
                ? "rgba(255, 167, 38, 0.08)"
                : "transparent",
            borderLeft:
              !hideHighlighting &&
              (!tripData.adultsCount || tripData.adultsCount === 0) &&
              (!tripData.childrenCount || tripData.childrenCount === 0)
                ? "4px solid"
                : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <strong>Vaikai:</strong> {tripData.childrenCount || 0}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Kasdienis planas:</strong> {tripData.dayByDayItineraryNeeded ? "Taip" : "Ne"}
        </Box>
      </Paper>
    </Grid>
  )
}

export default TripInfoCard

