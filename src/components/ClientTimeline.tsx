"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
  FormControl,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Stack,
} from "@mui/material"
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab"
import { FlightTakeoff, LocalOffer, CalendarMonth, FilterAlt } from "@mui/icons-material"
import type { TripResponse, TripCategory } from "../types/ClientTrip"
import { useNavigate } from "react-router-dom"
import { translateTripCategory } from "../Utils/translateEnums"

interface TimelineEvent {
  id: string
  title: string
  category?: TripCategory
  date: string
  type: "trip" | "offer"
  description: string
  endDate?: string
}

interface ClientTimelineProps {
  trips: TripResponse[]
  offers: {
    id: string
    title: string
    description: string
    createdAt?: string
  }[]
}

// Time period options in months
type TimePeriod = 6 | 12 | 24 | 0 // 0 means "All"

const ClientTimeline: React.FC<ClientTimelineProps> = ({ trips, offers }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(6) // Default to 6 months
  const navigate = useNavigate()

  // Convert trips and offers to a unified timeline format
  const timelineEvents: TimelineEvent[] = useMemo(
    () => [
      ...trips.map((trip) => {
        const startDate = trip.startDate ? trip.startDate : "0000-00-00" // Default value if undefined
        const endDate = trip.endDate ? trip.endDate : "0000-00-00"

        return {
          id: trip.id,
          title: trip.tripName ? trip.tripName : "Be pavadinimo",
          category: trip.category as TripCategory,
          date: startDate,
          type: "trip" as const,
          description: `${new Date(startDate).toLocaleDateString("lt-LT")} - ${new Date(endDate).toLocaleDateString("lt-LT")}`,
          endDate: endDate,
        }
      }),
      ...offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        date: offer.createdAt || new Date().toISOString().split("T")[0], // Use current date if createdAt is not available
        type: "offer" as const,
        description: offer.description,
      })),
    ],
    [trips, offers],
  )

  // Filter events based on selected time period
  const filteredEvents = useMemo(() => {
    if (timePeriod === 0) {
      // Return all events if "All" is selected
      return timelineEvents
    }

    const now = new Date()
    const cutoffDate = new Date()
    cutoffDate.setMonth(now.getMonth() - timePeriod) // Go back X months

    return timelineEvents.filter((event) => {
      // Skip events with invalid dates
      if (event.date === "0000-00-00") return false

      const eventDate = new Date(event.date)
      return eventDate >= cutoffDate
    })
  }, [timelineEvents, timePeriod])

  // Sort items by date (newest first)
  const sortedEvents = useMemo(
    () => filteredEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredEvents],
  )

  const handleTimePeriodChange = (event: SelectChangeEvent<number>) => {
    setTimePeriod(event.target.value as TimePeriod)
  }

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`)
  }

  return (
    <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
      {/* Time period filter */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
        <FormControl
          size="small"
          sx={{
            minWidth: 200,
          }}
        >
          <Select
            value={timePeriod}
            onChange={handleTimePeriodChange}
            displayEmpty
            renderValue={() => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterAlt fontSize="small" sx={{ color: "action.active" }} />
                <span>
                  Laikotarpis:{" "}
                  {timePeriod === 6
                    ? "Paskutiniai 6 mėn."
                    : timePeriod === 12
                      ? "Paskutiniai 12 mėn."
                      : timePeriod === 24
                        ? "Paskutiniai 24 mėn."
                        : "Visi įrašai"}
                </span>
              </Box>
            )}
          >
            <MenuItem value={6}>Paskutiniai 6 mėn.</MenuItem>
            <MenuItem value={12}>Paskutiniai 12 mėn.</MenuItem>
            <MenuItem value={24}>Paskutiniai 24 mėn.</MenuItem>
            <MenuItem value={0}>Visi įrašai</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {sortedEvents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Nėra įrašų pasirinktame laikotarpyje
          </Typography>
        </Paper>
      ) : (
        <Timeline position={isMobile ? "right" : "alternate"} sx={{ p: 0, m: 0 }}>
          {sortedEvents.map((event) => (
            <TimelineItem key={event.id}>
              {!isMobile && (
                <TimelineOppositeContent sx={{ m: "auto 0" }}>
                  <Typography variant="body2" color="text.secondary">
                    {event.date !== "0000-00-00" ? new Date(event.date).toLocaleDateString("lt-LT") : "Nežinoma data"}
                  </Typography>
                  {event.type === "trip" && event.endDate && event.endDate !== "0000-00-00" && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      - {new Date(event.endDate).toLocaleDateString("lt-LT")}
                    </Typography>
                  )}
                </TimelineOppositeContent>
              )}

              <TimelineSeparator>
                <TimelineDot color={event.type === "trip" ? "primary" : "secondary"} variant="outlined">
                  {event.type === "trip" ? <FlightTakeoff /> : <LocalOffer />}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>

              <TimelineContent sx={{ py: 2, px: 2 }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    maxWidth: isMobile ? "100%" : "80%",
                    marginLeft: isMobile ? 0 : "auto",
                    marginRight: isMobile ? 0 : "auto",
                    borderLeft: `4px solid ${event.type === "trip" ? theme.palette.primary.main : theme.palette.secondary.main}`,
                    transition: "all 0.2s ease-in-out",
                    cursor: event.type === "trip" ? "pointer" : "default",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => (event.type === "trip" ? handleTripClick(event.id) : null)}
                >
                  <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                    {event.title}
                  </Typography>

                  {isMobile && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarMonth fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.date !== "0000-00-00"
                          ? new Date(event.date).toLocaleDateString("lt-LT")
                          : "Nežinoma data"}
                        {event.type === "trip" &&
                          event.endDate &&
                          event.endDate !== "0000-00-00" &&
                          ` - ${new Date(event.endDate).toLocaleDateString("lt-LT")}`}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {event.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={event.type === "trip" ? "Kelionė" : "Pasiūlymas"}
                      color={event.type === "trip" ? "primary" : "secondary"}
                      variant="outlined"
                    />
                    {event.type === "trip" && event.category && (
                      <Chip
                        size="small"
                        label={translateTripCategory(event.category)}
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </Box>
  )
}

export default ClientTimeline

