"use client"

import type React from "react"
import { Card, CardContent, Typography, Box, Chip, styled } from "@mui/material"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import { translateTripRequestStatus } from "../Utils/translateEnums"

interface TripRequestCardProps {
  request: TripRequestResponse
  onClick: (id: string) => void
}

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  transition: "transform 0.2s",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[2],
  },
}))

const getStatusColor = (status: TripRequestStatus) => {
  switch (status) {
    case TripRequestStatus.New:
      return "#4caf50" // Green
    case TripRequestStatus.Locked:
      return "#ff9800" // Orange
    case TripRequestStatus.Confirmed:
      return "#2196f3" // Blue
    default:
      return "#757575" // Grey
  }
}

// Consistent typography styles
const typographyStyles = {
  fontSize: "1rem",
  fontWeight: 400,
}

const TripRequestCard: React.FC<TripRequestCardProps> = ({ request, onClick }) => {
  const formattedDate = format(new Date(request.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })

  return (
    <StyledCard onClick={() => onClick(request.id)}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ ...typographyStyles, fontWeight: 500 }}>{request.fullName}</Typography>
          <Chip
            label={translateTripRequestStatus(request.status)}
            size="small"
            sx={{
              backgroundColor: getStatusColor(request.status),
              color: "white",
              height: 24,
              fontSize: "0.75rem",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
            "& > div": {
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.875rem",
              color: "text.secondary",
            },
          }}
        >
          <div>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem", fontWeight: 500 }}>
              El. paštas:
            </Typography>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem" }}>
              {request.email}
            </Typography>
          </div>
          <div>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem", fontWeight: 500 }}>
              Tel:
            </Typography>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem" }}>
              {request.phoneNumber}
            </Typography>
          </div>
          <div>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem", fontWeight: 500 }}>
              Data:
            </Typography>
            <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem" }}>
              {formattedDate}
            </Typography>
          </div>
          {request.message && (
            <div style={{ width: "100%" }}>
              <Typography component="span" sx={{ ...typographyStyles, fontSize: "0.875rem", fontWeight: 500 }}>
                Žinutė:
              </Typography>
              <Typography
                component="span"
                sx={{
                  ...typographyStyles,
                  fontSize: "0.875rem",
                  display: "inline-block",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {request.message}
              </Typography>
            </div>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  )
}

export default TripRequestCard

