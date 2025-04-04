"use client"

import React from "react"
import { Grid, TextField, MenuItem, Box, useTheme, FormControl, InputLabel, Select } from "@mui/material"
import dayjs, { type Dayjs } from "dayjs"
import {
  Flight,
  DirectionsBus,
  Train,
  DirectionsCar,
  Sailing,
  Link,
  FlightTakeoff,
  FlightLand,
  LocationOn,
} from "@mui/icons-material"
import CustomDateTimePicker from "../CustomDatePicker"

interface EventCardProps {
  event: any
  onChange: (field: string, value: any) => void
  dayByDay: boolean
  dayDate: string
  tripStart: Dayjs
  tripEnd: Dayjs
  stepImages?: File[]
  onImageChange?: (files: File[]) => void
}

// Enums
enum TransportType {
  Flight = "Flight",
  Train = "Train",
  Bus = "Bus",
  Car = "Car",
  Ferry = "Ferry",
}

enum BoardBasisType {
  BedAndBreakfast = "BedAndBreakfast",
  HalfBoard = "HalfBoard",
  FullBoard = "FullBoard",
  AllInclusive = "AllInclusive",
  UltraAllInclusive = "UltraAllInclusive",
}

// Mapping for display names
const boardBasisLabels: Record<BoardBasisType, string> = {
  [BoardBasisType.BedAndBreakfast]: "Pusryčiai įskaičiuoti",
  [BoardBasisType.HalfBoard]: "Pusryčiai ir vakarienė",
  [BoardBasisType.FullBoard]: "Pilnas maitinimas",
  [BoardBasisType.AllInclusive]: "Viskas įskaičiuota",
  [BoardBasisType.UltraAllInclusive]: "Ultra viskas įskaičiuota",
}

const transportTypes = [
  { value: TransportType.Flight, label: "Skrydis", icon: <Flight fontSize="small" /> },
  { value: TransportType.Train, label: "Traukinys", icon: <Train fontSize="small" /> },
  { value: TransportType.Bus, label: "Autobusas", icon: <DirectionsBus fontSize="small" /> },
  { value: TransportType.Car, label: "Automobilis", icon: <DirectionsCar fontSize="small" /> },
  { value: TransportType.Ferry, label: "Keltas", icon: <Sailing fontSize="small" /> },
]

// This component enforces that the datetime is within the day range for day-by-day mode
// and within the overall trip bounds
const LockedDateTimePicker: React.FC<{
  field: string
  label: string
  value: string
  dayByDay: boolean
  dayDate: string
  tripStart: Dayjs
  tripEnd: Dayjs
  onChangeField: (field: string, newVal: string) => void
}> = ({ field, label, value, dayByDay, dayDate, tripStart, tripEnd, onChangeField }) => {
  const parseVal = (v: string) => (v ? dayjs(v) : null)
  const currentValue = parseVal(value)

  // Calculate min and max date constraints
  let minDate = tripStart.startOf("day")
  // Use end of day for the trip end to include the full last day
  let maxDate = tripEnd.endOf("day")

  // If in day-by-day mode, restrict to the specific day
  if (dayByDay && dayDate) {
    const dayStart = dayjs(dayDate).startOf("day")
    const dayEnd = dayjs(dayDate).endOf("day")

    // Only restrict to the day if it's within the trip range
    if (dayStart.isAfter(tripStart) || dayStart.isSame(tripStart, "day")) {
      minDate = dayStart
    }

    if (dayEnd.isBefore(tripEnd) || dayEnd.isSame(tripEnd, "day")) {
      maxDate = dayEnd
    }
  }

  const handleChange = (newVal: Dayjs | null) => {
    onChangeField(field, newVal ? newVal.format("YYYY-MM-DD HH:mm") : "")
  }

  return (
    <CustomDateTimePicker
      label={label}
      value={currentValue}
      onChange={handleChange}
      showTime={true}
      minDate={minDate}
      maxDate={maxDate}
    />
  )
}

// This picker allows dates within the trip range, but not limited to a specific day
const FreeDateTimePicker: React.FC<{
  field: string
  label: string
  value: string
  tripStart: Dayjs
  tripEnd: Dayjs
  onChangeField: (field: string, newVal: string) => void
  minDate?: Dayjs | null // Optional override for minimum date
}> = ({ field, label, value, tripStart, tripEnd, onChangeField, minDate }) => {
  const parseVal = (v: string) => (v ? dayjs(v) : null)
  const currentValue = parseVal(value)

  // Use either the provided minDate or the trip start
  const effectiveMinDate = minDate || tripStart

  const handleChange = (newVal: Dayjs | null) => {
    onChangeField(field, newVal ? newVal.format("YYYY-MM-DD HH:mm") : "")
  }

  return (
    <CustomDateTimePicker
      label={label}
      value={currentValue}
      onChange={handleChange}
      showTime={true}
      minDate={effectiveMinDate}
      // Use end of day for the trip end to include the full last day
      maxDate={tripEnd.endOf("day")}
    />
  )
}

