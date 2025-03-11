import type React from "react";
import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";
import { translateTripCategory, translateTripStatus } from "../Utils/translateEnums";
import type { TripResponse } from "../types/ClientTrip";

// Lithuanian date formatter (YYYY-MM-DD)
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Nežinoma data";
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
};

interface TripSummaryCardProps {
  trip: TripResponse;
  onClick?: (id: string) => void;
}

const TripSummaryCard: React.FC<TripSummaryCardProps> = ({ trip, onClick }) => {
  let statusColor = "#757575";
  let statusBgColor = "#f5f5f5";

  if (trip.status) {
    switch (trip.status.toLowerCase()) {
      case "draft":
        statusColor = "#ff9800";
        statusBgColor = "#fff8e1";
        break;
      case "confirmed":
        statusColor = "#4caf50";
        statusBgColor = "#e8f5e9";
        break;
      case "cancelled":
        statusColor = "#f44336";
        statusBgColor = "#ffebee";
        break;
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(trip.id);
    }
  };

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
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {trip.tripName || "Kelionė be pavadinimo"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: "rgba(0,0,0,0.08)",
                fontSize: "0.75rem",
              }}
            >
              {trip.category ? translateTripCategory(trip.category) : "Be kategorijos"}
            </Box>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: statusBgColor,
                color: statusColor,
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              {trip.status ? translateTripStatus(trip.status) : "Nežinomas statusas"}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: "text.secondary",
              fontSize: "0.875rem",
              mt: 2,
            }}
          >
            <Box component="span">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default TripSummaryCard;
