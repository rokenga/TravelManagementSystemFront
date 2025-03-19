"use client"

import React, { useState } from "react"
import {
  Box,
  Button,
  Chip,
  Drawer,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Stack,
  styled,
} from "@mui/material"
import { FilterList, Close, ExpandMore } from "@mui/icons-material"
import { TripCategory, TripStatus } from "../../types/ClientTrip"
import { translateTripCategory, translateTripStatus } from "../../Utils/translateEnums"
import CustomDateTimePicker from "../CustomDatePicker"
import dayjs from "dayjs"

/**
 * The shape of the filters we maintain in the panel,
 * including the priceRange array for the slider.
 */
export interface TripFilters {
  categories: TripCategory[]
  statuses: TripStatus[]
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

// Styled components for consistent typography
const FilterTitle = styled(Typography)(() => ({
  fontSize: "1.125rem",
  fontWeight: 500,
}))

const FilterAccordion = styled(Accordion)({
  "&.MuiAccordion-root": {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    "&:before": {
      display: "none",
    },
  },
})

const FilterAccordionSummary = styled(AccordionSummary)(() => ({
  padding: "0 0",
  "& .MuiAccordionSummary-content": {
    margin: "12px 0",
  },
}))

const FilterAccordionDetails = styled(AccordionDetails)({
  padding: "0 0 16px 0",
})

const FilterCheckboxLabel = styled(FormControlLabel)({
  "& .MuiFormControlLabel-label": {
    fontSize: "1rem",
  },
})

/**
 * A component that displays filter accordions, including a Price Range slider.
 */
const TripFilterPanel: React.FC<TripFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  // We copy the initialFilters into state
  const [filters, setFilters] = useState<TripFilters>({
    ...initialFilters,
    // If the user hasn't chosen a range yet, default to [0, 20000]
    priceRange: initialFilters.priceRange ?? [0, 20000],
  })

  const [expandedSection, setExpandedSection] = useState<string | false>("category")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  /**
   * Accordion expansion
   */
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false)
  }

  /**
   * Toggling categories
   */
  const handleCategoryToggle = (category: TripCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  /**
   * Toggling statuses
   */
  const handleStatusToggle = (status: TripStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }

  /**
   * For picking start/end date
   */
  const handleDateChange = (field: "startDate" | "endDate", value: dayjs.Dayjs | null) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value ? value.format("YYYY-MM-DD") : null,
    }))
  }

  /**
   * Price Range slider
   */
  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: newValue as [number, number],
    }))
  }

  /**
   * Apply filters
   */
  const handleApply = () => {
    onApplyFilters(filters)
    if (isMobile) {
      onClose()
    }
  }

  /**
   * Clear all filters
   */
  const handleClear = () => {
    const clearedFilters: TripFilters = {
      categories: [],
      statuses: [],
      startDate: null,
      endDate: null,
      priceRange: [0, 20000],
    }
    setFilters(clearedFilters)
    onApplyFilters(clearedFilters)
  }

  /**
   * Count how many filters are active, for display
   */
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.statuses.length > 0) count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 20000) count++
    return count
  }

  /**
   * The main UI for the filter panel
   */
  const filterContent = (
    <Box sx={{ p: 3, width: isMobile ? "100%" : 300 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <FilterTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterList /> Filtrai
          {getActiveFilterCount() > 0 && (
            <Chip size="small" label={getActiveFilterCount()} color="primary" sx={{ ml: 1 }} />
          )}
        </FilterTitle>
        {isMobile && (
          <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.5 }}>
            <Close />
          </Button>
        )}
      </Box>

      <Stack spacing={0}>
        {/* CATEGORY */}
        <FilterAccordion
          expanded={expandedSection === "category"}
          onChange={handleAccordionChange("category")}
          elevation={0}
          disableGutters
        >
          <FilterAccordionSummary expandIcon={<ExpandMore />}>
            <FilterTitle>Kelionės kategorija</FilterTitle>
          </FilterAccordionSummary>
          <FilterAccordionDetails>
            <FormGroup>
              {Object.values(TripCategory).map((category) => (
                <FilterCheckboxLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                  }
                  label={translateTripCategory(category)}
                />
              ))}
            </FormGroup>
          </FilterAccordionDetails>
        </FilterAccordion>

        {/* STATUS */}
        <FilterAccordion
          expanded={expandedSection === "status"}
          onChange={handleAccordionChange("status")}
          elevation={0}
          disableGutters
        >
          <FilterAccordionSummary expandIcon={<ExpandMore />}>
            <FilterTitle>Kelionės statusas</FilterTitle>
          </FilterAccordionSummary>
          <FilterAccordionDetails>
            <FormGroup>
              {Object.values(TripStatus).map((status) => (
                <FilterCheckboxLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={filters.statuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                  }
                  label={translateTripStatus(status)}
                />
              ))}
            </FormGroup>
          </FilterAccordionDetails>
        </FilterAccordion>

        {/* DATE */}
        <FilterAccordion
          expanded={expandedSection === "date"}
          onChange={handleAccordionChange("date")}
          elevation={0}
          disableGutters
        >
          <FilterAccordionSummary expandIcon={<ExpandMore />}>
            <FilterTitle>Kelionės data</FilterTitle>
          </FilterAccordionSummary>
          <FilterAccordionDetails>
            <Stack spacing={2}>
              <CustomDateTimePicker
                label="Nuo"
                value={filters.startDate ? dayjs(filters.startDate) : null}
                onChange={(date) => handleDateChange("startDate", date)}
                showTime={false}
              />
              <CustomDateTimePicker
                label="Iki"
                value={filters.endDate ? dayjs(filters.endDate) : null}
                onChange={(date) => handleDateChange("endDate", date)}
                showTime={false}
                minDate={filters.startDate ? dayjs(filters.startDate) : undefined}
              />
            </Stack>
          </FilterAccordionDetails>
        </FilterAccordion>

        {/* PRICE */}
        <FilterAccordion
          expanded={expandedSection === "price"}
          onChange={handleAccordionChange("price")}
          elevation={0}
          disableGutters
        >
          <FilterAccordionSummary expandIcon={<ExpandMore />}>
            <FilterTitle>Kaina (€)</FilterTitle>
          </FilterAccordionSummary>
          <FilterAccordionDetails>
            <Box sx={{ px: 2, pt: 1 }}>
              <Slider
                value={filters.priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={20000}
                step={100}
                marks={[
                  { value: 0, label: "0 €" },
                  { value: 20000, label: "20000 €" },
                ]}
                sx={{
                  "& .MuiSlider-markLabel": {
                    fontSize: "1rem",
                  },
                }}
              />
            </Box>
          </FilterAccordionDetails>
        </FilterAccordion>
      </Stack>

      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleApply} 
          color="primary" 
          sx={{ fontSize: "1rem" }}
        >
          Pritaikyti
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleClear} 
          sx={{ fontSize: "1rem" }}
        >
          Išvalyti
        </Button>
      </Box>
    </Box>
  )

  return (
    <>
      {isMobile ? (
        <Drawer anchor="left" open={isOpen} onClose={onClose}>
          {filterContent}
        </Drawer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: 300,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            height: "fit-content",
            position: "sticky",
            top: 24,
            alignSelf: "flex-start", // Add this to ensure it stays at the top
            zIndex: 1, // Add a z-index to ensure it stays above other content
          }}
        >
          {filterContent}
        </Paper>
      )}
    </>
  )
}

export default TripFilterPanel
