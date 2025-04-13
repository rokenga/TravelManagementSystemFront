"use client"

import type React from "react"
import { Box, Typography, Card, CardContent, Grid, Chip, useTheme, useMediaQuery } from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  VerifiedUser as InsuranceIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"
import type { TripResponse } from "../types/ClientTrip"

interface TripDetailsCardProps {
  trip: TripResponse
}

const TripDetailsCard: React.FC<TripDetailsCardProps> = ({ trip }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    const d = new Date(dateString)
    return d.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header with trip name and status */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 0,
          }}
        >
          <Typography variant="h5">{trip.tripName}</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {trip.status !== undefined && (
              <Chip
                label={translateTripStatus(trip.status)}
                color={trip.status === "Confirmed" ? "success" : "primary"}
                icon={<FlagIcon />}
              />
            )}
          </Box>
        </Box>

        {/* Trip details in a grid layout */}
        <Box sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
          <Grid container spacing={3}>
            {/* Left column: Basic trip info */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {/* Category */}
                {trip.category && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CategoryIcon />
                      <Typography variant="body1">
                        <span>Kategorija:</span> {translateTripCategory(trip.category)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Destination */}
                {trip.destination && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationIcon />
                      <Typography variant="body1">
                        <span>Kryptis:</span> {trip.destination}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Price */}
                {trip.price !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EuroIcon />
                      <Typography variant="body1">
                        <span>Kaina:</span> €{trip.price}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* StartDate */}
                {trip.startDate && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarIcon />
                      <Typography variant="body1">
                        <span>Nuo:</span> {formatDate(trip.startDate)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* EndDate */}
                {trip.endDate && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarIcon />
                      <Typography variant="body1">
                        <span>Iki:</span> {formatDate(trip.endDate)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Insurance */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <InsuranceIcon />
                    <Typography variant="body1">
                      <span>Draudimas:</span> {trip.insuranceTaken ? "Taip" : "Ne"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Adults */}
                {trip.adultsCount !== undefined && trip.adultsCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon />
                      <Typography variant="body1">
                        <span>Suaugusiųjų:</span> {trip.adultsCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Children */}
                {trip.childrenCount !== undefined && trip.childrenCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ChildIcon />
                      <Typography variant="body1">
                        <span>Vaikų:</span> {trip.childrenCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Right column: Description */}
            <Grid item xs={12} md={6}>
              {trip.description && (
                <Box>
                  <Typography variant="body1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DescriptionIcon fontSize="small" /> Aprašymas
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {trip.description}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}

export default TripDetailsCard
