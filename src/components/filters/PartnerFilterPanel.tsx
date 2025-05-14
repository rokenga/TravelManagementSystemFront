"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Drawer,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  useTheme,
  useMediaQuery,
  TextField,
  Autocomplete,
  Chip,
  CircularProgress,
} from "@mui/material"
import { PartnerType, partnerTypeColors } from "../../types/Partner"
import { translatePartnerType } from "../../Utils/translateEnums"
import countriesData from "../../assets/full-countries-lt.json"
import continentData from "../../assets/continents.json"

interface Country {
  code: string
  name: string
}

interface Continent {
  code: string
  name: string
}

export interface PartnerFilters {
  types: number[]
  countries: string[]
  continents: string[]
  onlyMine: boolean
}

interface PartnerFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: PartnerFilters) => void
  initialFilters: PartnerFilters
}

export const defaultPartnerFilters: PartnerFilters = {
  types: [],
  countries: [],
  continents: [],
  onlyMine: false,
}

const PartnerFilterPanel: React.FC<PartnerFilterPanelProps> = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [selectedTypes, setSelectedTypes] = useState<number[]>(initialFilters.types || [])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialFilters.countries || [])
  const [selectedContinents, setSelectedContinents] = useState<string[]>(initialFilters.continents || [])
  const [isMyPartner, setIsMyPartner] = useState<boolean>(initialFilters.onlyMine || false)

  const [countries, setCountries] = useState<Country[]>([])
  const [continents, setContinents] = useState<Continent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)

    try {
      setCountries(countriesData as Country[])
      setContinents(continentData as Continent[])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setSelectedTypes(initialFilters.types || [])
    setSelectedCountries(initialFilters.countries || [])
    setSelectedContinents(initialFilters.continents || [])
    setIsMyPartner(initialFilters.onlyMine || false)
  }, [initialFilters])

  const handleTypeChange = (type: number) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleMyPartnerChange = () => {
    setIsMyPartner(!isMyPartner)
  }

  const handleApply = () => {
    onApplyFilters({
      types: selectedTypes,
      countries: selectedCountries,
      continents: selectedContinents,
      onlyMine: isMyPartner,
    })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedTypes([])
    setSelectedCountries([])
    setSelectedContinents([])
    setIsMyPartner(false)
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : "300px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ textAlign: "left" }}>
          Filtrai
        </Typography>
        <Button size="small" onClick={handleReset}>
          Išvalyti
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
            Tipas
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            {Object.values(PartnerType)
              .filter((value) => typeof value === "number")
              .map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={selectedTypes.includes(type as number)}
                      onChange={() => handleTypeChange(type as number)}
                    />
                  }
                  label={
                    <Chip
                      label={translatePartnerType(type as PartnerType)}
                      size="small"
                      sx={{
                        bgcolor: partnerTypeColors[type as PartnerType],
                        color: "white",
                        fontWeight: "medium",
                        height: 24,
                      }}
                    />
                  }
                  sx={{
                    textAlign: "left",
                    ".MuiFormControlLabel-label": {
                      textAlign: "left",
                      display: "block",
                    },
                  }}
                />
              ))}
          </FormGroup>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
            Šalys
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={countries.map((country) => country.name)}
              value={selectedCountries}
              onChange={(_, newValue) => setSelectedCountries(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" sx={{ m: 0.5 }} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} variant="outlined" size="small" placeholder="Pasirinkite šalis" />
              )}
              sx={{ mb: 1 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
            Žemynai
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={continents.map((continent) => continent.name)}
              value={selectedContinents}
              onChange={(_, newValue) => setSelectedContinents(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" sx={{ m: 0.5 }} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} variant="outlined" size="small" placeholder="Pasirinkite žemynus" />
              )}
              sx={{ mb: 1 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
            Kita
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={isMyPartner} onChange={handleMyPartnerChange} />}
              label="Mano partneris"
              sx={{
                textAlign: "left",
                ".MuiFormControlLabel-label": {
                  textAlign: "left",
                  display: "block",
                },
              }}
            />
          </FormGroup>
        </>
      )}

      <Button variant="contained" color="primary" fullWidth onClick={handleApply} disabled={loading}>
        Taikyti filtrus
      </Button>
    </Box>
  )

  return isMobile ? (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      {filterContent}
    </Drawer>
  ) : (
    <Paper elevation={2} sx={{ borderRadius: 2 }}>
      {filterContent}
    </Paper>
  )
}

export default PartnerFilterPanel
