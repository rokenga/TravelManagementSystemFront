"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Button,
  Drawer,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Slider,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { ExpandMore, FilterList } from "@mui/icons-material"

interface FilterOption {
  type: "checkbox" | "slider"
  label: string
  options?: string[]
  range?: [number, number]
}

interface FilterSection {
  title: string
  options: FilterOption[]
}

interface FilterMenuProps {
  sections: FilterSection[]
  onApplyFilters: (filters: any) => void
  isOpen: boolean
  onClose: () => void
}

const FilterMenu: React.FC<FilterMenuProps> = ({ sections, onApplyFilters, isOpen, onClose }) => {
  const [filters, setFilters] = useState<any>({})
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const handleFilterChange = (sectionTitle: string, optionLabel: string, value: any) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [sectionTitle]: {
        ...prevFilters[sectionTitle],
        [optionLabel]: value,
      },
    }))
  }

  const handleApplyFilters = () => {
    onApplyFilters(filters)
    if (isMobile) {
      onClose()
    }
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : 280 }}>
      <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <FilterList /> Filtrai
      </Typography>

      {sections.map((section, index) => (
        <Accordion key={index} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">{section.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {section.options.map((option, optionIndex) => (
                <Box key={optionIndex}>
                  {option.type === "checkbox" &&
                    option.options &&
                    option.options.map((checkboxOption) => (
                      <FormControlLabel
                        key={checkboxOption}
                        control={
                          <Checkbox
                            checked={filters[section.title]?.[checkboxOption] || false}
                            onChange={(e) => handleFilterChange(section.title, checkboxOption, e.target.checked)}
                          />
                        }
                        label={checkboxOption}
                      />
                    ))}
                  {option.type === "slider" && option.range && (
                    <Box sx={{ px: 2 }}>
                      <Typography gutterBottom>{option.label}</Typography>
                      <Slider
                        value={filters[section.title]?.[option.label] || option.range}
                        onChange={(_, newValue) => handleFilterChange(section.title, option.label, newValue)}
                        valueLabelDisplay="auto"
                        min={option.range[0]}
                        max={option.range[1]}
                        marks={[
                          { value: option.range[0], label: `${option.range[0]}` },
                          { value: option.range[1], label: `${option.range[1]}` },
                        ]}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        <Button variant="contained" fullWidth onClick={handleApplyFilters} sx={{ textTransform: "none" }}>
          Pritaikyti filtrus
        </Button>
        <Button variant="outlined" onClick={handleClearFilters} sx={{ textTransform: "none" }}>
          Išvalyti
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: isMobile ? "inline" : "block" }}>
      {isMobile ? (
        <Drawer anchor="left" open={isOpen} onClose={onClose}>
          {filterContent}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: 280,
            height: "calc(100vh - 64px)",
            borderRight: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 64,
            overflowY: "auto",
            bgcolor: "background.default",
          }}
        >
          {filterContent}
        </Box>
      )}
    </Box>
  )
}

export default FilterMenu

