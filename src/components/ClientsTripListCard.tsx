"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip, Divider, LinearProgress } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import PaymentIcon from "@mui/icons-material/Payment"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import StarIcon from "@mui/icons-material/Star"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import { translateTripStatus, translateTripCategory } from "../Utils/translateEnums"
import type { ClientTripListResponse } from "../types/ClientsTripList"
import { TripStatus, TripCategory } from "../types/ClientTrip"

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

const formatReviewDate = (dateString: string) => {
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

const statusColors = {
  [TripStatus.Draft]: "#FF9800", 
  [TripStatus.Confirmed]: "#4CAF50", 
  [TripStatus.Cancelled]: "#F44336",
}

const categoryColors = {
  [TripCategory.Tourist]: "#42A5F5",
  [TripCategory.Group]: "#AB47BC",
  [TripCategory.Relax]: "#FFA726", 
  [TripCategory.Business]: "#66BB6A", 
  [TripCategory.Cruise]: "#EC407A", 
}

const getRatingColor = (rating: number) => {
  if (rating >= 8) return "#4CAF50" 
  if (rating >= 5) return "#FFC107" 
  return "#F44336" 
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
          <Box sx={{ flex: 1, pr: { xs: 0, md: 2 } }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mr: 1 }}>
                {truncateText(trip.tripName || "Kelionė be pavadinimo")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", mb: 2, flexWrap: "wrap", gap: 1 }}>
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

            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                <CalendarTodayIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </Typography>
              </Box>

              {trip.price !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                  <PaymentIcon sx={{ fontSize: "1rem", mr: 1, opacity: 0.7 }} />
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    {formatPrice(trip.price)}
                  </Typography>
                </Box>
              )}

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

          <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: "none", md: "block" } }} />

          <Divider sx={{ my: 2, display: { xs: "block", md: "none" } }} />

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {trip.review ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Atsiliepimas
                  </Typography>

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

                  <Typography variant="body2" color="text.secondary" align="right">
                    {formatReviewDate(trip.review.createdAt)}
                  </Typography>
                </Box>

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
