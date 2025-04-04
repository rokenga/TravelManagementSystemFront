"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import PaymentIcon from "@mui/icons-material/Payment"
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums"
import { type TripResponse, TripCategory, TripStatus } from "../types/ClientTrip"

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
  if (price === undefined) return "Kaina nenurodyta"
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

interface SpecialOfferCardProps {
  offer: TripResponse
  onClick: (id: string) => void
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({ offer, onClick }) => {
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
      <CardActionArea onClick={() => onClick(offer.id)} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header with title */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {truncateText(offer.tripName || "Pasiūlymas be pavadinimo")}
            </Typography>
          </Box>

          {/* Status badges */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            {/* Trip category */}
            {offer.category && (
              <Chip
                icon={<LocalOfferIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateTripCategory(offer.category)}
                size="small"
                sx={{
                  bgcolor: categoryColors[offer.category] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            )}

            {/* Trip status */}
            {offer.status && (
              <Chip
                icon={<AccessTimeIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateTripStatus(offer.status)}
                size="small"
                sx={{
                  bgcolor: statusColors[offer.status] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            )}
          </Box>

          {/* Trip details */}
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Date range */}
            {(offer.startDate || offer.endDate) && (
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                <CalendarTodayIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(offer.startDate)} – {formatDate(offer.endDate)}
                </Typography>
              </Box>
            )}

            {/* Price with icon */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                mt: 1.5,
              }}
            >
              <PaymentIcon sx={{ fontSize: "1.1rem", mr: 0.75, color: "primary.main" }} />
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                {formatPrice(offer.price)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default SpecialOfferCard

