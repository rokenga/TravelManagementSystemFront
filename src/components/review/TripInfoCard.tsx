"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Divider } from "@mui/material"
import type { TripFormData } from "../../types"

interface TripInfoCardProps {
  tripData: TripFormData
}

const TripInfoCard: React.FC<TripInfoCardProps> = ({ tripData }) => {
  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Kelionės informacija
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 1 }}>
          <strong>Pavadinimas:</strong> {tripData.tripName || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Klientas:</strong>{" "}
          {tripData.clientName && tripData.clientName.trim() !== ""
            ? `${tripData.clientName}`
            : tripData.clientId
              ? "Nėra"
              : ""}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Aprašymas:</strong> {tripData.description || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Data nuo:</strong> {tripData.startDate || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Data iki:</strong> {tripData.endDate || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Kaina:</strong> {tripData.price || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Kategorija:</strong> {tripData.category || "Nėra"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Draudimas:</strong> {tripData.insuranceTaken ? "Taip" : "Ne"}
        </Box>
        <Box sx={{ mb: 1 }}>
          <strong>Suaugę:</strong> {tripData.adultsCount || 0}
        </Box>
        <Box sx={{ mb: 1 }}>
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

