"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip, Divider, LinearProgress } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import PaymentIcon from "@mui/icons-material/Payment"
import PeopleIcon from "@mui/icons-material/People"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import StarIcon from "@mui/icons-material/Star"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import { translateTripStatus, translateTripCategory } from "../Utils/translateEnums"
import type { ClientTripListResponse } from "../types/ClientsTripList"
import { TripStatus, TripCategory } from "../types/ClientTrip"

// Lithuanian date formatter (YYYY-MM-DD)
const formatDate = (dateString?: string) => {
  if (!dateString) return "Nežinoma data"
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString))
}

const truncateText = (text = "", maxLength = 100) => {
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

// Format the review date in Lithuanian format
const formatReviewDate = (dateString: string) => {
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

// Status colors
const statusColors = {
  [TripStatus.Draft]: "#FF9800", // Orange
  [TripStatus.Confirmed]: "#4CAF50", // Green
  [TripStatus.Cancelled]: "#F44336", // Red
}

// Category colors - same as in TripSummaryCard
const categoryColors = {
  [TripCategory.Tourist]: "#42A5F5", // Blue
  [TripCategory.Group]: "#AB47BC", // Purple
  [TripCategory.Relax]: "#FFA726", // Orange
  [TripCategory.Business]: "#66BB6A", // Green
  [TripCategory.Cruise]: "#EC407A", // Pink
}

// Get color for rating badge
const getRatingColor = (rating: number) => {
  if (rating >= 8) return "#4CAF50" // Green for high ratings
  if (rating >= 5) return "#FFC107" // Amber for medium ratings
  return "#F44336" // Red for low ratings
}

interface ClientTripCardProps {
  trip: ClientTripListResponse
  onClick?: (id: string) => void
}

const ClientsTripListCard: React.FC<ClientTripCardProps> = ({ trip, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(trip.id)
    }
  }

  return (
    <Card
      sx={{
        width: "100%",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
        mb: 2,
        borderRadius: 2,
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <CardContent
          sx={{
            p: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
          }}
        >
          {/* Left side - Trip details */}
          <Box sx={{ flex: 1, pr: { xs: 0, md: 2 } }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mr: 1 }}>
                {truncateText(trip.tripName || "Kelionė be pavadinimo")}
              </Typography>
            </Box>

            {/* Status and category badges */}
            <Box sx={{ display: "flex", mb: 2, flexWrap: "wrap", gap: 1 }}>
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
            </Box>

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

              {/* Destination */}
              {trip.destination && (
                <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                  <LocationOnIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    {trip.destination}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Divider for medium and larger screens */}
          <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: "none", md: "block" } }} />

          {/* Divider for mobile */}
          <Divider sx={{ my: 2, display: { xs: "block", md: "none" } }} />

          {/* Right side - Trip review if available */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {trip.review ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "space-between" }}>
                  {/* Changed to match trip name styling */}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Atsiliepimas
                  </Typography>

                  {/* Rating badge similar to the image */}
                  <Chip
                    icon={<StarIcon />}
                    label={`${trip.review.rating}/10`}
                    sx={{
                      bgcolor: getRatingColor(trip.review.rating),
                      color: "white",
                      fontWeight: "bold",
                      "& .MuiChip-icon": {
                        color: "white",
                      },
                    }}
                  />
                </Box>

                {/* Rating progress bar */}
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={trip.review.rating * 10}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getRatingColor(trip.review.rating),
                      },
                      mb: 2,
                    }}
                  />

                  {/* Review date */}
                  <Typography variant="body2" color="text.secondary" align="right">
                    {formatReviewDate(trip.review.createdAt)}
                  </Typography>
                </Box>

                {/* Review text - simplified to match the image */}
                <Box
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.03)",
                    p: 3,
                    borderRadius: 1,
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontStyle: "italic",
                    }}
                  >
                    {trip.review.text}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  py: 4,
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" align="center">
                  Kelionė dar neturi atsiliepimų
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default ClientsTripListCard
