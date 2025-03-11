"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Paper, Typography, Box, CircularProgress, useTheme } from "@mui/material"
import { API_URL } from "../Utils/Configuration"
import axios from "axios"

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
        p: 3,
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
            fontSize: "1rem",
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
          backgroundColor: "rgba(0, 0, 0, 0.04)",
          borderRadius: 1,
          fontSize: "1rem",
          fontWeight: 400,
          userSelect: "none",
          "&.today": {
            backgroundColor: theme.palette.primary.main,
            color: "white",
          },
          "&.empty": {
            backgroundColor: "transparent",
          },
        },
      }}
    >
      <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 400 }}>
        Kalendorius
      </Typography>

      <div className="calendar-days">
        {days.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {createCalendarGrid()}

      {/* Events Section */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "grey.50" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 400 }}>
          Šiandienos įvykiai
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : Object.entries(events).length > 0 ? (
          Object.entries(events).map(([category, eventList]) => (
            <Box key={category} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 400, mt: 2 }}>
                {category === "Šiandienos grįžimai" ? "🏠" : category === "Šiandienos išvykimai" ? "✈️" : "🎂"} {category}
              </Typography>
              {eventList.map((event, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
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
                  <span>{category === "Šiandienos grįžimai" ? "🏠" : category === "Šiandienos išvykimai" ? "🌍" : "🎂"}</span>
                  {event}
                </Typography>
              ))}
            </Box>
          ))
          
        ) : (
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            📅 Šiandien jokių įvykių nėra.
          </Typography>
        )}
      </Paper>
    </Paper>
  )
}

export default Calendar

