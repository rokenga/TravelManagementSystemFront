"use client"

import type React from "react"
import { Box, Typography } from "@mui/material"
import PreviewEvent from "./PreviewEvent"
import { formatEarliestTime } from "../../Utils/eventFormatting"
import type { ItineraryDay, TripEvent } from "../../types"

interface SingleDayPreviewProps {
  day: ItineraryDay
}

const SingleDayPreview: React.FC<SingleDayPreviewProps> = ({ day }) => {
  if (!day) {
    return (
      <Typography variant="body1" textAlign="center">
        Planas dar nesudarytas.
      </Typography>
    )
  }

  // Show description even if there are no events
  if (day.events.length === 0) {
    if (day.dayDescription) {
      return (
        <Box>
          <Typography sx={{ mb: 2, fontStyle: "italic" }}>{day.dayDescription}</Typography>
        </Box>
      )
    }
    return (
      <Typography variant="body1" textAlign="center">
        Planas dar nesudarytas.
      </Typography>
    )
  }

  // Process events to get time information and create check-out events
  const processedEvents = day.events.flatMap((evt: TripEvent) => {
    const timeInfo = formatEarliestTime(evt)
    const processedEvent = { ...evt, timeInfo }

    if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
      const checkInDate = new Date(evt.checkIn)
      const checkOutDate = new Date(evt.checkOut)

      if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
        return [
          processedEvent,
          {
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
          },
        ]
      }
    } else if ((evt.type === "transport" || evt.type === "cruise") && timeInfo.isMultiDay && timeInfo.arrivalTime) {
      // Add arrival event for multi-day transport or cruise
      return [
        processedEvent,
        {
          ...evt,
          isArrivalEvent: true,
          timeInfo: {
            ...timeInfo,
            date: timeInfo.arrivalTime,
            timeStr: timeInfo.arrivalTimeStr,
          },
        },
      ]
    }

    return [processedEvent]
  })

  // Sort events by time
  const sortedEvents = processedEvents.sort(
    (a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
      if (!a.timeInfo.date) return 1
      if (!b.timeInfo.date) return -1
      return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
    },
  )

  // Group events by date
  const eventsByDate = sortedEvents.reduce((acc: any, evt: any) => {
    const dateStr = evt.timeInfo.date ? evt.timeInfo.date.toLocaleDateString("lt-LT") : "noDate"
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(evt)
    return acc
  }, {})

  return (
    <>
      {day.dayDescription && <Typography sx={{ mb: 2, fontStyle: "italic" }}>{day.dayDescription}</Typography>}

      {Object.entries(eventsByDate).map(([dateStr, events]: [string, any]) => (
        <Box key={dateStr} sx={{ mb: 3 }}>
          {dateStr !== "noDate" && (
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}>
              {dateStr}
            </Typography>
          )}

          {events.map((evt: any, idx: number) => (
            <PreviewEvent evt={evt} key={idx} />
          ))}
        </Box>
      ))}
    </>
  )
}

export default SingleDayPreview

