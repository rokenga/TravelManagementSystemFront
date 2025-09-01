"use client"

import type React from "react"
import { useState } from "react"
import {
  Grid,
  TextField,
  InputAdornment,
  Autocomplete,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
} from "@mui/material"
import { Person, AutoAwesome } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../../../Utils/Configuration"
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
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateDescription = async () => {
    if (!description.trim() || isGenerating) return

    setIsGenerating(true)

    try {
      const response = await axios.post(
        `${API_URL}/client-trips/generate`, 
        { prompt: description.trim() },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      if (response.data && response.data.description) {
        onInputChange("description", response.data.description)
      }
    } catch (error) {
      console.error("Error generating description:", error)
      // You might want to show a snackbar error here
    } finally {
      setIsGenerating(false)
    }
  }

  const isGenerateButtonDisabled = !description.trim() || isGenerating

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
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {isGenerating ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Tooltip title="Įveskite kokio kelionės aprašymo norite ir jis bus sugeneruotas" placement="top">
                      <span>
                        <IconButton
                          onClick={handleGenerateDescription}
                          disabled={isGenerateButtonDisabled}
                          size="small"
                          sx={{
                            color: isGenerateButtonDisabled ? "action.disabled" : "primary.main",
                            "&:hover": {
                              backgroundColor: "primary.light",
                              color: "primary.contrastText",
                            },
                          }}
                        >
                          <AutoAwesome />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
    </>
  )
}

export default BasicTripInfo
