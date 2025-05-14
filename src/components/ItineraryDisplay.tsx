"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  ButtonGroup,
  Button,
  List,
  ListItem,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material"
import { ExpandMore } from "@mui/icons-material"
import ImageGallery from "./ImageGallery"

interface TripEvent {
  id?: string
  type?: string
  time?: string
  description: string
  details?: string
  images?: any[]
  stepDayNumber?: number
  transportType?: string
  departureTime?: string
  arrivalTime?: string
  departurePlace?: string
  arrivalPlace?: string
  hotelName?: string
  checkIn?: string
  checkOut?: string
  activityTime?: string
}

interface ItineraryDisplayProps {
  itinerary: {
    sortedEvents?: TripEvent[]
  } | null
  isDayByDay: boolean
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, isDayByDay }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const eventsByDay: { [key: number]: TripEvent[] } = {}
  itinerary?.sortedEvents?.forEach((ev: TripEvent) => {
    const dayNum = ev.stepDayNumber ?? 0
    if (!eventsByDay[dayNum]) {
      eventsByDay[dayNum] = []
    }
    eventsByDay[dayNum].push(ev)
  })

  const sortedDayKeys = Object.keys(eventsByDay)
    .map((k) => Number(k))
    .sort((a, b) => a - b)

  const [activeDay, setActiveDay] = useState(sortedDayKeys[0] || 0)

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—"
    const dateObj = new Date(timeStr)

    return dateObj.toLocaleString("lt-LT", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventTitle = (event: TripEvent) => {
    if (event.type === "transport" || event.transportType) {
      return `${event.departurePlace || ""} → ${event.arrivalPlace || ""}`
    } else if (event.type === "accommodation" || event.hotelName) {
      return event.hotelName || "Apgyvendinimas"
    } else {
      return event.description
    }
  }

  const getEventTimeDisplay = (event: TripEvent) => {
    if (event.type === "transport" || event.transportType) {
      return `${formatTime(event.departureTime)} - ${formatTime(event.arrivalTime)}`
    } else if (event.type === "accommodation" || event.hotelName) {
      return `${formatTime(event.checkIn)} - ${formatTime(event.checkOut)}`
    } else if (event.type === "activity" || event.activityTime) {
      return formatTime(event.activityTime)
    } else {
      return formatTime(event.time)
    }
  }

  if (!itinerary?.sortedEvents?.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Maršrutas dar nesudarytas.
        </Typography>
      </Box>
    )
  }

  if (isDayByDay) {
    return (
      <Card elevation={0} sx={{ borderRadius: 0, boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <ButtonGroup
              variant="outlined"
              aria-label="day selection"
              sx={{
                flexWrap: isMobile ? "wrap" : "nowrap",
                justifyContent: "center",
                gap: isMobile ? 1 : 0,
              }}
            >
              {sortedDayKeys.map((day) => (
                <Button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  variant={activeDay === day ? "contained" : "outlined"}
                  sx={{
                    minWidth: isMobile ? "45%" : "auto",
                    mb: isMobile ? 1 : 0,
                  }}
                >
                  Diena {day}
                </Button>
              ))}
            </ButtonGroup>
          </Box>

          <Box sx={{ px: { xs: 1, sm: 2 } }}>
            {!eventsByDay[activeDay] || eventsByDay[activeDay].length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                Šiai dienai nėra suplanuotų įvykių.
              </Typography>
            ) : (
              <List sx={{ width: "100%", p: 0 }}>
                {eventsByDay[activeDay]?.map((event, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: "block",
                      p: 0,
                      mb: 3,
                      pb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
                        {getEventTimeDisplay(event)}
                      </Typography>
                      <Typography variant="body1">{getEventTitle(event)}</Typography>
                    </Box>

                    {event.details && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 1 }}>
                        {event.details}
                      </Typography>
                    )}

                    {event.images && event.images.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <ImageGallery images={event.images} thumbnailSize={100} showTitle={false} />
                      </Box>
                    )}

                    {index < eventsByDay[activeDay].length - 1 && <Divider sx={{ mt: 2 }} />}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 0, boxShadow: "none" }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 0, sm: 2 } }}>
          {sortedDayKeys.length > 1 ? (
            sortedDayKeys.map((dayKey, idx) => (
              <Accordion key={dayKey} defaultExpanded={idx === 0} elevation={0} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    minHeight: 48,
                    "& .MuiAccordionSummary-content": {
                      margin: "12px 0",
                    },
                  }}
                >
                  <Typography variant="subtitle1">
                    {dayKey === 0 ? "Bendras maršrutas" : `Maršrutas ${idx + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List sx={{ width: "100%", p: 0 }}>
                    {eventsByDay[dayKey].map((event, eventIdx) => (
                      <ListItem
                        key={eventIdx}
                        sx={{
                          display: "block",
                          p: 2,
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
                            {getEventTimeDisplay(event)}
                          </Typography>
                          <Typography variant="body1">{getEventTitle(event)}</Typography>
                        </Box>

                        {event.details && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 1 }}>
                            {event.details}
                          </Typography>
                        )}

                        {event.images && event.images.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <ImageGallery images={event.images} thumbnailSize={80} showTitle={false} />
                          </Box>
                        )}

                        {eventIdx < eventsByDay[dayKey].length - 1 && <Divider sx={{ mt: 2 }} />}
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <List sx={{ width: "100%", p: 0 }}>
              {eventsByDay[sortedDayKeys[0]]?.map((event, eventIdx) => (
                <ListItem
                  key={eventIdx}
                  sx={{
                    display: "block",
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
                      {getEventTimeDisplay(event)}
                    </Typography>
                    <Typography variant="body1">{getEventTitle(event)}</Typography>
                  </Box>

                  {event.details && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 1 }}>
                      {event.details}
                    </Typography>
                  )}

                  {event.images && event.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <ImageGallery images={event.images} thumbnailSize={80} showTitle={false} />
                    </Box>
                  )}

                  {eventIdx < eventsByDay[sortedDayKeys[0]].length - 1 && <Divider sx={{ mt: 2 }} />}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ItineraryDisplay
