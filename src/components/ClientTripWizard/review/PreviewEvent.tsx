"use client"

import type React from "react"
import { Box, Typography, Divider, Grid, Chip } from "@mui/material"
import { formatEarliestTime, buildLine } from "../../../Utils/eventFormatting"
import {
  Hotel,
  Flight,
  DirectionsCar,
  DirectionsBus,
  Train,
  Sailing,
  LocalActivity,
  Image,
  EventNote,
} from "@mui/icons-material"
import type { TripEvent, ValidationWarning } from "../../../types"

interface ProcessedEvent extends TripEvent {
  timeInfo?: ReturnType<typeof formatEarliestTime> & { endDate?: Date | null }
  isArrivalEvent?: boolean
  isCheckoutEvent?: boolean
  isOverlapping?: boolean
  isShortStay?: boolean
  images?: Array<{ id?: string; url: string; isNew?: boolean; isExisting?: boolean }>
}

interface PreviewEventProps {
  evt: ProcessedEvent
  warnings?: ValidationWarning[]
  hideHighlighting?: boolean
}

const PreviewEvent: React.FC<PreviewEventProps> = ({ evt, warnings = [], hideHighlighting = false }) => {
  const timeInfo = evt.timeInfo || formatEarliestTime(evt)
  const mainLine = buildLine(evt)
  const desc = evt.description

  const shouldHighlight = !hideHighlighting && (evt.isOverlapping || evt.isShortStay)

  const getEventIcon = () => {
    switch (evt.type) {
      case "transport":
        switch (evt.transportType) {
          case "Flight":
            return <Flight fontSize="small" color="primary" />
          case "Train":
            return <Train fontSize="small" color="primary" />
          case "Bus":
            return <DirectionsBus fontSize="small" color="primary" />
          case "Car":
            return <DirectionsCar fontSize="small" color="primary" />
          case "Ferry":
            return <Sailing fontSize="small" color="primary" />
          default:
            return <DirectionsCar fontSize="small" color="primary" />
        }
      case "accommodation":
        return <Hotel fontSize="small" color="primary" />
      case "activity":
        return <LocalActivity fontSize="small" color="primary" />
      case "cruise":
        return <Sailing fontSize="small" color="primary" />
      case "images":
        return <Image fontSize="small" color="primary" />
      default:
        return <EventNote fontSize="small" color="primary" />
    }
  }

  const renderStarRating = (rating: number | string) => {
    const numRating = typeof rating === "number" ? rating : Number.parseInt(rating, 10)
    if (isNaN(numRating)) return null

    return "★".repeat(numRating)
  }

  const buildTransportDetailLine = (evt: any) => {
    const details = []

    if (evt.companyName) details.push(`Kompanija: ${evt.companyName}`)
    if (evt.transportName) details.push(`Transportas: ${evt.transportName}`)
    if (evt.transportCode) details.push(`Kodas: ${evt.transportCode}`)

    return details.length > 0 ? details.join(" | ") : null
  }

  const buildAccommodationDetailLine = (evt: any) => {
    const details = []

    if (evt.hotelName) details.push(`Viešbutis: ${evt.hotelName}`)
    if (evt.roomType) details.push(`Kambarys: ${evt.roomType}`)

    if (evt.starRating) {
      const stars = typeof evt.starRating === "number" ? evt.starRating : Number.parseInt(evt.starRating, 10)

      if (!isNaN(stars)) {
        details.push(`${renderStarRating(stars)}`)
      }
    }

    if (evt.boardBasis) {
      const boardBasisLabels: Record<string, string> = {
        BedAndBreakfast: "Pusryčiai įskaičiuoti",
        HalfBoard: "Pusryčiai ir vakarienė",
        FullBoard: "Pilnas maitinimas",
        AllInclusive: "Viskas įskaičiuota",
        UltraAllInclusive: "Ultra viskas įskaičiuota",
      }

      const boardBasisLabel = boardBasisLabels[evt.boardBasis] || evt.boardBasis
      details.push(`Maitinimas: ${boardBasisLabel}`)
    }

    if (evt.hotelLink) {
      details.push(`Nuoroda: ${evt.hotelLink}`)
    }

    return details.length > 0 ? details.join(" | ") : null
  }

  const buildCruiseDetailLine = (evt: any) => {
    const details = []

    if (evt.companyName) details.push(`Kompanija: ${evt.companyName}`)
    if (evt.transportName) details.push(`Laivas: ${evt.transportName}`)
    if (evt.cabinType) details.push(`Kajutė: ${evt.cabinType}`)
    if (evt.transportCode) details.push(`Kodas: ${evt.transportCode}`)

    return details.length > 0 ? details.join(" | ") : null
  }

  const commonBoxStyles = {
    mb: 2,
    pl: 2,
    borderLeft: shouldHighlight ? "4px solid" : "none",
    borderColor: "warning.main",
    bgcolor: shouldHighlight ? "rgba(255, 167, 38, 0.08)" : "transparent",
    borderRadius: "4px",
    py: shouldHighlight ? 1 : 0,
    transition: "all 0.2s ease-in-out",
  }

  const textStyles = {
    wordBreak: "break-word",
    overflowWrap: "break-word",
    textAlign: "left",
  }

  if (evt.type === "transport" || evt.type === "cruise") {
    const timeStr = evt.isArrivalEvent ? timeInfo.arrivalTimeStr : timeInfo.departureTimeStr
    const detailLine = evt.type === "transport" ? buildTransportDetailLine(evt) : buildCruiseDetailLine(evt)

    return (
      <Box sx={commonBoxStyles}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {getEventIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={textStyles}>
              <strong>{timeStr ? timeStr + ": " : ""}</strong>
              {evt.isArrivalEvent ? "Atvykimas: " : timeInfo.isMultiDay ? "Išvykimas: " : ""}
              {mainLine}
              {timeInfo.isMultiDay && !evt.isArrivalEvent && (
                <Chip
                  label="Kelių dienų kelionė"
                  size="small"
                  color="warning"
                  sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                />
              )}
            </Typography>

            {detailLine && (
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
                {detailLine}
              </Typography>
            )}

            {desc && (
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
                {desc}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  if (evt.type === "accommodation") {
    const checkInTime = evt.checkIn ? new Date(evt.checkIn) : null
    const checkOutTime = evt.checkOut ? new Date(evt.checkOut) : null
    const detailLine = buildAccommodationDetailLine(evt)

    const timeStr =
      evt.isCheckoutEvent && checkOutTime
        ? checkOutTime.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
        : checkInTime
          ? checkInTime.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
          : ""

    return (
      <Box sx={commonBoxStyles}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {getEventIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={textStyles}>
              <strong>{timeStr ? timeStr + ": " : ""}</strong>
              {evt.isCheckoutEvent
                ? `Išsiregistravimas iš ${(evt as any).hotelName || "viešbučio"}`
                : `Įsiregistravimas: ${(evt as any).hotelName || "viešbutis"}`}
              {evt.isShortStay && !evt.isCheckoutEvent && (
                <Chip
                  label="Trumpas apsistojimas"
                  size="small"
                  color="warning"
                  sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                />
              )}
            </Typography>

            {detailLine && !evt.isCheckoutEvent && (
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
                {detailLine}
              </Typography>
            )}

            {desc && (
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
                {desc}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  if (evt.type === "activity") {
    return (
      <Box sx={commonBoxStyles}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {getEventIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={textStyles}>
              <strong>{timeInfo.timeStr ? timeInfo.timeStr + ": " : ""}</strong>
              {mainLine}
            </Typography>
            {desc && (
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
                {desc}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  if (evt.type === "images") {
    const hasImages = evt.images && evt.images.length > 0

    return (
      <Box sx={commonBoxStyles}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {getEventIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={textStyles}>
              <strong>Nuotraukos</strong>
              {!hasImages && (
                <Typography component="span" color="text.secondary" sx={{ ml: 1, fontStyle: "italic" }}>
                  (Nėra pridėtų nuotraukų)
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>

        {hasImages && (
          <Box sx={{ mt: 2, ml: 4 }}>
            <Grid container spacing={1}>
              {evt.images.map((image, index) => (
                <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
                  <Box
                    sx={{
                      width: "100%",
                      height: 100,
                      borderRadius: 1,
                      overflow: "hidden",
                      position: "relative",
                      border: "1px solid #eee",
                    }}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Nuotrauka ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {desc && desc !== "Nuotraukos" && (
          <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 4, mt: 1 }}>
            {desc}
          </Typography>
        )}
        <Divider sx={{ mt: 1 }} />
      </Box>
    )
  }

  return (
    <Box sx={commonBoxStyles}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        {getEventIcon()}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" sx={textStyles}>
            <strong>{timeInfo.timeStr ? timeInfo.timeStr + ": " : ""}</strong>
            {mainLine}
          </Typography>
          {desc && evt.type !== "activity" && (
            <Typography variant="body2" color="text.secondary" sx={{ ...textStyles, ml: 0, mt: 0.5 }}>
              {desc}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ mt: 1 }} />
    </Box>
  )
}

export default PreviewEvent
