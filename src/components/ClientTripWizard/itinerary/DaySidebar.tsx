"use client"

import type React from "react"
import { List, ListItem, ListItemText, Paper, Typography, useTheme, Box } from "@mui/material"
import { CalendarMonth, Description } from "@mui/icons-material"
import { formatDayDate } from "../../../Utils/eventValidation"

interface Day {
  dayLabel: string
  dayDescription: string
  events: any[]
}

interface DaySidebarProps {
  days: Day[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
  sidebarWidth: number
}

const DaySidebar: React.FC<DaySidebarProps> = ({ days, selectedDayIndex, onSelectDay, sidebarWidth }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={3}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        display: { xs: "none", md: "block" },
        borderRadius: 1,
        overflow: "hidden",
        height: "max-content",
        position: "sticky",
        top: 24,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          textAlign: "center",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fontWeight: "medium",
        }}
      >
        Kelionės dienos
      </Typography>
      <List sx={{ p: 0 }}>
        {days.map((day, idx) => (
          <ListItem
            button
            key={idx}
            selected={selectedDayIndex === idx}
            onClick={() => onSelectDay(idx)}
            sx={{
              py: 2,
              borderLeft:
                selectedDayIndex === idx ? `4px solid ${theme.palette.primary.main}` : "4px solid transparent",
              "&.Mui-selected": {
                backgroundColor: theme.palette.action.selected,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              },
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
              primaryTypographyProps={{
                fontSize: "1rem",
                fontWeight: selectedDayIndex === idx ? "bold" : "medium",
              }}
              secondaryTypographyProps={{
                fontSize: "0.875rem",
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default DaySidebar
