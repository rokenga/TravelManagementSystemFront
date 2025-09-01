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
import countriesData from "../../assets/full-countries-lt.json"

interface Country {
  code: string
  name: string
}

export interface TripFilters {
  categories: string[]
  statuses: string[]
  paymentStatuses: string[]
  destinations: string[]
  startDate: string | null
  endDate: string | null
  priceRange: [number, number]
}

interface TripFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: TripFilters) => void
  initialFilters: TripFilters
}

const TripFilterPanel: React.FC<TripFilterPanelProps> = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories || [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters.statuses || [])
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>(initialFilters.paymentStatuses || [])
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(initialFilters.destinations || [])
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialFilters.startDate ? dayjs(initialFilters.startDate) : null,
  )
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    initialFilters.endDate ? dayjs(initialFilters.endDate) : null,
  )
  const [priceRange, setPriceRange] = useState<[number, number]>(initialFilters.priceRange || [0, 20000])
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    setCountries(countriesData as Country[])
  }, [])

  useEffect(() => {
    setSelectedCategories(initialFilters.categories || [])
    setSelectedStatuses(initialFilters.statuses || [])
    setSelectedPaymentStatuses(initialFilters.paymentStatuses || [])
    setSelectedDestinations(initialFilters.destinations || [])
    setStartDate(initialFilters.startDate ? dayjs(initialFilters.startDate) : null)
    setEndDate(initialFilters.endDate ? dayjs(initialFilters.endDate) : null)
    setPriceRange(initialFilters.priceRange || [0, 20000])
  }, [initialFilters])

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handlePaymentStatusChange = (status: string) => {
    setSelectedPaymentStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number])
  }

  const handleApply = () => {
    onApplyFilters({
      categories: selectedCategories,
      statuses: selectedStatuses,
      paymentStatuses: selectedPaymentStatuses,
      destinations: selectedDestinations,
      startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
      endDate: endDate ? endDate.format("YYYY-MM-DD") : null,
      priceRange,
    })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedCategories([])
    setSelectedStatuses([])
    setSelectedPaymentStatuses([])
    setSelectedDestinations([])
    setStartDate(null)
    setEndDate(null)
    setPriceRange([0, 20000])
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

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
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

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
        Kategorija
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox checked={selectedCategories.includes("Relax")} onChange={() => handleCategoryChange("Relax")} />
          }
          label="Poilsinė"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedCategories.includes("Business")}
              onChange={() => handleCategoryChange("Business")}
            />
          }
          label="Verslo"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedCategories.includes("Tourist")}
              onChange={() => handleCategoryChange("Tourist")}
            />
          }
          label="Pažintinė"
        />
        <FormControlLabel
          control={
            <Checkbox checked={selectedCategories.includes("Group")} onChange={() => handleCategoryChange("Group")} />
          }
          label="Grupinė"
        />
        <FormControlLabel
          control={
            <Checkbox checked={selectedCategories.includes("Cruise")} onChange={() => handleCategoryChange("Cruise")} />
          }
          label="Kruizas"
        />
      </FormGroup>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
        Būsena
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox checked={selectedStatuses.includes("Draft")} onChange={() => handleStatusChange("Draft")} />
          }
          label="Juodraštis"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedStatuses.includes("Confirmed")}
              onChange={() => handleStatusChange("Confirmed")}
            />
          }
          label="Patvirtinta"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedStatuses.includes("Cancelled")}
              onChange={() => handleStatusChange("Cancelled")}
            />
          }
          label="Atšaukta"
        />
      </FormGroup>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
        Mokėjimo būsena
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedPaymentStatuses.includes("Unpaid")}
              onChange={() => handlePaymentStatusChange("Unpaid")}
            />
          }
          label="Neapmokėta"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedPaymentStatuses.includes("PartiallyPaid")}
              onChange={() => handlePaymentStatusChange("PartiallyPaid")}
            />
          }
          label="Dalinai apmokėta"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedPaymentStatuses.includes("Paid")}
              onChange={() => handlePaymentStatusChange("Paid")}
            />
          }
          label="Apmokėta"
        />
      </FormGroup>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
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

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
        Kaina (€)
      </Typography>
      <Box sx={{ px: 1, mb: 3 }}>
        <Slider
          value={priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          min={0}
          max={20000}
          step={100}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2">€{priceRange[0]}</Typography>
          <Typography variant="body2">€{priceRange[1]}</Typography>
        </Box>
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

export default TripFilterPanel
