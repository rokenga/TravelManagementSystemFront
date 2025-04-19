"use client"

import type React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip,
} from "@mui/material"
import { CalendarToday, Description, LocationOn, SwapHoriz } from "@mui/icons-material"
import type { TripResponse } from "../types/ClientTrip"
import { translateTripCategory, translateOfferStatus } from "../Utils/translateEnums"

interface SpecialOffersTableProps {
  offers: TripResponse[]
  onOfferClick: (offerId: string) => void
}

// Function to format date in Lithuanian format (yyyy-mm-dd)
const formatDate = (dateString?: string) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("lt-LT")
}

// Function to truncate text to a specific length
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Function to get category color
const getCategoryColor = (
  category: string,
): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (category) {
    case "Tourist":
      return "primary"
    case "Group":
      return "secondary"
    case "Relax":
      return "info"
    case "Business":
      return "warning"
    case "Cruise":
      return "success"
    default:
      return "default"
  }
}

// Function to get status color
const getStatusColor = (
  status: string,
): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case "Confirmed":
      return "success"
    case "Draft":
      return "warning"
    default:
      return "default"
  }
}

const SpecialOffersTable: React.FC<SpecialOffersTableProps> = ({ offers, onOfferClick }) => {
  return (
    <Box>
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "30%" }}>
                Pavadinimas
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "15%" }}>Kategorija</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "12%" }}>Būsena</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "15%" }}>Sukurta</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "13%" }}>Kaina (€)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText", width: "15%" }}>Keleiviai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Pasiūlymų nerasta
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer, index) => (
                <TableRow
                  key={offer.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "background.default" : "background.paper",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => onOfferClick(offer.id)}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {truncateText(offer.tripName || "", 100)}
                      </Typography>
                      {offer.isTransferred && offer.transferredFromAgentName && (
                        <Tooltip title={`Perkeltas nuo: ${offer.transferredFromAgentName}`}>
                          <Chip
                            icon={<SwapHoriz sx={{ fontSize: "0.7rem" }} />}
                            label="Perkeltas"
                            color="info"
                            size="small"
                            sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    {offer.description && (
                      <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                        <Description fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 14 }} />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {offer.description}
                        </Typography>
                      </Box>
                    )}
                    {offer.destination && (
                      <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {offer.destination}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {offer.category ? (
                      <Chip
                        label={translateTripCategory(offer.category)}
                        color={getCategoryColor(offer.category)}
                        size="small"
                      />
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>
                    {offer.status ? (
                      <Chip
                        label={translateOfferStatus(offer.status)}
                        color={getStatusColor(offer.status)}
                        size="small"
                      />
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2">{formatDate(offer.createdAt)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {offer.price ? `€${offer.price.toFixed(2)}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {offer.adultsCount || "0"} suaug. / {offer.childrenCount || "0"} vaik.
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SpecialOffersTable
