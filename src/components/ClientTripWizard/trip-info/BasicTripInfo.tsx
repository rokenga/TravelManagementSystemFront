"use client"

import type React from "react"
import { Grid, TextField, InputAdornment, Autocomplete } from "@mui/material"
import { Person } from "@mui/icons-material"
import type { Client } from "../../../types/Client"
import type { Country } from "../../DestinationAutocomplete"
import DestinationAutocomplete from "../../DestinationAutocomplete"

interface BasicTripInfoProps {
  tripName: string
  clientId: string
  clientName: string | null
  description: string
  clients: Client[]
  selectedClient: Client | null
  isEditMode: boolean
  destination: Country | null
  onInputChange: (name: string, value: any) => void
  onClientChange: (newValue: Client | null) => void
  onDestinationChange: (newValue: Country | null) => void
}

const BasicTripInfo: React.FC<BasicTripInfoProps> = ({
  tripName,
  clientId,
  clientName,
  description,
  clients,
  selectedClient,
  isEditMode,
  destination,
  onInputChange,
  onClientChange,
  onDestinationChange,
}) => {
  return (
    <>
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
            options={Array.isArray(clients) ? clients : []}
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

      {/* Add destination field */}
      <Grid item xs={12}>
        <DestinationAutocomplete value={destination} onChange={onDestinationChange} />
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
