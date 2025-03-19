"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Paper, Typography, Box, CircularProgress, useTheme, Grid } from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

// Consistent typography styles
const typographyStyles = {
  fontSize: "1rem",
  fontWeight: 400,
}

const Calendar: React.FC = () => {
  const theme = useTheme()
  const currentDate = new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const [events, setEvents] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  // Adjust first day to start from Monday (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const days = ["Pir", "Ant", "Tre", "Ket", "Pen", "Šeš", "Sek"]
  const monthNames = [
    "Sausis",
    "Vasaris",
    "Kovas",
    "Balandis",
    "Gegužė",
    "Birželis",
    "Liepa",
    "Rugpjūtis",
    "Rugsėjis",
    "Spalis",
    "Lapkritis",
    "Gruodis",
  ]

  // Fetch today's events
  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        setLoading(true)
        const response = await axios.get<Record<string, string[]>>(`${API_URL}/TodayEvent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Agent-Id": localStorage.getItem("agentId"),
          },
        })
        setEvents(response.data)
      } catch (err) {
        console.error("Klaida gaunant šiandienos įvykius:", err)
        setEvents({})
      } finally {
        setLoading(false)
      }
    }

    fetchTodayEvents()
  }, [])

  // Create calendar grid
  const createCalendarGrid = () => {
    const grid = []
    let dayCount = 1

    // Create weeks
    for (let week = 0; week < 6; week++) {
      const weekDays = []

      // Create days in a week
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < adjustedFirstDay) {
          // Empty cells before the first day
          weekDays.push(<div key={`empty-${day}`} className="calendar-day empty" />)
        } else if (dayCount <= daysInMonth) {
          // Regular day cells
          const isToday = dayCount === currentDate.getDate()
          weekDays.push(
            <div key={dayCount} className={`calendar-day${isToday ? " today" : ""}`}>
              {dayCount}
            </div>,
          )
          dayCount++
        }
      }

      if (weekDays.some((day) => day !== null)) {
        grid.push(
          <div key={`week-${week}`} className="calendar-week">
            {weekDays}
          </div>,
        )
      }
    }

    return grid
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mt: 2,
        "& .calendar-header": {
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        },
        "& .calendar-days": {
          display: "flex",
          justifyContent: "space-between",
          mb: 1,
          "& > div": {
            width: "calc(100% / 7)",
            textAlign: "center",
            fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
            fontWeight: 400,
          },
        },
        "& .calendar-week": {
          display: "flex",
          justifyContent: "space-between",
          mb: 1,
        },
        "& .calendar-day": {
          width: "calc(100% / 7)",
          aspectRatio: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white", // Changed from grey to white
          border: "1px solid #f0f0f0", // Light border to separate days
          borderRadius: 1,
          fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
          fontWeight: 400,
          userSelect: "none",
          "&.today": {
            backgroundColor: theme.palette.primary.main,
            color: "white",
            border: "none", // Remove border for today
          },
          "&.empty": {
            backgroundColor: "transparent",
            border: "none", // No border for empty cells
          },
        },
      }}
    >
      <Typography align="center" sx={{ ...typographyStyles, fontSize: "1.25rem", mb: 2 }}>
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Typography>

      <div className="calendar-days">
        {days.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {createCalendarGrid()}

      {/* Events Section */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "grey.50" }}>
        <Typography sx={{ ...typographyStyles, fontSize: "1.25rem", mb: 2 }}>Šiandienos įvykiai</Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : Object.entries(events).length > 0 ? (
          <Grid container spacing={1}>
            {Object.entries(events).map(([category, eventList]) => (
              <Grid item xs={12} key={category}>
                <Typography sx={{ ...typographyStyles, fontWeight: 500, mt: 1 }}>
                  {category === "Šiandienos grįžimai" ? "🏠" : category === "Šiandienos išvykimai" ? "✈️" : "🎂"}{" "}
                  {category}
                </Typography>
                {eventList.map((event, index) => (
                  <Typography
                    key={index}
                    sx={{
                      ...typographyStyles,
                      ml: 2,
                      my: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "& > span": {
                        display: "inline-flex",
                        alignItems: "center",
                      },
                    }}
                  >
                    <span>
                      {category === "Šiandienos grįžimai" ? "🏠" : category === "Šiandienos išvykimai" ? "🌍" : "🎂"}
                    </span>
                    {event}
                  </Typography>
                ))}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography sx={{ ...typographyStyles, color: "text.secondary" }}>📅 Šiandien jokių įvykių nėra.</Typography>
        )}
      </Paper>
    </Paper>
  )
}

export default Calendar

