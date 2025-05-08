"use client"

import type React from "react"
import { Typography, Paper, Divider } from "@mui/material"
import PreviewEvent from "./PreviewEvent"
import { formatEarliestTime } from "../../../Utils/eventFormatting"
import type { ItineraryDay, TripEvent, ValidationWarning } from "../../../types"

interface MultiDayPreviewProps {
  days: ItineraryDay[]
  warnings?: ValidationWarning[]
  hideHighlighting?: boolean
}

// Extended event type with UI-specific properties
interface ProcessedEvent extends TripEvent {
  timeInfo: ReturnType<typeof formatEarliestTime>
  isArrivalEvent?: boolean
  isCheckoutEvent?: boolean
  isOverlapping?: boolean
  isShortStay?: boolean
}

// Extended day type with processed events
interface ProcessedDay extends Omit<ItineraryDay, "events"> {
  events: ProcessedEvent[]
  originalIndex: number // Store the original day number
}

const MultiDayPreview: React.FC<MultiDayPreviewProps> = ({ days, warnings = [], hideHighlighting = false }) => {
  if (!days.length) {
    return (
      <Typography variant="body1" textAlign="center">
        Maršrutas dar nesudarytas.
      </Typography>
    )
  }

  // Helper function to format date as YYYY-MM-DD consistently
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Create a map of all days in the itinerary
  const daysMap = new Map<string, ProcessedDay>()

  // Initialize the map with the original days
  days.forEach((day) => {
    daysMap.set(day.dayLabel, {
      ...day,
      events: [],
      originalIndex: day.originalIndex || 0,
    })
  })

  // Process each day's events and add them to the appropriate day
  days.forEach((day) => {
    const currentDay = daysMap.get(day.dayLabel)!

    // Process events to get time information
    day.events.forEach((evt) => {
      const timeInfo = formatEarliestTime(evt)
      const processedEvent = { ...evt, timeInfo } as ProcessedEvent

      // Check for short-stay accommodations (less than 24 hours)
      if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
        const checkInDate = new Date(evt.checkIn)
        const checkOutDate = new Date(evt.checkOut)
        const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

        if (durationHours < 24) {
          processedEvent.isShortStay = true
        }

        // Add checkout event to the checkout day if it's a different day
        if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
          const checkoutDayLabel = formatDateToYYYYMMDD(checkOutDate)

          if (checkoutDayLabel !== day.dayLabel) {
            let checkoutDay = daysMap.get(checkoutDayLabel)

            if (!checkoutDay) {
              // Create a new day if it doesn't exist
              checkoutDay = {
                dayLabel: checkoutDayLabel,
                dayDescription: "",
                events: [],
                originalIndex: -1, // Will be calculated later
              }
              daysMap.set(checkoutDayLabel, checkoutDay)
            }

            // Add checkout event to the checkout day
            checkoutDay.events.push({
              ...evt,
              isCheckoutEvent: true,
              timeInfo: {
                ...timeInfo,
                date: checkOutDate,
                timeStr: checkOutDate.toLocaleTimeString("lt-LT", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            } as ProcessedEvent)
          }
        }
      }

      // Handle multi-day transport/cruise events
      if ((evt.type === "transport" || evt.type === "cruise") && timeInfo.isMultiDay && timeInfo.arrivalTime) {
        const arrivalDate = new Date(timeInfo.arrivalTime)
        const arrivalDayLabel = formatDateToYYYYMMDD(arrivalDate)

        if (arrivalDayLabel !== day.dayLabel) {
          let arrivalDay = daysMap.get(arrivalDayLabel)

          if (!arrivalDay) {
            // Create a new day if it doesn't exist
            arrivalDay = {
              dayLabel: arrivalDayLabel,
              dayDescription: "",
              events: [],
              originalIndex: -1, // Will be calculated later
            }
            daysMap.set(arrivalDayLabel, arrivalDay)
          }

          // Add arrival event to the arrival day
          arrivalDay.events.push({
            ...evt,
            isArrivalEvent: true,
            timeInfo: {
              ...timeInfo,
              date: arrivalDate,
              timeStr: timeInfo.arrivalTimeStr,
            },
          } as ProcessedEvent)
        }
      }

      // Add the original event to its primary day
      currentDay.events.push(processedEvent)
    })
  })

  // Convert map to array and sort by date
  const sortedDays = Array.from(daysMap.values())
    .filter((day) => day.events.length > 0 || (day.dayDescription && day.dayDescription.trim() !== ""))
    .sort((a, b) => new Date(a.dayLabel).getTime() - new Date(b.dayLabel).getTime())

  // Calculate day numbers for days that don't have an originalIndex
  const startDate = new Date(sortedDays[0].dayLabel)
  sortedDays.forEach((day) => {
    if (day.originalIndex <= 0) {
      const currentDate = new Date(day.dayLabel)
      const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      day.originalIndex = dayNumber
    }
  })

  // Mark overlapping events for each day
  sortedDays.forEach((day) => {
    // Sort events by time
    day.events.sort((a, b) => {
      if (!a.timeInfo.date) return 1
      if (!b.timeInfo.date) return -1
      return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
    })

    // Check for overlapping events
    for (let i = 0; i < day.events.length; i++) {
      const event1 = day.events[i]
      if (!event1.timeInfo.date) continue

      const event1Time = event1.timeInfo.date.getTime()
      const event1End = event1.timeInfo.endDate ? new Date(event1.timeInfo.endDate).getTime() : event1Time + 3600000 // Default 1 hour duration

      for (let j = i + 1; j < day.events.length; j++) {
        const event2 = day.events[j]
        if (!event2.timeInfo.date) continue

        const event2Time = event2.timeInfo.date.getTime()
        const event2End = event2.timeInfo.endDate ? new Date(event2.timeInfo.endDate).getTime() : event2Time + 3600000 // Default 1 hour duration

        // Check if events have the same time or overlap
        if (event1Time === event2Time || (event1Time < event2End && event1End > event2Time)) {
          event1.isOverlapping = true
          event2.isOverlapping = true
        }
      }
    }
  })

  // Render the days with their original day numbers
  return (
    <>
      {sortedDays.map((day) => (
        <Paper key={day.dayLabel} elevation={1} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "primary.main", textAlign: "left" }}>
            Diena {day.originalIndex} ({day.dayLabel})
          </Typography>

          {day.dayDescription && (
            <Typography
              sx={{
                mb: 2,
                fontStyle: hideHighlighting ? "normal" : "italic",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                textAlign: "left",
              }}
            >
              {day.dayDescription}
            </Typography>
          )}

          <Divider sx={{ mb: 2 }} />

          {day.events.map((evt, idx) => (
            <PreviewEvent evt={evt} key={idx} warnings={warnings} hideHighlighting={hideHighlighting} />
          ))}
        </Paper>
      ))}
    </>
  )
}

export default MultiDayPreview
