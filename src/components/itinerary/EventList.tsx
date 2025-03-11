"use client"

import type React from "react"
import { Grid, Paper, Box, Typography, IconButton, Divider, Alert, useTheme } from "@mui/material"
import { Delete as DeleteIcon } from "@mui/icons-material"
import EventCard from "../EventForm"
import { getEventTitle } from "../../Utils/eventValidation"
import type dayjs from "dayjs"

interface EventListProps {
  events: any[]
  dayByDay: boolean
  dayDate: string
  tripStart: dayjs.Dayjs
  tripEnd: dayjs.Dayjs
  onRemoveEvent: (index: number) => void
  onEventChange: (index: number, field: string, value: any) => void
}

const EventList: React.FC<EventListProps> = ({
  events,
  dayByDay,
  dayDate,
  tripStart,
  tripEnd,
  onRemoveEvent,
  onEventChange,
}) => {
  const theme = useTheme()

  if (events.length === 0) {
    return (
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {dayByDay
            ? "Šiai dienai dar nepridėta jokių įvykių. Naudokite mygtuką aukščiau, kad pridėtumėte transportą, nakvynę, veiklą arba kruizą."
            : "Kelionei dar nepridėta jokių įvykių. Naudokite mygtuką aukščiau, kad pridėtumėte transportą, nakvynę, veiklą arba kruizą."}
        </Alert>
      </Grid>
    )
  }

  return (
    <>
      {events.map((evt, eIndex) => (
        <Grid item xs={12} key={eIndex}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              position: "relative",
              borderRadius: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: 2,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>
                {getEventTitle(evt)}
              </Typography>
              <IconButton
                onClick={() => onRemoveEvent(eIndex)}
                color="error"
                size="small"
                sx={{
                  "&:hover": {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.contrastText,
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <EventCard
              event={evt}
              dayByDay={dayByDay}
              dayDate={dayDate}
              tripStart={tripStart}
              tripEnd={tripEnd}
              onChange={(field, value) => onEventChange(eIndex, field, value)}
            />
          </Paper>
        </Grid>
      ))}
    </>
  )
}

export default EventList

