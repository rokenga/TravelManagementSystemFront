"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Paper, Typography, Box, CircularProgress, useTheme, IconButton, Divider } from "@mui/material"
import {
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  FlightTakeoff as DepartureIcon,
  Cake as BirthdayIcon,
  RateReview as ReviewIcon,
  EventAvailable as OfferIcon,
  Event as EventIcon,
} from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

const categoryIcons: Record<string, React.ReactNode> = {
  "Šiandienos grįžimai": <HomeIcon fontSize="small" color="primary" />,
  "Šiandienos išvykimai": <DepartureIcon fontSize="small" color="primary" />,
  "Šiandien gimtadieniai": <BirthdayIcon fontSize="small" color="primary" />,
  "Kelionės, kurioms reikia atsiliepimo": <ReviewIcon fontSize="small" color="primary" />,
  "Pasiūlymai, kurie baigiasi": <OfferIcon fontSize="small" color="primary" />,
  "Kiti įvykiai": <EventIcon fontSize="small" color="primary" />,
}

const Calendar: React.FC = () => {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const today = new Date()

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
        setEvents({})
      } finally {
        setLoading(false)
      }
    }

    fetchTodayEvents()
  }, [])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const renderCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const calendarDays = []

    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(
        <Box
          key={`empty-${i}`}
          sx={{
            width: "calc(100% / 7)",
            aspectRatio: "1",
            p: 0.5,
          }}
        />,
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

      calendarDays.push(
        <Box
          key={`day-${day}`}
          sx={{
            width: "calc(100% / 7)",
            aspectRatio: "1",
            p: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              backgroundColor: isToday ? theme.palette.primary.main : "transparent",
              color: isToday ? "white" : "inherit",
              border: "1px solid #f0f0f0",
            }}
          >
            {day}
          </Box>
        </Box>,
      )
    }

    return <Box sx={{ display: "flex", flexWrap: "wrap" }}>{calendarDays}</Box>
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2 },
        mt: 0.5,
        boxShadow: 1,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography align="center" variant="h6">
          {monthNames[currentMonth]} {currentYear}
        </Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", mb: 1 }}>
        {days.map((day) => (
          <Box
            key={day}
            sx={{
              width: "calc(100% / 7)",
              textAlign: "center",
              p: 0.5,
              fontWeight: 500,
            }}
          >
            {day}
          </Box>
        ))}
      </Box>

      {renderCalendar()}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Šiandienos įvykiai
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : Object.entries(events).length > 0 ? (
          <Box>
            {Object.entries(events).map(([category, eventList], categoryIndex) => (
              <Box key={category} sx={{ mb: categoryIndex < Object.entries(events).length - 1 ? 2 : 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  {categoryIcons[category] || <EventIcon fontSize="small" color="primary" />}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      ml: 1,
                      fontWeight: 500,
                      fontSize: "0.95rem",
                    }}
                  >
                    {category}
                  </Typography>
                </Box>

                {eventList.map((event, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    sx={{
                      ml: 3.5,
                      mb: 0.5,
                      color: "text.primary",
                      fontSize: "0.85rem",
                      textAlign: "left",
                      lineHeight: 1.5,
                    }}
                  >
                    {event}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontSize: "0.85rem",
            }}
          >
            Šiandien jokių įvykių nėra.
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default Calendar
