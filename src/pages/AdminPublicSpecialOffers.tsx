"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Box, Typography, Grid, Button, CircularProgress, useTheme, useMediaQuery, Chip } from "@mui/material"
import { FilterList } from "@mui/icons-material"
import PublicOfferCard from "../components/PublicOfferCard"
import type { TripResponse } from "../types/ClientTrip"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import PublicSpecialOfferFilterPanel, {
  type PublicSpecialOfferFilters,
} from "../components/filters/PublicSpecialOfferFilterPanel"
import { useNavigation } from "../contexts/NavigationContext"

// Define the OfferStatus enum
export enum OfferStatus {
  Active = "Active",
  Expired = "Expired",
  ManuallyDisabled = "ManuallyDisabled",
}

// Default values for filter state
const defaultFilters: PublicSpecialOfferFilters = {
  categories: [],
  statuses: [],
  destinations: [],
  startDate: null,
  endDate: null,
  priceRange: [0, 10000],
  isPromoted: false,
  onlyMine: false,
}

// Define the request body interface
interface PublicOfferRequestBody {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sortBy?: string
  descending?: boolean
  categories?: string[]
  statuses?: string[]
  destinations?: string[]
  onlyMine?: boolean
}

interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

interface PublicOfferListState {
  page: number
  pageSize: number
  searchTerm: string
  sortOption: string
  filters: PublicSpecialOfferFilters
}