// Helper function to get transport type icon
const getTransportTypeIcon = (type: string) => {
  switch (type) {
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
}

// Helper function to get departure/arrival icons
const getDepartureIcon = (type: string, isArrival = false) => {
  switch (type) {
    case "Flight":
      return isArrival ? (
        <FlightLand fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
      ) : (
        <FlightTakeoff fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
      )
    default:
      return <LocationOn fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
  }
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onChange,
  dayByDay,
  dayDate,
  tripStart,
  tripEnd,
  stepImages = [],
  onImageChange,
}) => {
  const theme = useTheme()

  // For a "transport" event
  if (event.type === "transport") {
    // Calculate departure time as dayjs object for use as min date
    const departureTime = event.departureTime ? dayjs(event.departureTime) : null

    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transporto tipas</InputLabel>
                  <Select
                    value={event.transportType || ""}
                    onChange={(e) => onChange("transportType", e.target.value)}
                    label="Transporto tipas"
                  >
                    {transportTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {React.cloneElement(t.icon, { color: "primary" })}
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kompanijos pavadinimas"
                  value={event.companyName || ""}
                  onChange={(e) => onChange("companyName", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Transporto pavadinimas"
                  value={event.transportName || ""}
                  onChange={(e) => onChange("transportName", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Transporto kodas"
                  value={event.transportCode || ""}
                  onChange={(e) => onChange("transportCode", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Išvykimo vieta"
                  value={event.departurePlace || ""}
                  onChange={(e) => onChange("departurePlace", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: getDepartureIcon(event.transportType || ""),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Atvykimo vieta"
                  value={event.arrivalPlace || ""}
                  onChange={(e) => onChange("arrivalPlace", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: getDepartureIcon(event.transportType || "", true),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LockedDateTimePicker
                  field="departureTime"
                  label="Išvykimo laikas"
                  value={event.departureTime || ""}
                  dayByDay={dayByDay}
                  dayDate={dayDate}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FreeDateTimePicker
                  field="arrivalTime"
                  label="Atvykimo laikas"
                  value={event.arrivalTime || ""}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                  minDate={departureTime}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Papildomas aprašymas"
              value={event.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Box>
    )
  }

  // For an "accommodation" event
  if (event.type === "accommodation") {
    // Calculate check-in time as dayjs object for use as min date for checkout
    const checkInTime = event.checkIn ? dayjs(event.checkIn) : null

    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Viešbučio pavadinimas"
                  value={event.hotelName || ""}
                  onChange={(e) => onChange("hotelName", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Viešbučio nuoroda"
                  value={event.hotelLink || ""}
                  onChange={(e) => onChange("hotelLink", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: event.hotelLink ? <Link fontSize="small" color="action" sx={{ mr: 1 }} /> : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Maitinimo tipas</InputLabel>
                  <Select
                    value={event.boardBasis || ""}
                    onChange={(e) => onChange("boardBasis", e.target.value)}
                    label="Maitinimo tipas"
                  >
                    <MenuItem value="">--Nepasirinkta--</MenuItem>
                    {Object.entries(boardBasisLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kambario tipas"
                  value={event.roomType || ""}
                  onChange={(e) => onChange("roomType", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LockedDateTimePicker
                  field="checkIn"
                  label="Įsiregistravimo laikas"
                  value={event.checkIn || ""}
                  dayByDay={dayByDay}
                  dayDate={dayDate}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FreeDateTimePicker
                  field="checkOut"
                  label="Išsiregistravimo laikas"
                  value={event.checkOut || ""}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                  minDate={checkInTime?.add(1, "hour")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Papildomas aprašymas"
                  value={event.description || ""}
                  onChange={(e) => onChange("description", e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    )
  }

  // For an "activity" event
  if (event.type === "activity") {
    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <LockedDateTimePicker
              field="activityTime"
              label="Veiklos laikas"
              value={event.activityTime || ""}
              dayByDay={dayByDay}
              dayDate={dayDate}
              tripStart={tripStart}
              tripEnd={tripEnd}
              onChangeField={onChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Veiklos aprašymas"
              value={event.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Box>
    )
  }

  // For a "cruise" event - updated with same fields as transport plus cabinType
  if (event.type === "cruise") {
    // Calculate departure time as dayjs object for use as min date
    const departureTime = event.departureTime ? dayjs(event.departureTime) : null

    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kruizo kompanija"
                  value={event.companyName || ""}
                  onChange={(e) => onChange("companyName", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kruizo kodas"
                  value={event.transportCode || ""}
                  onChange={(e) => onChange("transportCode", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Laivo pavadinimas"
                  value={event.transportName || ""}
                  onChange={(e) => onChange("transportName", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kajutės tipas"
                  value={event.cabinType || ""}
                  onChange={(e) => onChange("cabinType", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Išvykimo uostas"
                  value={event.departurePlace || ""}
                  onChange={(e) => onChange("departurePlace", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <LocationOn fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Atvykimo uostas"
                  value={event.arrivalPlace || ""}
                  onChange={(e) => onChange("arrivalPlace", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <LocationOn fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LockedDateTimePicker
                  field="departureTime"
                  label="Išvykimo laikas"
                  value={event.departureTime || ""}
                  dayByDay={dayByDay}
                  dayDate={dayDate}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FreeDateTimePicker
                  field="arrivalTime"
                  label="Atvykimo laikas"
                  value={event.arrivalTime || ""}
                  tripStart={tripStart}
                  tripEnd={tripEnd}
                  onChangeField={onChange}
                  minDate={departureTime}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Papildomas aprašymas"
              value={event.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Box>
    )
  }

  return null
}

export default EventCard

