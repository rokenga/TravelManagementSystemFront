"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { TripResponse, TripQueryParams } from "../types/ClientTrip"
import type { PaginatedResponse } from "../types/Pagination"
import { Box, Typography, Grid, Button, CircularProgress, useMediaQuery, useTheme, Chip } from "@mui/material"
import { FilterList } from "@mui/icons-material"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import TripFilterPanel, { type TripFilters } from "../components/filters/TripFilterPanel"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import TripSummaryCard from "../components/TripSummaryCard"

const AdminTripList: React.FC = () => {
  const [trips, setTrips] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [sortOption, setSortOption] = useState<string>("Naujausios pirmos")

  // Use the correct TripFilters interface that only has priceRange
  const [selectedFilters, setSelectedFilters] = useState<TripFilters>({
    categories: [],
    statuses: [],
    startDate: null,
    endDate: null,
    priceRange: [0, 20000], // Default range
  })

  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const token = localStorage.getItem("accessToken")

  /**
   * Fetch the trips from the API with all filtering options
   */
  const fetchTrips = async (page: number, search: string, size: number = pageSize) => {
    try {
      setLoading(true)
      const params: TripQueryParams = {
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
      }

      // Add sorting parameters
      if (sortOption) {
        switch (sortOption) {
          case "Naujausios pirmos":
            params.sortBy = "createdAt" // Using createdAt from second implementation
            params.descending = true
            break
          case "Seniausios pirmos":
            params.sortBy = "createdAt"
            params.descending = false
            break
          case "Kaina (didėjimo tvarka)":
            params.sortBy = "price"
            params.descending = false
            break
          case "Kaina (mažėjimo tvarka)":
            params.sortBy = "price"
            params.descending = true
            break
        }
      }

      // Add filter parameters
      if (selectedFilters.categories.length > 0) {
        params.category = selectedFilters.categories[0] // API might need to be updated to handle multiple categories
      }

      if (selectedFilters.statuses.length > 0) {
        params.status = selectedFilters.statuses[0] // API might need to be updated to handle multiple statuses
      }

      if (selectedFilters.startDate) {
        params.startDate = selectedFilters.startDate
      }

      if (selectedFilters.endDate) {
        params.endDate = selectedFilters.endDate
      }

      // Use priceRange for min/max price filtering
      if (selectedFilters.priceRange) {
        // Only set priceMin if it's different from the default minimum
        if (selectedFilters.priceRange[0] > 0) {
          params.priceMin = selectedFilters.priceRange[0]
        }

        // Only set priceMax if it's different from the default maximum
        if (selectedFilters.priceRange[1] < 20000) {
          params.priceMax = selectedFilters.priceRange[1]
        }
      }

      const response = await axios.get<PaginatedResponse<TripResponse>>(`${API_URL}/client-trips`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })

      // Update state with data from the backend
      setTrips(response.data.items)
      setCurrentPage(response.data.pageNumber) // Use the page number from the response
      setPageSize(response.data.pageSize)

      // Calculate total pages based on the response data
      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setTotalPages(calculatedTotalPages)

      console.log("Pagination data:", {
        currentPage: response.data.pageNumber,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: calculatedTotalPages,
      })
    } catch (err: any) {
      console.error("Failed to fetch trips:", err)
      setError(err.response?.data?.message || "Nepavyko gauti kelionių sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    fetchTrips(newPage, searchTerm)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    console.log(`Changing page size to ${newPageSize}`)
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
    fetchTrips(1, searchTerm, newPageSize)
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleApplyFilters = (filters: TripFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) // Reset to first page when filtering
    setIsFilterDrawerOpen(false)
  }

  const handleTripClick = (id: string) => {
    navigate(`/trips/${id}`)
  }

  /**
   * Count how many filters are active
   */
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++

    // Check if price range is different from default
    if (selectedFilters.priceRange && (selectedFilters.priceRange[0] > 0 || selectedFilters.priceRange[1] < 20000)) {
      count++
    }

    return count
  }

  // Initial load
  useEffect(() => {
    fetchTrips(currentPage, searchTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array for initial load

  // Re-fetch when filters, sort, or search changes
  useEffect(() => {
    if (searchTerm || sortOption || getActiveFilterCount() > 0) {
      fetchTrips(1, searchTerm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortOption, selectedFilters])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Jūsų sukurtos kelionės
      </Typography>

      <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Ieškoti kelionių..." />

      <Box
        sx={{
          mt: 2,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Button variant="contained" color="primary" onClick={() => navigate("/trips/client")}>
            Sukurti kelionę klientui
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} options={[25, 50, 100]} />

          {isMobile && (
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

          <SortMenu
            options={["Naujausios pirmos", "Seniausios pirmos", "Kaina (didėjimo tvarka)", "Kaina (mažėjimo tvarka)"]}
            onSort={handleSortChange}
            value={sortOption} // Changed from selectedOption to value based on error
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          position: "relative", // Add this to create a positioning context
          minHeight: trips.length > 0 ? "800px" : "auto", // Add minimum height to prevent layout shifts
        }}
      >
        {!isMobile && (
          <Box sx={{ position: "sticky", top: 0, alignSelf: "flex-start", zIndex: 1 }}>
            <TripFilterPanel
              key="desktop-filter-panel" // Add a stable key
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={selectedFilters}
            />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          ) : trips.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {trips.map((trip) => (
                  <Grid item xs={12} sm={6} md={4} key={trip.id}>
                    <TripSummaryCard trip={trip} onClick={() => handleTripClick(trip.id)} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination Controls */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 3,
                }}
              >
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </Box>
            </>
          ) : (
            <Typography variant="body1" textAlign="center">
              Nėra sukurtų kelionių.
            </Typography>
          )}
        </Box>
      </Box>

      {isMobile && (
        <TripFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default AdminTripList

