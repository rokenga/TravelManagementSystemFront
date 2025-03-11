"use client"

import type React from "react"
import { Box, Typography } from "@mui/material"
import PreviewEvent from "./PreviewEvent"
import { formatEarliestTime } from "../../Utils/eventFormatting"
import type { ItineraryDay, TripEvent } from "../../types"

interface MultiDayPreviewProps {
  days: ItineraryDay[]
}

const MultiDayPreview: React.FC<MultiDayPreviewProps> = ({ days }) => {
  if (!days.length) {
    return (
      <Typography variant="body1" textAlign="center">
        Maršrutas dar nesudarytas.
      </Typography>
    )
  }

  // Create a map of all days in the itinerary
  const allDaysMap = new Map(days.map((day) => [day.dayLabel, { ...day, events: [] }]))

  // Process each day to sort events by time and handle multi-day events
  days.forEach((day) => {
    const processedDay = allDaysMap.get(day.dayLabel)!

    // Process events to get time information
    processedDay.events = day.events.map((evt: TripEvent) => {
      const timeInfo = formatEarliestTime(evt)
      return {
        ...evt,
        timeInfo,
      }
    })

    // Sort events by time
    processedDay.events.sort(
      (a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
        if (!a.timeInfo.date) return 1
        if (!b.timeInfo.date) return -1
        return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
      },
    )
  })

  // Handle multi-day events by adding arrival/checkout events to the appropriate days
  allDaysMap.forEach((day, dayLabel) => {
    day.events.forEach(
      (evt: {
        type: string
        timeInfo: { isMultiDay: any; arrivalTime: any; arrivalTimeStr: any }
        checkIn: string | number | Date
        checkOut: string | number | Date
      }) => {
        if (
          (evt.type === "transport" || evt.type === "cruise") &&
          evt.timeInfo.isMultiDay &&
          evt.timeInfo.arrivalTime
        ) {
          // Find the day that corresponds to the arrival date
          const arrivalDate = new Date(evt.timeInfo.arrivalTime)
          // Format the date as YYYY-MM-DD to match dayLabel format
          const arrivalDayLabel = arrivalDate.toISOString().split("T")[0]

          if (arrivalDayLabel !== dayLabel) {
            let arrivalDay = allDaysMap.get(arrivalDayLabel)
            if (!arrivalDay) {
              // Create a new day if it doesn't exist
              arrivalDay = {
                dayLabel: arrivalDayLabel,
                events: [],
                originalIndex: -1,
                dayDescription: "",
              }
              allDaysMap.set(arrivalDayLabel, arrivalDay)
            }
            // Add arrival event to target day
            arrivalDay.events.push({
              ...evt,
              isArrivalEvent: true,
              timeInfo: {
                ...evt.timeInfo,
                date: arrivalDate,
                timeStr: evt.timeInfo.arrivalTimeStr,
              },
            })
          }
        } else if (evt.type === "accommodation" && evt.checkIn && evt.checkOut) {
          const checkInDate = new Date(evt.checkIn)
          const checkOutDate = new Date(evt.checkOut)

          if (checkInDate.toDateString() !== checkOutDate.toDateString()) {
            const checkoutDayLabel = checkOutDate.toISOString().split("T")[0]

            if (checkoutDayLabel !== dayLabel) {
              let checkoutDay = allDaysMap.get(checkoutDayLabel)
              if (!checkoutDay) {
                // Create a new day if it doesn't exist
                checkoutDay = {
                  dayLabel: checkoutDayLabel,
                  events: [],
                  originalIndex: -1,
                  dayDescription: "",
                }
                allDaysMap.set(checkoutDayLabel, checkoutDay)
              }
              // Add checkout event to target day
              checkoutDay.events.push({
                ...evt,
                isCheckoutEvent: true,
                timeInfo: {
                  ...evt.timeInfo,
                  date: checkOutDate,
                  timeStr: checkOutDate.toLocaleTimeString("lt-LT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              })
            }
          }
        }
      },
    )
  })

  // Convert map to array, sort by date, and calculate correct day numbers
  const sortedDays = Array.from(allDaysMap.values())
    .filter((day) => day.events.length > 0 || day.dayDescription)
    .sort((a, b) => new Date(a.dayLabel).getTime() - new Date(b.dayLabel).getTime())

  // Calculate day numbers based on chronological order
  const startDate = new Date(sortedDays[0].dayLabel)
  const finalDays = sortedDays.map((day) => {
    const currentDate = new Date(day.dayLabel)
    const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return {
      ...day,
      calculatedDayNumber: dayNumber,
    }
  })

  // Final sort of events within each day
  finalDays.forEach((day) => {
    day.events.sort(
      (a: { timeInfo: { date: { getTime: () => number } } }, b: { timeInfo: { date: { getTime: () => number } } }) => {
        if (!a.timeInfo.date) return 1
        if (!b.timeInfo.date) return -1
        return a.timeInfo.date.getTime() - b.timeInfo.date.getTime()
      },
    )
  })

  return (
    <>
      {finalDays.map((day) => (
        <Box key={day.dayLabel} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "primary.main" }}>
            Diena {day.calculatedDayNumber} ({day.dayLabel})
          </Typography>
          {day.dayDescription && <Typography sx={{ mb: 2, fontStyle: "italic" }}>{day.dayDescription}</Typography>}
          {day.events.map((evt: any, idx: number) => (
            <PreviewEvent evt={evt} key={idx} />
          ))}
        </Box>
      ))}
    </>
  )
}

export default MultiDayPreview

