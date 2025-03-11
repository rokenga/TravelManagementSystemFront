"use client"

import type React from "react"
import { Paper, Box, Button, Tooltip, IconButton, Chip } from "@mui/material"
import { Menu, ArrowBack, ArrowForward, CalendarMonth } from "@mui/icons-material"
import { formatDayDate } from "../../Utils/eventValidation"

interface MobileDaySelectorProps {
  selectedDayIndex: number
  totalDays: number
  currentDayLabel: string
  onOpenDrawer: () => void
  onPreviousDay: () => void
  onNextDay: () => void
}

const MobileDaySelector: React.FC<MobileDaySelectorProps> = ({
  selectedDayIndex,
  totalDays,
  currentDayLabel,
  onOpenDrawer,
  onPreviousDay,
  onNextDay,
}) => {
  return (
    <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button startIcon={<Menu />} onClick={onOpenDrawer} variant="outlined" size="medium">
          Diena {selectedDayIndex + 1}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Ankstesnė diena">
            <span>
              <IconButton onClick={onPreviousDay} disabled={selectedDayIndex === 0} size="small" color="primary">
                <ArrowBack />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Kita diena">
            <span>
              <IconButton
                onClick={onNextDay}
                disabled={selectedDayIndex === totalDays - 1}
                size="small"
                color="primary"
              >
                <ArrowForward />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Chip label={formatDayDate(currentDayLabel)} size="small" icon={<CalendarMonth />} sx={{ mt: 1 }} />
    </Paper>
  )
}

export default MobileDaySelector

