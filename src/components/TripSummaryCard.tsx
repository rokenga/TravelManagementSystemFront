"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import PersonIcon from "@mui/icons-material/Person"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import PaymentIcon from "@mui/icons-material/Payment"
import PeopleIcon from "@mui/icons-material/People"
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"
import { translateTripCategory, translateTripStatus, translatePaymentStatus } from "../Utils/translateEnums"
import type { TripResponse } from "../types/ClientTrip"
import { TripStatus, PaymentStatus, TripCategory } from "../types/ClientTrip"

// Lithuanian date formatter (YYYY-MM-DD)
const formatDate = (dateString?: string) => {
  if (!dateString) return "Nežinoma data"
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString))
}

const truncateText = (text = "", maxLength = 70) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

const formatPrice = (price?: number) => {
  if (price === undefined) return ""
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

// Using the same color scheme as the client card for consistency
const categoryColors = {
  [TripCategory.Tourist]: "#42A5F5", // Blue - like SpecialRequirements
  [TripCategory.Group]: "#AB47BC", // Purple - like TravelPreference
  [TripCategory.Relax]: "#FFA726", // Orange - like DestinationInterest
  [TripCategory.Business]: "#66BB6A", // Green - like Other
  [TripCategory.Cruise]: "#EC407A", // Pink - like TravelFrequency
}

// Status colors
const statusColors = {
  [TripStatus.Draft]: "#FF9800", // Orange
  [TripStatus.Confirmed]: "#4CAF50", // Green
  [TripStatus.Cancelled]: "#F44336", // Red
}

// Payment status colors
const paymentStatusColors = {
  [PaymentStatus.Unpaid]: "#F44336", // Red
  [PaymentStatus.PartiallyPaid]: "#2196F3", // Blue
  [PaymentStatus.Paid]: "#4CAF50", // Green
}

interface TripSummaryCardProps {
  trip: TripResponse
  onClick?: (id: string) => void
}

const TripSummaryCard: React.FC<TripSummaryCardProps> = ({ trip, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(trip.id)
    }
  }

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ height: "100%" }}>
        <CardContent
          sx={{
            p: 3,
          }}
        >
          {/* Header with title */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mr: 1 }}>
              {truncateText(trip.tripName || "Kelionė be pavadinimo")}
            </Typography>
          </Box>

          {/* Status badges */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            {/* Trip category */}
            {trip.category && (
              <Chip
                icon={<LocalOfferIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateTripCategory(trip.category)}
                size="small"
                sx={{
                  bgcolor: categoryColors[trip.category] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            )}

            {/* Trip status */}
            {trip.status && (
              <Chip
                icon={<AccessTimeIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateTripStatus(trip.status)}
                size="small"
                sx={{
                  bgcolor: statusColors[trip.status] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            )}

            {/* Payment status if available */}
            {trip.paymentStatus && (
              <Chip
                icon={<PaymentIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translatePaymentStatus(trip.paymentStatus)}
                size="small"
                sx={{
                  bgcolor: paymentStatusColors[trip.paymentStatus] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            )}
            {/* Transfer status if applicable */}
            {trip.isTransferred && trip.transferredFromAgentName && (
              <Chip
                icon={<SwapHorizIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label="Perkeltas"
                size="small"
                sx={{
                  bgcolor: "black", // Info blue
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
                title={`Perkeltas nuo: ${trip.transferredFromAgentName}`}
              />
            )}
          </Box>

          {/* Client name if available - moved after tags */}
          {trip.clientFullName && (
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem", mb: 2 }}>
              <PersonIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">
                {trip.clientFullName}
              </Typography>
            </Box>
          )}

          {/* Trip details */}
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Date range */}
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
              <CalendarTodayIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </Typography>
            </Box>

            {/* Price if available */}
            {trip.price !== undefined && (
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                <PaymentIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  {formatPrice(trip.price)}
                </Typography>
              </Box>
            )}

            {/* Travelers count if available */}
            {(trip.adultsCount !== undefined || trip.childrenCount !== undefined) && (
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                <PeopleIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  {trip.adultsCount !== undefined ? `${trip.adultsCount} suaugę` : ""}
                  {trip.adultsCount !== undefined && trip.childrenCount !== undefined ? ", " : ""}
                  {trip.childrenCount !== undefined ? `${trip.childrenCount} vaikai` : ""}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default TripSummaryCard
