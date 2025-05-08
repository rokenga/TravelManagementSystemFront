"use client"

import type React from "react"
import { Drawer, Box, Typography, List, ListItem, ListItemText } from "@mui/material"
import { CalendarMonth, Description } from "@mui/icons-material"
import { formatDayDate } from "../../../Utils/eventValidation"

interface Day {
  dayLabel: string
  dayDescription: string
  events: any[]
}

interface MobileDayDrawerProps {
  open: boolean
  onClose: () => void
  days: Day[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
}

const MobileDayDrawer: React.FC<MobileDayDrawerProps> = ({ open, onClose, days, selectedDayIndex, onSelectDay }) => {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": { width: "80%", maxWidth: 300 },
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6">Kelionės dienos</Typography>
      </Box>
      <List>
        {days.map((day, idx) => (
          <ListItem
            button
            key={idx}
            selected={selectedDayIndex === idx}
            onClick={() => {
              onSelectDay(idx)
              onClose()
            }}
          >
            <ListItemText
              primary={`Diena ${idx + 1}`}
              secondary={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarMonth fontSize="inherit" /> {formatDayDate(day.dayLabel)}
                  </Typography>
                  {day.events.length > 0 && (
                    <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Description fontSize="inherit" /> {day.events.length} įvykiai
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default MobileDayDrawer
