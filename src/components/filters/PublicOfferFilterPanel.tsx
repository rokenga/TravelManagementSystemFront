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
  Rating,
  Chip,
  CircularProgress,
  TextField,
  Autocomplete,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import type { TripCategory } from "../../types/ClientTrip"
import { translateTripCategory } from "../../Utils/translateEnums"

interface PublicOfferFilterOptions {
  destinations: string[]
  categories: string[]
  hotelRatings: number[]
  tripLengths: number[]
}

export interface PublicOfferFilters {
  destinations: string[]
  categories: string[]
  hotelRatings: number[]
  tripLengths: number[]
}

interface PublicOfferFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: PublicOfferFilters) => void
  initialFilters: PublicOfferFilters
}

export const defaultPublicOfferFilters: PublicOfferFilters = {
  destinations: [],
  categories: [],
  hotelRatings: [],
  tripLengths: [],
}

const PublicOfferFilterPanel: React.FC<PublicOfferFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [filterOptions, setFilterOptions] = useState<PublicOfferFilterOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(initialFilters.destinations || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories || [])
  const [selectedHotelRatings, setSelectedHotelRatings] = useState<number[]>(initialFilters.hotelRatings || [])
  const [selectedTripLengths, setSelectedTripLengths] = useState<number[]>(initialFilters.tripLengths || [])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferFilterOptions>(`${API_URL}/PublicTripOfferFacade/public-filter`)
        setFilterOptions(response.data)
      } catch (error) {
        setError("Nepavyko gauti filtrų.")
      } finally {
        setLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  useEffect(() => {
    setSelectedDestinations(initialFilters.destinations || [])
    setSelectedCategories(initialFilters.categories || [])
    setSelectedHotelRatings(initialFilters.hotelRatings || [])
    setSelectedTripLengths(initialFilters.tripLengths || [])
  }, [initialFilters])

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleHotelRatingChange = (rating: number) => {
    setSelectedHotelRatings((prev) => (prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]))
  }

  const handleTripLengthChange = (length: number) => {
    setSelectedTripLengths((prev) => (prev.includes(length) ? prev.filter((l) => l !== length) : [...prev, length]))
  }

  const handleApply = () => {
    onApplyFilters({
      destinations: selectedDestinations,
      categories: selectedCategories,
      hotelRatings: selectedHotelRatings,
      tripLengths: selectedTripLengths,
    })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedDestinations([])
    setSelectedCategories([])
    setSelectedHotelRatings([])
    setSelectedTripLengths([])
  }

  if (!loading && !filterOptions) {
    return null
  }

  if (
    !loading &&
    filterOptions &&
    filterOptions.destinations.length === 0 &&
    filterOptions.categories.length === 0 &&
    filterOptions.hotelRatings.length === 0 &&
    filterOptions.tripLengths.length === 0
  ) {
    return null
  }

  const filterContent = (
    <Box sx={{ p: 3, width: isMobile ? "100%" : "100%", maxWidth: isMobile ? "none" : "280px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" align="left">
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
          {filterOptions?.destinations && filterOptions.destinations.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom align="left">
                Kryptys
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  multiple
                  options={filterOptions.destinations}
                  value={selectedDestinations}
                  onChange={(_, newValue) => setSelectedDestinations(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} size="small" sx={{ m: 0.5 }} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="Pasirinkite kryptis" />
                  )}
                  sx={{ mb: 1 }}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {filterOptions?.categories && filterOptions.categories.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom align="left">
                Kategorijos
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {filterOptions.categories.map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                      />
                    }
                    label={translateTripCategory(category as TripCategory)}
                    sx={{
                      justifyContent: "flex-start",
                      "& .MuiFormControlLabel-label": {
                        textAlign: "left",
                        width: "100%",
                        wordBreak: "break-word",
                      },
                    }}
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {filterOptions?.hotelRatings && filterOptions.hotelRatings.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom align="left">
                Viešbučio įvertinimas
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {filterOptions.hotelRatings.map((rating) => (
                  <FormControlLabel
                    key={rating}
                    control={
                      <Checkbox
                        checked={selectedHotelRatings.includes(rating)}
                        onChange={() => handleHotelRatingChange(rating)}
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Rating value={rating} readOnly size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" align="left">
                          ({rating})
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {filterOptions?.tripLengths && filterOptions.tripLengths.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom align="left">
                Kelionės trukmė (dienos)
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {filterOptions.tripLengths.map((length) => (
                  <FormControlLabel
                    key={length}
                    control={
                      <Checkbox
                        checked={selectedTripLengths.includes(length)}
                        onChange={() => handleTripLengthChange(length)}
                      />
                    }
                    label={`${length} d.`}
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button variant="contained" onClick={handleApply} fullWidth>
              Taikyti filtrus
            </Button>
          </Box>
        </>
      )}
    </Box>
  )

  return isMobile ? (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      {filterContent}
    </Drawer>
  ) : (
    filterContent
  )
}

export default PublicOfferFilterPanel