const AdminPublicSpecialOffers: React.FC = () => {
  const { savePageState, getPageState, isNavbarNavigation } = useNavigation()
  const [offers, setOffers] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()
  const navigate = useNavigate()
  const isFilterCollapsed = useMediaQuery(theme.breakpoints.down("md"))
  const isInitialMount = useRef(true)

  // UI state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  // List state
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Naujausi pirmi")
  const [selectedFilters, setSelectedFilters] = useState<PublicSpecialOfferFilters>(defaultFilters)

  // Save current state to be restored when coming back
  const saveCurrentState = useCallback(() => {
    const state: PublicOfferListState = {
      page: currentPage,
      pageSize,
      searchTerm,
      sortOption,
      filters: selectedFilters,
    }
    console.log("Saving public offers list state:", state)
    savePageState("admin-public-offers", state)
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters, savePageState])

  useEffect(() => {
    // If this is a navbar navigation, reset all filters
    if (isNavbarNavigation) {
      setCurrentPage(1)
      setPageSize(25)
      setSearchTerm("")
      setSortOption("Naujausi pirmi")
      setSelectedFilters(defaultFilters)

      // Fetch with default values
      fetchOffers(1, 25, "", defaultFilters)
      return
    }

    // Only try to restore state on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false

      const savedState = getPageState("admin-public-offers") as PublicOfferListState | null
      console.log("Retrieved saved public offers list state:", savedState)

      if (savedState) {
        console.log("Restoring state from saved state")
        if (savedState.page) setCurrentPage(savedState.page)
        if (savedState.pageSize) setPageSize(savedState.pageSize)
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm)
        if (savedState.sortOption) setSortOption(savedState.sortOption)
        if (savedState.filters) setSelectedFilters(savedState.filters)

        // Fetch with restored values
        fetchOffers(
          savedState.page || 1,
          savedState.pageSize || 25,
          savedState.searchTerm || "",
          savedState.filters || defaultFilters,
          savedState.sortOption || "Naujausi pirmi",
        )
      } else {
        // No saved state, fetch with defaults
        fetchOffers(1, 25, "", defaultFilters)
      }
    }
  }, [getPageState, isNavbarNavigation])

  // Save state when component unmounts
  useEffect(() => {
    return () => {
      saveCurrentState()
    }
  }, [saveCurrentState])

  /**
   * Fetch the public offers from the API
   */
  const fetchOffers = async (
    page: number,
    size: number,
    search: string,
    filters: PublicSpecialOfferFilters,
    sort: string = sortOption, // Default to current sortOption if not provided
  ) => {
    try {
      console.log("Fetching public offers with params:", { page, size, search, filters, sort })
      setLoading(true)

      const requestBody: PublicOfferRequestBody = {
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
        sortBy: undefined,
        descending: false,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
        destinations: filters.destinations.length > 0 ? filters.destinations : undefined,
        onlyMine: filters.onlyMine || undefined,
      }

      // Add sorting
      if (sort === "Pavadinimas A-Z") {
        requestBody.sortBy = "tripName"
        requestBody.descending = false
      } else if (sort === "Pavadinimas Z-A") {
        requestBody.sortBy = "tripName"
        requestBody.descending = true
      } else if (sort === "Naujausi pirmi") {
        requestBody.sortBy = "createdAt"
        requestBody.descending = true
      } else if (sort === "Seniausi pirmi") {
        requestBody.sortBy = "createdAt"
        requestBody.descending = false
      } else if (sort === "Kaina (didėjančiai)") {
        requestBody.sortBy = "price"
        requestBody.descending = false
      } else if (sort === "Kaina (mažėjančiai)") {
        requestBody.sortBy = "price"
        requestBody.descending = true
      }

      console.log("Sending request body:", requestBody)

      const response = await axios.post<PaginatedResponse<TripResponse>>(
        `${API_URL}/PublicTripOfferFacade/paginated`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      setOffers(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)
      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize))

      console.log("Pagination data:", {
        currentPage: response.data.pageNumber,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: Math.ceil(response.data.totalCount / response.data.pageSize),
      })
    } catch (err: any) {
      console.error("Failed to fetch public offers:", err)
      setError(err.response?.data?.message || "Nepavyko gauti viešų pasiūlymų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const handleOfferClick = (id: string) => {
    navigate(`/public-offers/${id}`)
  }

  const handleCreateOffer = () => {
    navigate("/public-offers/create")
  }

  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`)
    setCurrentPage(newPage)
    fetchOffers(newPage, pageSize, searchTerm, selectedFilters, sortOption)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    console.log(`Changing page size to ${newPageSize}`)
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
    fetchOffers(1, newPageSize, searchTerm, selectedFilters, sortOption)
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) // Reset to first page when searching
    fetchOffers(1, pageSize, newSearchTerm, selectedFilters, sortOption)
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    setCurrentPage(1) // Reset to first page when sorting
    fetchOffers(1, pageSize, searchTerm, selectedFilters, option) // Pass the new option directly
  }

  const handleApplyFilters = (filters: PublicSpecialOfferFilters) => {
    console.log("Applied filters:", filters)
    setSelectedFilters(filters)
    setCurrentPage(1) // Reset to first page when filtering
    fetchOffers(1, pageSize, searchTerm, filters, sortOption)
    setIsFilterDrawerOpen(false)
  }

  /**
   * Count how many filters are active
   */
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.destinations.length > 0) count++
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++
    if (selectedFilters.isPromoted) count++
    if (selectedFilters.onlyMine) count++

    // Check if price range is different from default
    if (selectedFilters.priceRange && (selectedFilters.priceRange[0] > 0 || selectedFilters.priceRange[1] < 10000)) {
      count++
    }

    return count
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vieši specialūs pasiūlymai
      </Typography>

      <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Ieškoti pasiūlymų..." />

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
          <Button variant="contained" color="primary" onClick={handleCreateOffer}>
            Sukurti naują viešą pasiūlymą
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
            value={sortOption}
            onSort={handleSortChange}
            options={[
              "Naujausi pirmi",
              "Seniausi pirmi",
              "Pavadinimas A-Z",
              "Pavadinimas Z-A",
              "Kaina (didėjančiai)",
              "Kaina (mažėjančiai)",
            ]}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          position: "relative",
          minHeight: offers.length > 0 ? "800px" : "auto",
        }}
      >
        {!isFilterCollapsed && (
          <Box sx={{ position: "sticky", top: 0, alignSelf: "flex-start", zIndex: 1 }}>
            <PublicSpecialOfferFilterPanel
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={selectedFilters}
            />
          </Box>
        )}

        <Box sx={{ flex: 1 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          ) : offers.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {offers.map((offer) => (
                  <Grid item xs={12} sm={6} md={4} key={offer.id}>
                    <PublicOfferCard offer={offer} onClick={() => handleOfferClick(offer.id)} />
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
              Nėra sukurtų viešų pasiūlymų.
            </Typography>
          )}
        </Box>
      </Box>

      {isFilterCollapsed && (
        <PublicSpecialOfferFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default AdminPublicSpecialOffers
