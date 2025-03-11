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
  Tooltip,
  IconButton,
  Chip,
} from "@mui/material"
import { Visibility, CalendarToday, Description } from "@mui/icons-material";
import type { TripResponse } from "../types/ClientTrip"
import { translateTripCategory, translateTripStatus, translatePaymentStatus } from "../Utils/translateEnums"

interface TripsTableProps {
  trips: TripResponse[]
  onTripClick: (tripId: string) => void
}

// Function to format date in Lithuanian format (yyyy-mm-dd)
const formatDate = (dateString?: string) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toISOString().split("T")[0] // Extract yyyy-mm-dd
}

// Function to determine if a trip is upcoming
const isUpcoming = (startDate?: string): boolean => {
  if (!startDate) return false
  const tripStart = new Date(startDate)
  const today = new Date()
  return tripStart > today
}

// Function to determine if a trip is active (currently happening)
const isActive = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return false
  const tripStart = new Date(startDate)
  const tripEnd = new Date(endDate)
  const today = new Date()
  return today >= tripStart && today <= tripEnd
}

const TripsTable: React.FC<TripsTableProps> = ({ trips, onTripClick }) => {
  // Get status color based on trip status
  const getStatusColor = (
    status: string,
  ): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case "CONFIRMED":
        return "success"
      case "PENDING":
        return "warning"
      case "CANCELLED":
        return "error"
      case "COMPLETED":
        return "info"
      default:
        return "default"
    }
  }

  // Get payment status color
  const getPaymentStatusColor = (
    status: string,
  ): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case "PAID":
        return "success"
      case "PENDING":
        return "warning"
      case "REFUNDED":
        return "error"
      case "PARTIAL":
        return "info"
      default:
        return "default"
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Kelionių sąrašas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Viso: {trips.length} kelionių
        </Typography>
      </Box>
      
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Pavadinimas</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Kategorija</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Būsena</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Mokėjimas</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Datos</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Kaina (€)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Keleiviai</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Veiksmai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Kelionių nerasta
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip, index) => (
                <TableRow 
                  key={trip.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? "background.default" : "background.paper",
                    cursor: "pointer",
                    "&:hover": { 
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => onTripClick(trip.id)}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {trip.tripName || ""}
                      </Typography>
                      {isActive(trip.startDate, trip.endDate) && (
                        <Chip 
                          label="Vyksta" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                      {isUpcoming(trip.startDate) && !isActive(trip.startDate, trip.endDate) && (
                        <Chip 
                          label="Artėja" 
                          color="info" 
                          size="small" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                    </Box>
                    {trip.description && (
                      <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                        <Description fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {trip.description}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {trip.category ? (
                      <Chip 
                        label={translateTripCategory(trip.category)} 
                        size="small" 
                        variant="outlined"
                      />
                    ) : ""}
                  </TableCell>
                  <TableCell>
                    {trip.status ? (
                      <Chip 
                        label={translateTripStatus(trip.status)} 
                        color={getStatusColor(trip.status)}
                        size="small"
                      />
                    ) : ""}
                  </TableCell>
                  <TableCell>
                    {trip.paymentStatus ? (
                      <Chip 
                        label={translatePaymentStatus(trip.paymentStatus)} 
                        color={getPaymentStatusColor(trip.paymentStatus)}
                        size="small"
                      />
                    ) : ""}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2">
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {trip.price ? `€${trip.price.toFixed(2)}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trip.adultsCount || "0"} suaug. / {trip.childrenCount || "0"} vaik.
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Peržiūrėti kelionės informaciją">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTripClick(trip.id);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default TripsTable

