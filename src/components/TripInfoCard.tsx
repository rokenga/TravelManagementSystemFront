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
  Payment as PaymentIcon,
  SwapHoriz as TransferIcon,
} from "@mui/icons-material"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"

interface TripInfoCardProps {
  trip: any 
  variant?: "trip" | "offer" 
}

const TripInfoCard: React.FC<TripInfoCardProps> = ({ trip, variant = "trip" }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    const d = new Date(dateString)
    return d.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isOffer = variant === "offer" || trip.tripType === "ClientSpecialOffer"

  const translatePaymentStatus = (status: string) => {
    switch (status) {
      case "Paid":
        return "Apmokėta"
      case "PartiallyPaid":
        return "Dalinai apmokėta"
      case "Unpaid":
        return "Neapmokėta"
      default:
        return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "success"
      case "PartiallyPaid":
        return "warning"
      case "Unpaid":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Card elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
      <CardContent sx={{ p: 0 }}>
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
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            {trip.status !== undefined && (
              <Chip
                label={translateTripStatus(trip.status)}
                color={trip.status === "Confirmed" ? "success" : "primary"}
                icon={<FlagIcon />}
                size={isMobile ? "small" : "medium"}
              />
            )}

            {!isOffer && trip.paymentStatus && (
              <Chip
                label={translatePaymentStatus(trip.paymentStatus)}
                color={getPaymentStatusColor(trip.paymentStatus) as "success" | "warning" | "error" | "default"}
                icon={<PaymentIcon />}
                size={isMobile ? "small" : "medium"}
              />
            )}
          </Box>
        </Box>

        {trip.isTransferred && (
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "info.light",
              color: "info.contrastText",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <TransferIcon />
            <Typography variant="body2">Perduota iš: {trip.transferredFromAgentName || "Kito agento"}</Typography>
          </Box>
        )}

        <Box sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {trip.category && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <CategoryIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Kategorija:</span>{" "}
                        {translateTripCategory(trip.category)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {trip.destination && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <LocationIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Kryptis:</span> {trip.destination}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {trip.price !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <EuroIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Kaina:</span> €{trip.price}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {(trip.startDate || trip.endDate) && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <CalendarIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Data:</span>{" "}
                        {trip.startDate ? formatDate(trip.startDate) : "—"} -{" "}
                        {trip.endDate ? formatDate(trip.endDate) : "—"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {!isOffer && trip.insuranceTaken !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <InsuranceIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Draudimas:</span>{" "}
                        {trip.insuranceTaken ? "Taip" : "Ne"}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {trip.adultsCount !== undefined && trip.adultsCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <PersonIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Suaugusiųjų:</span> {trip.adultsCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {trip.childrenCount !== undefined && trip.childrenCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <ChildIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="body1" sx={{ textAlign: "left" }}>
                        <span style={{ color: "text.secondary" }}>Vaikų:</span> {trip.childrenCount}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
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
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
                    {trip.description}
                  </Typography>
                </Box>
              )}

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
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
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
