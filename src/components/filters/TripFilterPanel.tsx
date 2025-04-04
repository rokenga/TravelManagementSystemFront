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
} from "@mui/material"
import CustomDateTimePicker from "../CustomDatePicker"
import dayjs from "dayjs"

export interface TripFilters {
  categories: string[]
  statuses: string[]
  paymentStatuses: string[] // Added payment statuses
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

  // Initialize state with initialFilters
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories || [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters.statuses || [])
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>(initialFilters.paymentStatuses || [])
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialFilters.startDate ? dayjs(initialFilters.startDate) : null,
  )
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    initialFilters.endDate ? dayjs(initialFilters.endDate) : null,
  )
  const [priceRange, setPriceRange] = useState<[number, number]>(initialFilters.priceRange || [0, 20000])

  // Update local state when initialFilters change
  useEffect(() => {
    setSelectedCategories(initialFilters.categories || [])
    setSelectedStatuses(initialFilters.statuses || [])
    setSelectedPaymentStatuses(initialFilters.paymentStatuses || [])
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

      <Typography variant="subtitle1" gutterBottom>
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

      <Typography variant="subtitle1" gutterBottom>
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

      {/* New Payment Status Filter Section */}
      <Typography variant="subtitle1" gutterBottom>
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

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
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

