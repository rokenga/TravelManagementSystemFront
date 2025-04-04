"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Grid,
  Box,
  Typography,
  IconButton,
  Alert,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import { Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material"
import EventCard from "../EventForm"
import ImageUploadForm from "./ImageUploadForm"
import type dayjs from "dayjs"
import { DirectionsCar, Hotel, LocalActivity, Sailing, Image, Flight, Train, DirectionsBus } from "@mui/icons-material"

interface EventListProps {
  events: any[]
  dayByDay: boolean
  dayDate: string
  tripStart: dayjs.Dayjs
  tripEnd: dayjs.Dayjs
  onRemoveEvent: (index: number) => void
  onEventChange: (index: number, field: string, value: any) => void
  stepImages?: File[]
  onImageChange?: (files: File[]) => void
  existingImageUrls?: string[]
  onExistingImageDelete?: (imageId: string) => void
}

const EventList: React.FC<EventListProps> = ({
  events,
  dayByDay,
  dayDate,
  tripStart,
  tripEnd,
  onRemoveEvent,
  onEventChange,
  stepImages = [],
  onImageChange,
  existingImageUrls = [],
  onExistingImageDelete,
}) => {
  // Add console logs to debug
  console.log("EventList - events:", events)
  console.log("EventList - stepImages:", stepImages)
  console.log("EventList - existingImageUrls:", existingImageUrls)

  const theme = useTheme()

  // State to track expanded state of each accordion
  const [expandedState, setExpandedState] = useState<Record<number, boolean>>({})

  // Initialize expanded state when events change
  useEffect(() => {
    const newExpandedState: Record<number, boolean> = {}
    events.forEach((_, index) => {
      // If we already have a state for this index, keep it, otherwise default to false (collapsed)
      newExpandedState[index] = expandedState[index] !== undefined ? expandedState[index] : false
    })
    setExpandedState(newExpandedState)
  }, [events.length])

  // Handle accordion expansion change
  const handleAccordionChange = (index: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedState((prev) => ({
      ...prev,
      [index]: isExpanded,
    }))
  }

  if (events.length === 0) {
    return (
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 1 }}>
          {dayByDay
            ? "Šiai dienai dar nepridėta jokių įvykių. Naudokite mygtuką aukščiau, kad pridėtumėte transportą, apgyvendinimą, veiklą arba kruizą."
            : "Kelionei dar nepridėta jokių įvykių. Naudokite mygtuką aukščiau, kad pridėtumėte transportą, apgyvendinimą, veiklą arba kruizą."}
        </Alert>
      </Grid>
    )
  }

  // Helper function to get the appropriate icon for each event type
  const getEventIcon = (eventType: string, transportType?: string) => {
    if (eventType === "transport") {
      switch (transportType) {
        case "Flight":
          return <Flight sx={{ mr: 1, color: "primary.main" }} />
        case "Train":
          return <Train sx={{ mr: 1, color: "primary.main" }} />
        case "Bus":
          return <DirectionsBus sx={{ mr: 1, color: "primary.main" }} />
        case "Car":
          return <DirectionsCar sx={{ mr: 1, color: "primary.main" }} />
        case "Ferry":
          return <Sailing sx={{ mr: 1, color: "primary.main" }} />
        default:
          return <DirectionsCar sx={{ mr: 1, color: "primary.main" }} />
      }
    } else if (eventType === "accommodation") {
      return <Hotel sx={{ mr: 1, color: "primary.main" }} />
    } else if (eventType === "activity") {
      return <LocalActivity sx={{ mr: 1, color: "primary.main" }} />
    } else if (eventType === "cruise") {
      return <Sailing sx={{ mr: 1, color: "primary.main" }} />
    } else if (eventType === "images") {
      return <Image sx={{ mr: 1, color: "primary.main" }} />
    }
    return <DirectionsCar sx={{ mr: 1, color: "primary.main" }} />
  }

  // Helper function to get a title for the event
  const getEventTitle = (evt: any) => {
    if (evt.type === "transport") {
      const transportTypeLabels: Record<string, string> = {
        Flight: "Skrydis",
        Train: "Traukinys",
        Bus: "Autobusas",
        Car: "Automobilis",
        Ferry: "Keltas",
      }

      const transportType = transportTypeLabels[evt.transportType] || "Transportas"

      if (evt.transportName) {
        return `${transportType} - ${evt.transportName}`
      }
      return transportType
    } else if (evt.type === "accommodation") {
      return evt.hotelName ? `Apgyvendinimas - ${evt.hotelName}` : "Apgyvendinimas"
    } else if (evt.type === "activity") {
      return "Veikla"
    } else if (evt.type === "cruise") {
      return evt.transportName ? `Kruizas - ${evt.transportName}` : "Kruizas"
    } else if (evt.type === "images") {
      return "Nuotraukos"
    }
    return "Įvykis"
  }

  // Helper function to format date for display
  const formatEventDate = (evt: any) => {
    const formatTime = (time: string) => {
      if (!time) return "nenustatyta"
      const date = new Date(time)
      return date.toLocaleString("lt-LT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    if (evt.type === "transport" || evt.type === "cruise") {
      return `${evt.departurePlace || "Išvykimas"} (${formatTime(evt.departureTime)}) - ${evt.arrivalPlace || "Atvykimas"} (${formatTime(evt.arrivalTime)})`
    } else if (evt.type === "accommodation") {
      return `${formatTime(evt.checkIn)} - ${formatTime(evt.checkOut)}`
    } else if (evt.type === "activity") {
      return formatTime(evt.activityTime)
    }
    return ""
  }

  return (
    <>
      {events.map((evt, eIndex) => {
        // Add console log for each event
        console.log(`EventList - Event ${eIndex}:`, evt)

        // For image events, log the props being passed
        if (evt.type === "images") {
          console.log(`EventList - Image event ${eIndex} - stepImages:`, stepImages)
          console.log(`EventList - Image event ${eIndex} - existingImageUrls:`, existingImageUrls)
          console.log(`EventList - Image event ${eIndex} - existingImageUrls length:`, existingImageUrls.length)

          if (existingImageUrls.length > 0) {
            console.log(`EventList - First image URL:`, existingImageUrls[0])
          }
        }

        return (
          <Grid item xs={12} key={eIndex}>
            <Accordion
              expanded={expandedState[eIndex] || false}
              onChange={handleAccordionChange(eIndex)}
              sx={{
                mb: 0.5, // Minimal spacing between accordions
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                "&:before": {
                  display: "none",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`event-content-${eIndex}`}
                id={`event-header-${eIndex}`}
                sx={{
                  bgcolor: "background.paper",
                  borderBottom: expandedState[eIndex] ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
                  minHeight: "48px", // Reduced height
                  "& .MuiAccordionSummary-content": {
                    margin: "6px 0", // Reduced vertical padding
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {getEventIcon(evt.type, evt.transportType)}
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      {getEventTitle(evt)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      ml: 2,
                      pr: 4, // Space for delete button
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {formatEventDate(evt)}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveEvent(eIndex)
                      }}
                      sx={{
                        color: theme.palette.error.main,
                        position: "absolute",
                        right: 40,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, bgcolor: "background.default" }}>
                {evt.type === "images" ? (
                  <>
                    {console.log("Rendering ImageUploadForm with:", {
                      stepImages,
                      existingImageUrls,
                      hasExistingImageDelete: !!onExistingImageDelete,
                    })}
                    <ImageUploadForm
                      images={stepImages || []}
                      onImageChange={onImageChange || (() => {})}
                      existingImageUrls={existingImageUrls}
                      onExistingImageDelete={onExistingImageDelete}
                    />
                  </>
                ) : (
                  <EventCard
                    event={evt}
                    dayByDay={dayByDay}
                    dayDate={dayDate}
                    tripStart={tripStart}
                    tripEnd={tripEnd}
                    onChange={(field, value) => onEventChange(eIndex, field, value)}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )
      })}
    </>
  )
}

export default EventList