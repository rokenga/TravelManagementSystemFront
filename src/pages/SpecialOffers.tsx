"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Chip,
  Paper,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import PublicOfferCard from "../components/PublicOfferCard"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { TripResponse } from "../types/ClientTrip"
import PublicOfferFilterPanel, {
  type PublicOfferFilters,
  defaultPublicOfferFilters,
} from "../components/filters/PublicOfferFilterPanel"
import { FilterList } from "@mui/icons-material"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"

// Add interface for paginated response
interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  totalPages: number
  pageSize: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const SpecialOffers: React.FC = () => {
  const [offers, setOffers] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<PublicOfferFilters>(defaultPublicOfferFilters)
  const [hasFilterOptions, setHasFilterOptions] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"))

  // Check if filter options exist
  useEffect(() => {
    const checkFilterOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/PublicTripOfferFacade/public-filter`)
        const filterOptions = response.data

        // Check if any filter options exist
        const hasOptions =
          filterOptions.destinations.length > 0 ||
          filterOptions.categories.length > 0 ||
          filterOptions.hotelRatings.length > 0 ||
          filterOptions.tripLengths.length > 0

        setHasFilterOptions(hasOptions)
      } catch (error) {
        console.error("Failed to check filter options:", error)
        setHasFilterOptions(false)
      }
    }

    checkFilterOptions()
  }, [])

  // Fetch offers with pagination and filters
  const fetchOffers = async () => {
    try {
      setLoading(true)

      // Create query params object
      const queryParams = {
        pageNumber: currentPage,
        pageSize: pageSize,
        destinations: selectedFilters.destinations.length > 0 ? selectedFilters.destinations : null,
        categories: selectedFilters.categories.length > 0 ? selectedFilters.categories : null,
        hotelRatings: selectedFilters.hotelRatings.length > 0 ? selectedFilters.hotelRatings : null,
        tripLengths: selectedFilters.tripLengths.length > 0 ? selectedFilters.tripLengths : null,
      }

      // Use the new paginated-offers endpoint
      const response = await axios.post<PaginatedResponse<TripResponse>>(
        `${API_URL}/PublicTripOfferFacade/paginated-offers`,
        queryParams,
      )

      // Update state with paginated response data
      setOffers(response.data.items)
      setTotalPages(response.data.totalPages)
      setTotalItems(response.data.totalCount)

      // Ensure current page is valid
      if (currentPage > response.data.totalPages && response.data.totalPages > 0) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("Failed to fetch special offers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch offers when pagination, filters, or page size changes
  useEffect(() => {
    fetchOffers()
  }, [currentPage, pageSize, selectedFilters])

  const handleOfferClick = (id: string) => {
    navigate(`/specialOfferDetails/${id}`)
  }

  const handleApplyFilters = (filters: PublicOfferFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0
    count += selectedFilters.destinations.length
    count += selectedFilters.categories.length
    count += selectedFilters.hotelRatings.length
    count += selectedFilters.tripLengths.length
    return count
  }

  return (
    <Box sx={{ width: "100%", py: 0 }}>
      <Container maxWidth="xl" disableGutters={!isMobile} sx={{ px: isMobile ? 2 : 3 }}>
        {/* Header with title and controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            mb: 3,
            gap: 2,
          }}
        >

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Page size selector */}
            <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} options={[25, 50, 100]} />

            {/* Filter button for mobile */}
            {hasFilterOptions && isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setIsFilterDrawerOpen(true)}
                endIcon={
                  getActiveFilterCount() > 0 && <Chip size="small" label={getActiveFilterCount()} color="primary" />
                }
              >
                Filtrai
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3, position: "relative" }}>
          {/* Filter panel for desktop - positioned on the left side */}
          {hasFilterOptions && !isMobile && (
            <Box
              sx={{
                position: "sticky",
                top: 16,
                alignSelf: "flex-start",
                zIndex: 1,
                width: isTablet ? "220px" : "280px",
                flexShrink: 0,
              }}
            >
              <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", width: "100%" }}>
                <PublicOfferFilterPanel
                  isOpen={isFilterDrawerOpen}
                  onClose={() => setIsFilterDrawerOpen(false)}
                  onApplyFilters={handleApplyFilters}
                  initialFilters={selectedFilters}
                />
              </Paper>
            </Box>
          )}

          {/* Main content area */}
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" my={6}>
                <CircularProgress />
              </Box>
            ) : offers.length > 0 ? (
              <>
                <Grid container spacing={isMobile ? 2 : 3}>
                  {offers.map((offer) => (
                    <Grid item xs={12} sm={6} md={4} lg={4} key={offer.id}>
                      <PublicOfferCard offer={offer} onClick={handleOfferClick} />
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: 4,
                      mb: 2,
                    }}
                  >
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </Box>
                )}
              </>
            ) : (
              <Paper
                elevation={1}
                sx={{
                  textAlign: "center",
                  py: 6,
                  px: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(0,0,0,0.02)",
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Šiuo metu specialių pasiūlymų nėra
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Prašome apsilankyti vėliau arba pakeiskite filtravimo kriterijus
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>

      {/* Filter panel for mobile - shown as a drawer */}
      {hasFilterOptions && isMobile && (
        <PublicOfferFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default SpecialOffers
