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
  Comment as CommentIcon,
} from "@mui/icons-material"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"

interface TripInfoCardProps {
  trip: any // Using any for simplicity, but you can create a union type of both response types
  variant?: "trip" | "offer" // To distinguish between trip and offer if needed
}

const TripInfoCard: React.FC<TripInfoCardProps> = ({ trip, variant = "trip" }) => {
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

  // Determine if this is a trip or an offer
  const isOffer = variant === "offer" || trip.tripType === "ClientSpecialOffer"

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
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {trip.tripName || "Kelionės pasiūlymas"}
          </Typography>
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
                      <CategoryIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Kategorija:</span>{" "}
                        {translateTripCategory(trip.category)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Destination */}
                {trip.destination && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Kryptis:</span> {trip.destination}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Price */}
                {trip.price !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EuroIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Kaina:</span> €{trip.price}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Date Range - show as a single item with both dates */}
                {(trip.startDate || trip.endDate) && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Data:</span>{" "}
                        {trip.startDate ? formatDate(trip.startDate) : "—"} -{" "}
                        {trip.endDate ? formatDate(trip.endDate) : "—"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Insurance - only for trips, not offers */}
                {!isOffer && trip.insuranceTaken !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InsuranceIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Draudimas:</span>{" "}
                        {trip.insuranceTaken ? "Taip" : "Ne"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Adults */}
                {trip.adultsCount !== undefined && trip.adultsCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Suaugusiųjų:</span> {trip.adultsCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Children */}
                {trip.childrenCount !== undefined && trip.childrenCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ChildIcon color="primary" />
                      <Typography variant="body1">
                        <span style={{ color: "text.secondary" }}>Vaikų:</span> {trip.childrenCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Right column: Description and client wishes */}
            <Grid item xs={12} md={6}>
              {/* Description */}
              {trip.description && (
                <Box sx={{ mb: trip.clientWishes ? 3 : 0 }}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <DescriptionIcon fontSize="small" /> Aprašymas
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {trip.description}
                  </Typography>
                </Box>
              )}

              {/* Client wishes - only for offers */}
              {isOffer && trip.clientWishes && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CommentIcon fontSize="small" /> Kliento pageidavimai
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {trip.clientWishes}
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

export default TripInfoCard
