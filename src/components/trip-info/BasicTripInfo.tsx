"use client"

import type React from "react"
import { Grid, TextField, InputAdornment, Typography, Autocomplete } from "@mui/material"
import { Person } from "@mui/icons-material"
import type { Client } from "../../types/Client"

interface BasicTripInfoProps {
  tripName: string
  clientId: string
  clientName: string | null
  description: string
  clients: Client[]
  selectedClient: Client | null
  isEditMode: boolean
  onInputChange: (name: string, value: any) => void
  onClientChange: (newValue: Client | null) => void
}

const BasicTripInfo: React.FC<BasicTripInfoProps> = ({
  tripName,
  clientId,
  clientName,
  description,
  clients,
  selectedClient,
  isEditMode,
  onInputChange,
  onClientChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Pagrindinė informacija
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Kelionės pavadinimas"
          value={tripName}
          onChange={(e) => onInputChange("tripName", e.target.value)}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={6}>
        {clientId && clientName && isEditMode ? (
          // If we already have both an ID and name in edit mode, show locked
          <TextField
            label="Klientas"
            value={clientName}
            fullWidth
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        ) : (
          // Otherwise show the Autocomplete
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => `${option.name} ${option.surname}`}
            value={selectedClient}
            onChange={(_, newValue) => onClientChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Klientas"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        )}
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Aprašymas"
          value={description}
          onChange={(e) => onInputChange("description", e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </Grid>
    </>
  )
}

export default BasicTripInfo

