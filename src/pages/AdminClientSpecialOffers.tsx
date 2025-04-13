"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Box, Typography, Grid, Button, CircularProgress, useTheme, useMediaQuery, Chip } from "@mui/material"
import { FilterList } from "@mui/icons-material"
import SpecialOfferCard from "../components/ClientSpecialOfferCard"
import type { TripResponse } from "../types/ClientTrip"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import ClientSpecialOfferFilterPanel, {
  type ClientSpecialOfferFilters,
} from "../components/filters/ClientSpecialOfferFilterPanel"
import { useNavigation } from "../contexts/NavigationContext"

// Default values for filter state
const defaultFilters: ClientSpecialOfferFilters = {
  categories: [],
  statuses: [],
  destinations: [],
  startDate: null,
  endDate: null,
}

// Define the request body interface
interface SpecialOfferRequestBody {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sortBy?: string
  descending?: boolean
  categories?: string[]
  statuses?: string[]
  destinations?: string[]
  startDate?: string | null
  endDate?: string | null
}

const AdminClientSpecialOffers: React.FC = () => {
  const { savePageState, getPageState, isNavbarNavigation } = useNavigation()
  const [offers, setOffers] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()
  const navigate = useNavigate()
  const isFilterCollapsed = useMediaQuery(theme.breakpoints.down("md"))

  // UI state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  // List state
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Naujausi pirmi")
  const [selectedFilters, setSelectedFilters] = useState<ClientSpecialOfferFilters>(defaultFilters)

  // Function to fetch offers
  const fetchOffers = async (
    page: number,
    size: number,
    search: string,
    filters: ClientSpecialOfferFilters,
    sort: string = sortOption, // Default to current sortOption if not provided
  ) => {
    try {
      setLoading(true)

      // Create request body with proper type
      const requestBody: SpecialOfferRequestBody = {
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
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
      }

      // Add filters
      if (filters.categories && filters.categories.length > 0) {
        requestBody.categories = filters.categories
      }

      if (filters.statuses && filters.statuses.length > 0) {
        requestBody.statuses = filters.statuses
      }

      if (filters.destinations && filters.destinations.length > 0) {
        requestBody.destinations = filters.destinations
      }

      if (filters.startDate) {
        requestBody.startDate = filters.startDate
      }

      if (filters.endDate) {
        requestBody.endDate = filters.endDate
      }

      console.log("Sending request:", requestBody)

      const response = await axios.post(`${API_URL}/ClientTripOfferFacade/paginated`, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      console.log("Response:", response.data)

      // Update state with response data
      setOffers(response.data.items)
      setTotalPages(Math.ceil(response.data.totalCount / response.data.pageSize))

      console.log("Total pages:", Math.ceil(response.data.totalCount / response.data.pageSize))
      console.log("Items count:", response.data.items.length)
    } catch (err) {
      console.error("Error fetching offers:", err)
      setError("Nepavyko gauti klientų specialių pasiūlymų.")
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    // Reset filters if coming from navbar
    if (isNavbarNavigation) {
      setCurrentPage(1)
      setPageSize(25)
      setSearchTerm("")
      setSortOption("Naujausi pirmi")
      setSelectedFilters(defaultFilters)
    } else {
      // Try to restore saved state
      const savedState = getPageState("admin-special-offers")
      if (savedState) {
        if (savedState.page) setCurrentPage(savedState.page)
        if (savedState.pageSize) setPageSize(savedState.pageSize)
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm)
        if (savedState.sortOption) setSortOption(savedState.sortOption)
        if (savedState.filters) setSelectedFilters(savedState.filters)
      }
    }

    // Fetch offers after state is set
    const savedState = getPageState("admin-special-offers")
    setTimeout(() => {
      fetchOffers(
        savedState?.page || 1,
        savedState?.pageSize || 25,
        savedState?.searchTerm || "",
        savedState?.filters || defaultFilters,
        savedState?.sortOption || "Naujausi pirmi",
      )
    }, 0)

    // Save state on unmount
    return () => {
      savePageState("admin-special-offers", {
        page: currentPage,
        pageSize,
        searchTerm,
        sortOption,
        filters: selectedFilters,
      })
    }
  }, [isNavbarNavigation])

  // Handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchOffers(newPage, pageSize, searchTerm, selectedFilters, sortOption)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchOffers(1, newPageSize, searchTerm, selectedFilters, sortOption)
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1)
    fetchOffers(1, pageSize, newSearchTerm, selectedFilters, sortOption)
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    setCurrentPage(1) // Reset to first page when sorting
    fetchOffers(1, pageSize, searchTerm, selectedFilters, option) // Pass the new option directly
  }

  const handleApplyFilters = (filters: ClientSpecialOfferFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1)
    setIsFilterDrawerOpen(false)
    fetchOffers(1, pageSize, searchTerm, filters, sortOption)
  }

  const handleOfferClick = (id: string) => {
    navigate(`/special-offers/${id}`)
  }

  const handleCreateOffer = () => {
    navigate("/special-offers/create")
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.destinations.length > 0) count++
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++
    return count
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Klientų specialūs pasiūlymai
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
            Sukurti naują pasiūlymą
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
            options={["Naujausi pirmi", "Seniausi pirmi", "Pavadinimas A-Z", "Pavadinimas Z-A"]}
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
            <ClientSpecialOfferFilterPanel
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
                    <SpecialOfferCard offer={offer} onClick={() => handleOfferClick(offer.id)} />
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
              Nėra sukurtų specialių pasiūlymų.
            </Typography>
          )}
        </Box>
      </Box>

      {isFilterCollapsed && (
        <ClientSpecialOfferFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default AdminClientSpecialOffers
