"use client"

import type React from "react"
import { Box, Typography } from "@mui/material"
import PreviewEvent from "./PreviewEvent"
import { formatEarliestTime } from "../../../Utils/eventFormatting"
import type { ItineraryDay, TripEvent, ValidationWarning } from "../../../types"

interface SingleDayPreviewProps {
  day: ItineraryDay
  warnings?: ValidationWarning[]
  hideHighlighting?: boolean
}

const SingleDayPreview: React.FC<SingleDayPreviewProps> = ({ day, warnings = [], hideHighlighting = false }) => {
  if (!day) {
    return (
      <Typography variant="body1" textAlign="left">
        Planas dar nesudarytas.
      </Typography>
    )
  }

  if (day.events.length === 0) {
    if (day.dayDescription) {
      return (
        <Box>
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
        </Box>
      )
    }
    return (
      <Typography variant="body1" textAlign="left">
        Planas dar nesudarytas.
      </Typography>
    )
  }

  const processedEvents = day.events.flatMap((evt: TripEvent) => {
    const timeInfo = formatEarliestTime(evt)
    const processedEvent = { ...evt, timeInfo }

    if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
      const checkInDate = new Date(evt.checkIn)
      const checkOutDate = new Date(evt.checkOut)
      const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

      if (durationHours < 24) {
        processedEvent.isShortStay = true
      }

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

  const sortedEvents = processedEvents.sort(
    (a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
      if (!a.timeInfo.date) return 1
      if (!b.timeInfo.date) return -1
      return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
    },
  )

  const eventsWithOverlapping = [...sortedEvents]

  for (let i = 0; i < eventsWithOverlapping.length; i++) {
    const event1 = eventsWithOverlapping[i]
    if (!event1.timeInfo.date) continue

    const event1Time = event1.timeInfo.date.getTime()
    const event1End = event1.timeInfo.endDate ? new Date(event1.timeInfo.endDate).getTime() : event1Time + 3600000 

    for (let j = i + 1; j < eventsWithOverlapping.length; j++) {
      const event2 = eventsWithOverlapping[j]
      if (!event2.timeInfo.date) continue

      const event2Time = event2.timeInfo.date.getTime()
      const event2End = event2.timeInfo.endDate ? new Date(event2.timeInfo.endDate).getTime() : event2Time + 3600000 

      if (event1Time === event2Time || (event1Time < event2End && event1End > event2Time)) {
        event1.isOverlapping = true
        event2.isOverlapping = true
      }
    }
  }

  const eventsByDate = eventsWithOverlapping.reduce((acc: any, evt: any) => {
    const dateStr = evt.timeInfo.date ? evt.timeInfo.date.toLocaleDateString("lt-LT") : "noDate"
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(evt)
    return acc
  }, {})

  return (
    <>
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

      {Object.entries(eventsByDate).map(([dateStr, events]: [string, any]) => (
        <Box key={dateStr} sx={{ mb: 3 }}>
          {dateStr !== "noDate" && (
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "primary.main", textAlign: "left" }}>
              {dateStr}
            </Typography>
          )}

          {events.map((evt: any, idx: number) => (
            <PreviewEvent evt={evt} key={idx} warnings={warnings} hideHighlighting={hideHighlighting} />
          ))}
        </Box>
      ))}
    </>
  )
}

export default SingleDayPreview
