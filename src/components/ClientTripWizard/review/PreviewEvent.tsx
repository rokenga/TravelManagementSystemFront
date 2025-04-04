"use client"

import type React from "react"
import { Box, Typography, Divider } from "@mui/material"
import { formatEarliestTime, buildLine } from "../../../Utils/eventFormatting"
import type { TripEvent, ValidationWarning } from "../../../types"

interface PreviewEventProps {
  evt: TripEvent & {
    timeInfo?: any
    isArrivalEvent?: boolean
    isCheckoutEvent?: boolean
    isOverlapping?: boolean
    isShortStay?: boolean
  }
  warnings?: ValidationWarning[]
  hideHighlighting?: boolean
}

const PreviewEvent: React.FC<PreviewEventProps> = ({ evt, warnings = [], hideHighlighting = false }) => {
  const timeInfo = evt.timeInfo || formatEarliestTime(evt)
  const mainLine = buildLine(evt)
  const desc = evt.description

  // Check if this event should be highlighted
  const shouldHighlight = !hideHighlighting && (evt.isOverlapping || evt.isShortStay)

  // For transport or cruise events
  if (evt.type === "transport" || evt.type === "cruise") {
    const timeStr = evt.isArrivalEvent ? timeInfo.arrivalTimeStr : timeInfo.departureTimeStr

    return (
      <Box
        sx={{
          mb: 2,
          pl: 2,
          borderLeft: shouldHighlight ? "4px solid" : "none",
          borderColor: "warning.main",
          bgcolor: shouldHighlight ? "rgba(255, 167, 38, 0.08)" : "transparent",
          borderRadius: "4px",
          py: shouldHighlight ? 1 : 0,
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1">
            <strong>{timeStr ? timeStr + ": " : ""}</strong>
            {evt.isArrivalEvent ? "Atvykimas: " : timeInfo.isMultiDay ? "Išvykimas: " : ""}
            {mainLine}
            {timeInfo.isMultiDay && !evt.isArrivalEvent && (
              <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                (Kelių dienų kelionė)
              </Typography>
            )}
          </Typography>
        </Box>
        {desc && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            {desc}
          </Typography>
        )}
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  // For accommodation events
  if (evt.type === "accommodation") {
    const timeStr = evt.isCheckoutEvent
      ? new Date(evt.checkOut).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
      : new Date(evt.checkIn).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })

    return (
      <Box
        sx={{
          mb: 2,
          pl: 2,
          borderLeft: shouldHighlight ? "4px solid" : "none",
          borderColor: "warning.main",
          bgcolor: shouldHighlight ? "rgba(255, 167, 38, 0.08)" : "transparent",
          borderRadius: "4px",
          py: shouldHighlight ? 1 : 0,
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1">
            <strong>{timeStr ? timeStr + ": " : ""}</strong>
            {evt.isCheckoutEvent
              ? `Išsiregistravimas iš ${evt.hotelName || "viešbučio"}`
              : `Įsiregistravimas: ${evt.hotelName || "viešbutis"}`}
            {evt.isShortStay && !evt.isCheckoutEvent && (
              <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                (Trumpas apsistojimas)
              </Typography>
            )}
          </Typography>
        </Box>
        {desc && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            {desc}
          </Typography>
        )}
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  // For activity events
  if (evt.type === "activity") {
    return (
      <Box
        sx={{
          mb: 2,
          pl: 2,
          borderLeft: shouldHighlight ? "4px solid" : "none",
          borderColor: "warning.main",
          bgcolor: shouldHighlight ? "rgba(255, 167, 38, 0.08)" : "transparent",
          borderRadius: "4px",
          py: shouldHighlight ? 1 : 0,
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body1">
            <strong>{timeInfo.timeStr ? timeInfo.timeStr + ": " : ""}</strong>
            {mainLine}
          </Typography>
        </Box>
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  // For other event types
  return (
    <Box
      sx={{
        mb: 2,
        pl: 2,
        borderLeft: shouldHighlight ? "4px solid" : "none",
        borderColor: "warning.main",
        bgcolor: shouldHighlight ? "rgba(255, 167, 38, 0.08)" : "transparent",
        borderRadius: "4px",
        py: shouldHighlight ? 1 : 0,
        transition: "all 0.2s ease-in-out",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1">
          <strong>{timeInfo.timeStr ? timeInfo.timeStr + ": " : ""}</strong>
          {mainLine}
        </Typography>
      </Box>
      {desc && evt.type !== "activity" && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {desc}
        </Typography>
      )}
      <Divider sx={{ mt: 1 }} />
    </Box>
  )
}

export default PreviewEvent

