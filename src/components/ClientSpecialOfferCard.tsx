"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"
import { translateOfferStatus, translateTripCategory } from "../Utils/translateEnums"
import { type TripResponse, TripCategory, OfferStatus } from "../types/ClientTrip"

const formatDate = (dateString?: string) => {
  if (!dateString) return "Nežinoma data"
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString))
}

const truncateText = (text = "", maxLength = 60) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

const calculateDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return null

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

const categoryColors = {
  [TripCategory.Tourist]: "#42A5F5", 
  [TripCategory.Group]: "#AB47BC", 
  [TripCategory.Relax]: "#FFA726", 
  [TripCategory.Business]: "#66BB6A", 
  [TripCategory.Cruise]: "#EC407A", 
}

const statusColors = {
  [OfferStatus.Draft]: "#FF9800",
  [OfferStatus.Confirmed]: "#4CAF50", 
}

interface SpecialOfferCardProps {
  offer: TripResponse
  onClick: (id: string) => void
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({ offer, onClick }) => {
  const duration = calculateDuration(offer.startDate, offer.endDate)

  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 3,
        },
        position: "relative",
      }}
    >
      <CardActionArea onClick={() => onClick(offer.id)} sx={{ height: "100%" }}>
        <CardContent
          sx={{
            p: 2,
          }}
        >
          <Box sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3, mr: 1 }}>
              {truncateText(offer.tripName || "Specialus pasiūlymas")}
            </Typography>
          </Box>

          {offer.destination && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <FlightTakeoffIcon sx={{ fontSize: "0.9rem", mr: 0.75, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {offer.destination}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
            {offer.category && (
              <Chip
                icon={<LocalOfferIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateTripCategory(offer.category)}
                size="small"
                sx={{
                  bgcolor: categoryColors[offer.category] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  height: 24,
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}

            {offer.status && (
              <Chip
                icon={<AccessTimeIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label={translateOfferStatus(offer.status)}
                size="small"
                sx={{
                  bgcolor: statusColors[offer.status] || "#757575",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  height: 24,
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
            {offer.isTransferred && offer.transferredFromAgentName && (
              <Chip
                icon={<SwapHorizIcon style={{ fontSize: "0.875rem", color: "white" }} />}
                label="Perkeltas"
                size="small"
                sx={{
                  bgcolor: "black",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  height: 24,
                  '& .MuiChip-icon': { color: 'white' },
                }}
                title={`Perkeltas nuo: ${offer.transferredFromAgentName}`}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {(offer.startDate || offer.endDate) && (
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                <CalendarTodayIcon sx={{ fontSize: "0.9rem", mr: 0.5, opacity: 0.7 }} />
                <Typography variant="caption">
                  {formatDate(offer.startDate)}
                  {offer.startDate && offer.endDate && " – "}
                  {offer.endDate &&
                    formatDate(offer.endDate) !== formatDate(offer.startDate) &&
                    formatDate(offer.endDate)}
                </Typography>
              </Box>
            )}

            {duration && (
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                <AccessTimeIcon sx={{ fontSize: "0.9rem", mr: 0.5, opacity: 0.7 }} />
                <Typography variant="caption">
                  {duration} {duration === 1 ? "diena" : duration > 1 && duration < 10 ? "dienos" : "dienų"}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default SpecialOfferCard
