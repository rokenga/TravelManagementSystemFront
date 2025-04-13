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
  Slider,
  Paper,
  useTheme,
  useMediaQuery,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material"
import CustomDateTimePicker from "../CustomDatePicker"
import dayjs from "dayjs"
import { TripCategory, OfferStatus } from "../../types/ClientTrip"
import { translateTripCategory, translateOfferStatus } from "../../Utils/translateEnums"
import countriesData from "../../assets/full-countries-lt.json"

// Interface for country data
interface Country {
  code: string
  name: string
}

export interface ClientSpecialOfferFilters {
  categories: string[]
  statuses: string[]
  destinations: string[]
  startDate: string | null
  endDate: string | null
}

interface ClientSpecialOfferFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: ClientSpecialOfferFilters) => void
  initialFilters: ClientSpecialOfferFilters
}

const ClientSpecialOfferFilterPanel: React.FC<ClientSpecialOfferFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Initialize state with initialFilters
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories || [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters.statuses || [])
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(initialFilters.destinations || [])
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialFilters.startDate ? dayjs(initialFilters.startDate) : null,
  )
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    initialFilters.endDate ? dayjs(initialFilters.endDate) : null,
  )
  const [countries, setCountries] = useState<Country[]>([])

  // Load countries from JSON file
  useEffect(() => {
    // In a real implementation, you would load the JSON file
    // For now, we'll use the imported data directly
    setCountries(countriesData as Country[])
  }, [])

  // Update local state when initialFilters change
  useEffect(() => {
    setSelectedCategories(initialFilters.categories || [])
    setSelectedStatuses(initialFilters.statuses || [])
    setSelectedDestinations(initialFilters.destinations || [])
    setStartDate(initialFilters.startDate ? dayjs(initialFilters.startDate) : null)
    setEndDate(initialFilters.endDate ? dayjs(initialFilters.endDate) : null)
  }, [initialFilters])

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handleApply = () => {
    onApplyFilters({
      categories: selectedCategories,
      statuses: selectedStatuses,
      destinations: selectedDestinations,
      startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
      endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
    })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedCategories([])
    setSelectedStatuses([])
    setSelectedDestinations([])
    setStartDate(null)
    setEndDate(null)
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : "300px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Filtrai</Typography>
        <Button size="small" onClick={handleReset}>
          Išvalyti
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Kryptys
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          multiple
          options={countries.map((country) => country.name)}
          value={selectedDestinations}
          onChange={(_, newValue) => setSelectedDestinations(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip key={option} label={option} {...getTagProps({ index })} size="small" sx={{ m: 0.5 }} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} variant="outlined" size="small" placeholder="Pasirinkite kryptis" />
          )}
          sx={{ mb: 1 }}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Kategorija
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        {Object.values(TripCategory).map((category) => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
            }
            label={translateTripCategory(category)}
          />
        ))}
      </FormGroup>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Būsena
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        {Object.values(OfferStatus).map((status) => (
          <FormControlLabel
            key={status}
            control={
              <Checkbox checked={selectedStatuses.includes(status)} onChange={() => handleStatusChange(status)} />
            }
            label={translateOfferStatus(status)}
          />
        ))}
      </FormGroup>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Datos
      </Typography>
      <Box sx={{ mb: 3 }}>
        <CustomDateTimePicker
          label="Nuo"
          value={startDate}
          onChange={setStartDate}
          showTime={false}
          sx={{ mb: 2, width: "100%" }}
        />
        <CustomDateTimePicker
          label="Iki"
          value={endDate}
          onChange={setEndDate}
          showTime={false}
          minDate={startDate}
          sx={{ width: "100%" }}
        />
      </Box>

      <Button variant="contained" color="primary" fullWidth onClick={handleApply}>
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

export default ClientSpecialOfferFilterPanel
