"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
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
  [TripCategory.Tourist]: "#90CAF9", 
  [TripCategory.Group]: "#CE93D8", 
  [TripCategory.Relax]: "#FFCC80", 
  [TripCategory.Business]: "#A5D6A7", 
  [TripCategory.Cruise]: "#F48FB1", 
}

const statusColors = {
  [OfferStatus.Draft]: "#FFB74D",
  [OfferStatus.Confirmed]: "#81C784", 
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

          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 0.5 }}>
            {offer.category && (
              <Chip
                label={translateTripCategory(offer.category)}
                size="small"
                sx={{
                  height: "20px",
                  fontSize: "0.7rem",
                  bgcolor: categoryColors[offer.category] || "#E0E0E0",
                  color: "rgba(0,0,0,0.7)",
                }}
              />
            )}

            {offer.status && (
              <Chip
                label={translateOfferStatus(offer.status)}
                size="small"
                sx={{
                  height: "20px",
                  fontSize: "0.7rem",
                  bgcolor: statusColors[offer.status] || "#E0E0E0",
                  color: "rgba(0,0,0,0.7)",
                }}
              />
            )}
            {offer.isTransferred && offer.transferredFromAgentName && (
              <Chip
                label="Perkeltas"
                size="small"
                sx={{
                  height: "20px",
                  fontSize: "0.7rem",
                  bgcolor: "#2196F3", 
                  color: "white",
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
