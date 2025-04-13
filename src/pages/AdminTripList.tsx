"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { TripResponse } from "../types/ClientTrip"
import type { PaginatedResponse } from "../types/Pagination"
import { Box, Typography, Grid, Button, CircularProgress, useMediaQuery, useTheme, Chip } from "@mui/material"
import { FilterList } from "@mui/icons-material"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import TripFilterPanel, { type TripFilters } from "../components/filters/TripFilterPanel"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import TripSummaryCard from "../components/TripSummaryCard"
import { useNavigation } from "../contexts/NavigationContext"

// Default values for list state
const defaultFilters: TripFilters = {
  categories: [],
  statuses: [],
  paymentStatuses: [], // Added payment statuses with default empty array
  startDate: null,
  endDate: null,
  priceRange: [0, 20000],
  destinations: [], // Added destinations with default empty array
}

const AdminTripList: React.FC = () => {
  const { setNavigationSource } = useNavigation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isFilterCollapsed = useMediaQuery(theme.breakpoints.down("md"))

  // State for trips data
  const [trips, setTrips] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  // List state with defaults
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<string>("Naujausios pirmos")
  const [selectedFilters, setSelectedFilters] = useState<TripFilters>(defaultFilters)

  // Pagination state
  const [totalPages, setTotalPages] = useState(1)

  // Ref to track if we should fetch data
  const shouldFetch = useRef(true)

  const token = localStorage.getItem("accessToken")

  /**
   * Fetch the trips from the API with all filtering options
   * This is now a memoized function that doesn't take parameters
   * but reads from component state
   */
  const fetchTrips = useCallback(async () => {
    if (!shouldFetch.current) return

    try {
      setLoading(true)

      // Create URLSearchParams object for proper parameter serialization
      const searchParams = new URLSearchParams()

      // Add basic pagination parameters
      searchParams.append("PageNumber", currentPage.toString())
      searchParams.append("PageSize", pageSize.toString())

      // Add search term if present
      if (searchTerm) {
        searchParams.append("SearchTerm", searchTerm)
      }

      // Add sorting parameters
      if (sortOption) {
        let sortBy: string
        let descending: boolean

        switch (sortOption) {
          case "Naujausios pirmos":
            sortBy = "createdAt"
            descending = true
            break
          case "Seniausios pirmos":
            sortBy = "createdAt"
            descending = false
            break
          case "Kaina (didėjimo tvarka)":
            sortBy = "price"
            descending = false
            break
          case "Kaina (mažėjimo tvarka)":
            sortBy = "price"
            descending = true
            break
          default:
            sortBy = "createdAt"
            descending = true
        }

        searchParams.append("SortBy", sortBy)
        searchParams.append("Descending", descending.toString())
      }

      // Add categories - using the exact parameter name 'Categories' with proper casing
      if (selectedFilters.categories.length > 0) {
        selectedFilters.categories.forEach((category) => {
          searchParams.append("Categories", category)
        })
      }

      // Add statuses - using the exact parameter name 'Statuses' with proper casing
      if (selectedFilters.statuses.length > 0) {
        selectedFilters.statuses.forEach((status) => {
          searchParams.append("Statuses", status)
        })
      }

      // Add payment statuses - using the exact parameter name 'Payments' as expected by the backend
      if (selectedFilters.paymentStatuses.length > 0) {
        selectedFilters.paymentStatuses.forEach((status) => {
          searchParams.append("Payments", status)
        })
      }

      // Add destinations
      if (selectedFilters.destinations.length > 0) {
        selectedFilters.destinations.forEach((destination) => {
          searchParams.append("Destinations", destination)
        })
      }

      // Add date filters
      if (selectedFilters.startDate) {
        searchParams.append("StartDate", selectedFilters.startDate)
      }

      if (selectedFilters.endDate) {
        searchParams.append("EndDate", selectedFilters.endDate)
      }

      // Add price range filters
      if (selectedFilters.priceRange) {
        if (selectedFilters.priceRange[0] > 0) {
          searchParams.append("PriceMin", selectedFilters.priceRange[0].toString())
        }

        if (selectedFilters.priceRange[1] < 20000) {
          searchParams.append("PriceMax", selectedFilters.priceRange[1].toString())
        }
      }

      // Log the full URL for debugging
      const queryString = searchParams.toString()
      console.log(`Fetching trips with URL: ${API_URL}/client-trips?${queryString}`)

      // Make the API call with the manually constructed query string
      const response = await axios.get<PaginatedResponse<TripResponse>>(`${API_URL}/client-trips?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Update state with data from the backend
      setTrips(response.data.items)
      setCurrentPage(response.data.pageNumber)
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
  }, [currentPage, pageSize, searchTerm, selectedFilters, sortOption, token])

  // Centralized data fetching in a single useEffect
  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // These handlers now just update state, which triggers the useEffect
  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    console.log(`Changing page size to ${newPageSize}`)
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
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
    // Set the navigation source to identify where we came from
    setNavigationSource("admin-trip-list")
    navigate(`/admin-trip-list/${id}`)
  }

  /**
   * Count how many filters are active
   */
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.paymentStatuses.length > 0) count++ // Count payment statuses
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++

    // Check if price range is different from default
    if (selectedFilters.priceRange && (selectedFilters.priceRange[0] > 0 || selectedFilters.priceRange[1] < 20000)) {
      count++
    }

    return count
  }

  // Initial data fetch - only on mount
  useEffect(() => {
    shouldFetch.current = true
    return () => {
      shouldFetch.current = false
    }
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Kelionių sąrašas
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
          <Button variant="contained" color="primary" onClick={() => navigate("/admin-trip-list/create")}>
            Sukurti kelionę klientui
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} options={[25, 50, 100]} />

          {isFilterCollapsed && (
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
            value={sortOption}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          position: "relative",
          minHeight: trips.length > 0 ? "800px" : "auto",
        }}
      >
        {!isFilterCollapsed && (
          <Box sx={{ position: "sticky", top: 0, alignSelf: "flex-start", zIndex: 1 }}>
            <TripFilterPanel
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

      {isFilterCollapsed && (
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

