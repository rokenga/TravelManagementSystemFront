"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Box, Chip, styled } from "@mui/material"
import { Email, Phone, CalendarToday, Message, Person } from "@mui/icons-material"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import { translateTripRequestStatus } from "../Utils/translateEnums"
import { useContext } from "react"
import { UserContext } from "../contexts/UserContext" // Assuming you have a UserContext

interface TripRequestCardProps {
  request: TripRequestResponse
  onClick: (id: string) => void
}

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease-in-out",
  marginBottom: theme.spacing(1),
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[6],
  },
}))

const getStatusColor = (status: TripRequestStatus) => {
  switch (status) {
    case TripRequestStatus.New:
      return "#4caf50" // Green
    case TripRequestStatus.Confirmed:
      return "#2196f3" // Blue
    default:
      return "#757575" // Grey
  }
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

const TripRequestCard: React.FC<TripRequestCardProps> = ({ request, onClick }) => {
  const user = useContext(UserContext)
  const isAdmin = user?.role === "Admin"
  const formattedDate = format(new Date(request.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })

  // Truncate name and message
  const truncatedName = truncateText(request.fullName, 30)
  const truncatedMessage = request.message ? truncateText(request.message, 100) : ""

  // Check if we should show agent info (admin user and agent info exists)
  const showAgentInfo = isAdmin && (request.agentFirstName || request.agentLastName)
  const agentName = showAgentInfo ? `${request.agentFirstName || ""} ${request.agentLastName || ""}`.trim() : ""

  return (
    <StyledCard>
      <CardActionArea onClick={() => onClick(request.id)}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "flex-start",
            py: 2,
            px: 2,
            position: "relative",
            "&:last-child": { pb: 2 },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", mb: 1 }}
            >
              <Typography variant="h6">{truncatedName}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                  }}
                >
                  <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: "0.875rem" }} />
                  {formattedDate}
                </Box>
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
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {request.status === TripRequestStatus.Confirmed && (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    <Email fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    <Phone fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.phoneNumber}
                    </Typography>
                  </Box>
                </>
              )}
              {showAgentInfo && (
                <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                  <Person fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {agentName}
                  </Typography>
                </Box>
              )}
              {request.message && (
                <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1, width: "100%" }}>
                  <Message fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {truncatedMessage}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  )
}

export default TripRequestCard
