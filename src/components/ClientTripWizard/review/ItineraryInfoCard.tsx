"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Divider } from "@mui/material"
import { Title, Description } from "@mui/icons-material"

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
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: "primary.main", mb: 2 }}>
          Maršruto informacija
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            mb: 2,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !itineraryTitle ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !itineraryTitle ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <Title color="primary" sx={{ mr: 1, mt: 0.5 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="medium">
              Pavadinimas
            </Typography>
            <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              {itineraryTitle || (
                <Typography
                  component="span"
                  color={hideHighlighting ? "text.primary" : "#ED6C02"}
                  fontStyle={hideHighlighting ? "normal" : "italic"}
                >
                  Neužpildyta
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            mb: 2,
            p: 1,
            borderRadius: "4px",
            bgcolor: !hideHighlighting && !itineraryDescription ? "rgba(255, 167, 38, 0.08)" : "transparent",
            borderLeft: !hideHighlighting && !itineraryDescription ? "4px solid" : "none",
            borderColor: "warning.main",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <Description color="primary" sx={{ mr: 1, mt: 0.5 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="medium">
              Aprašymas
            </Typography>
            <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              {itineraryDescription || (
                <Typography
                  component="span"
                  color={hideHighlighting ? "text.primary" : "#ED6C02"}
                  fontStyle={hideHighlighting ? "normal" : "italic"}
                >
                  Neužpildyta
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Grid>
  )
}

export default ItineraryInfoCard
