"use client"

import type React from "react"
import { Grid, Paper, Typography, FormControlLabel, Checkbox, Collapse, Box, TextField } from "@mui/material"

interface ItineraryOptionsProps {
  isMultipleDays: boolean
  dayByDayItineraryNeeded: boolean
  itineraryTitle: string
  itineraryDescription: string
  onDayByDayChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInputChange: (name: string, value: any) => void
}

const ItineraryOptions: React.FC<ItineraryOptionsProps> = ({
  isMultipleDays,
  dayByDayItineraryNeeded,
  itineraryTitle,
  itineraryDescription,
  onDayByDayChange,
  onInputChange,
}) => {
  if (!isMultipleDays) return null

  return (
    <Grid item xs={12}>
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Kelionės plano informacija
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={dayByDayItineraryNeeded} onChange={onDayByDayChange} />}
          label="Ar reikalingas kasdienis planas?"
        />
        <Collapse in={dayByDayItineraryNeeded}>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Plano pavadinimas"
              value={itineraryTitle}
              onChange={(e) => onInputChange("itineraryTitle", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Plano aprašymas"
              value={itineraryDescription}
              onChange={(e) => onInputChange("itineraryDescription", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </Collapse>
      </Paper>
    </Grid>
  )
}

export default ItineraryOptions
