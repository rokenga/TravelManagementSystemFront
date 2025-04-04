"use client"

import type React from "react"
import { Card, CardContent, Typography, TextField } from "@mui/material"
import { Description } from "@mui/icons-material"

interface DayDescriptionProps {
  description: string
  isDayByDay: boolean
  onChange: (value: string) => void
}

const DayDescription: React.FC<DayDescriptionProps> = ({ description, isDayByDay, onChange }) => {
  return (
    <Card variant="outlined" sx={{ mb: 4, bgcolor: "background.default" }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Description />
          {isDayByDay ? "Dienos aprašymas" : "Kelionės aprašymas"}
        </Typography>
        <TextField
          value={description || ""}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          size="small"
          multiline
          rows={3}
          placeholder={
            isDayByDay
              ? "Aprašykite šios dienos planus ir pastabas..."
              : "Aprašykite bendrą kelionės maršrutą ir svarbią informaciją..."
          }
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  )
}

export default DayDescription

