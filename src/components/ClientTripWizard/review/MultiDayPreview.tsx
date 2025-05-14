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

interface ProcessedEvent extends TripEvent {
  timeInfo: ReturnType<typeof formatEarliestTime>
  isArrivalEvent?: boolean
  isCheckoutEvent?: boolean
  isOverlapping?: boolean
  isShortStay?: boolean
}

interface ProcessedDay extends Omit<ItineraryDay, "events"> {
  events: ProcessedEvent[]
  originalIndex: number 
}

const MultiDayPreview: React.FC<MultiDayPreviewProps> = ({ days, warnings = [], hideHighlighting = false }) => {
  if (!days.length) {
    return (
      <Typography variant="body1" textAlign="center">
        Maršrutas dar nesudarytas.
      </Typography>
    )
  }

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const daysMap = new Map<string, ProcessedDay>()

  days.forEach((day) => {
    daysMap.set(day.dayLabel, {
      ...day,
      events: [],
      originalIndex: day.originalIndex || 0,
    })
  })

  days.forEach((day) => {
    const currentDay = daysMap.get(day.dayLabel)!

    day.events.forEach((evt) => {
      const timeInfo = formatEarliestTime(evt)
      const processedEvent = { ...evt, timeInfo } as ProcessedEvent

      if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
        const checkInDate = new Date(evt.checkIn)
        const checkOutDate = new Date(evt.checkOut)
        const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

        if (durationHours < 24) {
          processedEvent.isShortStay = true
        }

        if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
          const checkoutDayLabel = formatDateToYYYYMMDD(checkOutDate)

          if (checkoutDayLabel !== day.dayLabel) {
            let checkoutDay = daysMap.get(checkoutDayLabel)

            if (!checkoutDay) {
              checkoutDay = {
                dayLabel: checkoutDayLabel,
                dayDescription: "",
                events: [],
                originalIndex: -1,
              }
              daysMap.set(checkoutDayLabel, checkoutDay)
            }

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

      if ((evt.type === "transport" || evt.type === "cruise") && timeInfo.isMultiDay && timeInfo.arrivalTime) {
        const arrivalDate = new Date(timeInfo.arrivalTime)
        const arrivalDayLabel = formatDateToYYYYMMDD(arrivalDate)

        if (arrivalDayLabel !== day.dayLabel) {
          let arrivalDay = daysMap.get(arrivalDayLabel)

          if (!arrivalDay) {
            arrivalDay = {
              dayLabel: arrivalDayLabel,
              dayDescription: "",
              events: [],
              originalIndex: -1, 
            }
            daysMap.set(arrivalDayLabel, arrivalDay)
          }

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

      currentDay.events.push(processedEvent)
    })
  })

  const sortedDays = Array.from(daysMap.values())
    .filter((day) => day.events.length > 0 || (day.dayDescription && day.dayDescription.trim() !== ""))
    .sort((a, b) => new Date(a.dayLabel).getTime() - new Date(b.dayLabel).getTime())

  const startDate = new Date(sortedDays[0].dayLabel)
  sortedDays.forEach((day) => {
    if (day.originalIndex <= 0) {
      const currentDate = new Date(day.dayLabel)
      const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      day.originalIndex = dayNumber
    }
  })

  sortedDays.forEach((day) => {
    day.events.sort((a, b) => {
      if (!a.timeInfo.date) return 1
      if (!b.timeInfo.date) return -1
      return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
    })

    for (let i = 0; i < day.events.length; i++) {
      const event1 = day.events[i]
      if (!event1.timeInfo.date) continue

      const event1Time = event1.timeInfo.date.getTime()
      const event1End = event1.timeInfo.endDate ? new Date(event1.timeInfo.endDate).getTime() : event1Time + 3600000 

      for (let j = i + 1; j < day.events.length; j++) {
        const event2 = day.events[j]
        if (!event2.timeInfo.date) continue

        const event2Time = event2.timeInfo.date.getTime()
        const event2End = event2.timeInfo.endDate ? new Date(event2.timeInfo.endDate).getTime() : event2Time + 3600000 

        if (event1Time === event2Time || (event1Time < event2End && event1End > event2Time)) {
          event1.isOverlapping = true
          event2.isOverlapping = true
        }
      }
    }
  })

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
