"use client"

import React, { useState, useEffect } from "react"
import { Autocomplete, TextField, CircularProgress } from "@mui/material"
import countriesData from "../assets/full-countries-lt.json"

export interface Country {
  code: string
  name: string
}

interface DestinationAutocompleteProps {
  value: Country | null
  onChange: (value: Country | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
  size?: "small" | "medium"
  disabled?: boolean
}

const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onChange,
  label = "Kelionės tikslas",
  placeholder = "Pasirinkite šalį",
  required = false,
  fullWidth = true,
  size = "medium",
  disabled = false,
}) => {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const processedCountries: Country[] = countriesData.map((country: any) => ({
        code: country.code,
        name: country.name,
      }))

      processedCountries.sort((a, b) => a.name.localeCompare(b.name))

      setCountries([...processedCountries])
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }, [])

  return (
    <Autocomplete
      id="destination-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={countries}
      loading={loading}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={(option) => option.name}
      noOptionsText="Tokios šalies nėra"
      loadingText="Kraunama..."
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          fullWidth={fullWidth}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      disabled={disabled}
    />
  )
}

export default DestinationAutocomplete
