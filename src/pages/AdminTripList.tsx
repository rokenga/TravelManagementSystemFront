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

const defaultFilters: TripFilters = {
  categories: [],
  statuses: [],
  paymentStatuses: [], 
  startDate: null,
  endDate: null,
  priceRange: [0, 20000],
  destinations: [], 
}

const AdminTripList: React.FC = () => {
  const { setNavigationSource } = useNavigation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isFilterCollapsed = useMediaQuery(theme.breakpoints.down("md"))

  const [trips, setTrips] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<string>("Naujausios pirmos")
  const [selectedFilters, setSelectedFilters] = useState<TripFilters>(defaultFilters)

  const [totalPages, setTotalPages] = useState(1)

  const shouldFetch = useRef(true)

  const token = localStorage.getItem("accessToken")

  const fetchTrips = useCallback(async () => {
    if (!shouldFetch.current) return

    try {
      setLoading(true)

      const searchParams = new URLSearchParams()

      searchParams.append("PageNumber", currentPage.toString())
      searchParams.append("PageSize", pageSize.toString())

      if (searchTerm) {
        searchParams.append("SearchTerm", searchTerm)
      }

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

      if (selectedFilters.categories.length > 0) {
        selectedFilters.categories.forEach((category) => {
          searchParams.append("Categories", category)
        })
      }

      if (selectedFilters.statuses.length > 0) {
        selectedFilters.statuses.forEach((status) => {
          searchParams.append("Statuses", status)
        })
      }

      if (selectedFilters.paymentStatuses.length > 0) {
        selectedFilters.paymentStatuses.forEach((status) => {
          searchParams.append("Payments", status)
        })
      }

      if (selectedFilters.destinations.length > 0) {
        selectedFilters.destinations.forEach((destination) => {
          searchParams.append("Destinations", destination)
        })
      }

      if (selectedFilters.startDate) {
        searchParams.append("StartDate", selectedFilters.startDate)
      }

      if (selectedFilters.endDate) {
        searchParams.append("EndDate", selectedFilters.endDate)
      }

      if (selectedFilters.priceRange) {
        if (selectedFilters.priceRange[0] > 0) {
          searchParams.append("PriceMin", selectedFilters.priceRange[0].toString())
        }

        if (selectedFilters.priceRange[1] < 20000) {
          searchParams.append("PriceMax", selectedFilters.priceRange[1].toString())
        }
      }

      const response = await axios.get<PaginatedResponse<TripResponse>>(`${API_URL}/client-trips?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setTrips(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)

      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setTotalPages(calculatedTotalPages)
    } catch (err: any) {
      setError(err.response?.data?.message || "Nepavyko gauti kelionių sąrašo.")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, selectedFilters, sortOption, token])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) 
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) 
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    setCurrentPage(1) 
  }

  const handleApplyFilters = (filters: TripFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) 
    setIsFilterDrawerOpen(false)
  }

  const handleTripClick = (id: string) => {
    setNavigationSource("admin-trip-list")
    navigate(`/admin-trip-list/${id}`)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.paymentStatuses.length > 0) count++ 
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++

    if (selectedFilters.priceRange && (selectedFilters.priceRange[0] > 0 || selectedFilters.priceRange[1] < 20000)) {
      count++
    }

    return count
  }

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

