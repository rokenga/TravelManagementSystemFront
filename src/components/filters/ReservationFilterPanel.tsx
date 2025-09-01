"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Drawer,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { ReservationStatus } from "../../types/Reservation"
import { translateReservationStatus } from "../../Utils/translateEnums"

export interface ReservationFilters {
  statuses: ReservationStatus[]
}

interface ReservationFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: ReservationFilters) => void
  initialFilters: ReservationFilters
}

export const defaultReservationFilters: ReservationFilters = {
  statuses: [],
}

const ReservationFilterPanel: React.FC<ReservationFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [selectedStatuses, setSelectedStatuses] = useState<ReservationStatus[]>(initialFilters.statuses || [])

  useEffect(() => {
    setSelectedStatuses(initialFilters.statuses || [])
  }, [initialFilters])

  const handleStatusChange = (status: ReservationStatus) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handleApply = () => {
    onApplyFilters({
      statuses: selectedStatuses,
    })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedStatuses([])
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : "300px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Filtrai</Typography>
        <Button size="small" onClick={handleReset}>
          Išvalyti
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
        Rezervacijos būsena
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        {Object.values(ReservationStatus)
          .filter((value) => typeof value === "number")
          .map((status) => (
            <FormControlLabel
              key={status}
              control={
                <Checkbox
                  checked={selectedStatuses.includes(status as ReservationStatus)}
                  onChange={() => handleStatusChange(status as ReservationStatus)}
                />
              }
              label={translateReservationStatus(status as ReservationStatus)}
            />
          ))}
      </FormGroup>

      <Button variant="contained" color="primary" fullWidth onClick={handleApply}>
        Taikyti filtrus
      </Button>
    </Box>
  )

  return isMobile ? (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      {filterContent}
    </Drawer>
  ) : (
    <Paper elevation={2} sx={{ borderRadius: 2, maxHeight: "fit-content" }}>
      {filterContent}
    </Paper>
  )
}

export default ReservationFilterPanel