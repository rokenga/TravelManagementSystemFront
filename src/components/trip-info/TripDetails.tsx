"use client"

import type React from "react"
import { Grid, TextField, MenuItem, FormControlLabel, Checkbox, InputAdornment } from "@mui/material"

interface TripDetailsProps {
  category: string
  price: number | string
  adultsCount: number | null
  childrenCount: number | null
  insuranceTaken: boolean
  onInputChange: (name: string, value: any) => void
}

const TripDetails: React.FC<TripDetailsProps> = ({
  category,
  price,
  adultsCount,
  childrenCount,
  insuranceTaken,
  onInputChange,
}) => {
  return (
    <>
      <Grid item xs={12} md={6}>
        <TextField
          select
          label="Kelionės kategorija"
          value={category}
          onChange={(e) => onInputChange("category", e.target.value)}
          fullWidth
        >
          <MenuItem value="">--Nepasirinkta--</MenuItem>
          <MenuItem value="Tourist">Turistinė</MenuItem>
          <MenuItem value="Group">Grupinė</MenuItem>
          <MenuItem value="Relax">Poilsinė</MenuItem>
          <MenuItem value="Business">Verslo</MenuItem>
          <MenuItem value="Cruise">Kruizas</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Kaina"
          type="number"
          value={price}
          onChange={(e) => onInputChange("price", e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">€</InputAdornment>,
          }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Suaugusių skaičius"
          type="number"
          value={adultsCount}
          onChange={(e) => onInputChange("adultsCount", Number(e.target.value))}
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Vaikų skaičius"
          type="number"
          value={childrenCount}
          onChange={(e) => onInputChange("childrenCount", Number(e.target.value))}
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox checked={insuranceTaken} onChange={(e) => onInputChange("insuranceTaken", e.target.checked)} />
          }
          label="Ar reikalingas draudimas?"
        />
      </Grid>
    </>
  )
}

export default TripDetails

