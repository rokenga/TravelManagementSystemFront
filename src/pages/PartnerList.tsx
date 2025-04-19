"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Box, Typography, Grid, Button, CircularProgress, Chip, useMediaQuery, useTheme } from "@mui/material"
import { Add, FilterList } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PartnerResponse } from "../types/Partner"
import PartnerCard from "../components/PartnerCard"
import CreatePartnerModal from "../components/CreatePartnerModal"
import { useNavigate } from "react-router-dom"
import CustomSnackbar from "../components/CustomSnackBar"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import PartnerFilterPanel, { type PartnerFilters, defaultPartnerFilters } from "../components/filters/PartnerFilterPanel"

// Interface for paginated response from the backend
interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Define the list state interface
interface PartnerListState {
  page: number
  pageSize: number
  searchTerm: string
  sortOption: string
  filters: PartnerFilters
}

const PartnerListPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const token = localStorage.getItem("accessToken")

  // State for partners data
  const [partners, setPartners] = useState<PartnerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  // List state with defaults
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<string>("Pavadinimas A-Z")
  const [selectedFilters, setSelectedFilters] = useState<PartnerFilters>(defaultPartnerFilters)

  // Ref to track initial mount
  const isInitialMount = useRef(true)
  const shouldFetch = useRef(true)

  // Fetch partners from the backend with all filtering options
  const fetchPartners = async () => {
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
          case "Pavadinimas A-Z":
            sortBy = "name"
            descending = false
            break
          case "Pavadinimas Z-A":
            sortBy = "name"
            descending = true
            break
          case "Naujausi pirmi":
            sortBy = "createdAt"
            descending = true
            break
          case "Seniausi pirmi":
            sortBy = "createdAt"
            descending = false
            break
          default:
            sortBy = "name"
            descending = false
        }

        searchParams.append("SortBy", sortBy)
        searchParams.append("Descending", descending.toString())
      }

      // Add types filter
      if (selectedFilters.types.length > 0) {
        selectedFilters.types.forEach((type) => {
          searchParams.append("Types", type.toString())
        })
      }

      // Add countries filter
      if (selectedFilters.countries.length > 0) {
        selectedFilters.countries.forEach((country) => {
          searchParams.append("Countries", country)
        })
      }

      // Add continents filter
      if (selectedFilters.continents.length > 0) {
        selectedFilters.continents.forEach((continent) => {
          searchParams.append("Continents", continent)
        })
      }

      // Add "my partner" filter
      if (selectedFilters.onlyMine) {
        searchParams.append("OnlyMine", "true")
      }

      // Log the full URL for debugging
      const queryString = searchParams.toString()
      console.log(`Fetching partners with URL: ${API_URL}/Partner/paginated?${queryString}`)

      // Make the API call with the manually constructed query string
      const response = await axios.get<PaginatedResponse<PartnerResponse>>(
        `${API_URL}/Partner/paginated?${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update state with data from the backend
      setPartners(response.data.items)
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
      console.error("Failed to fetch partners:", err)
      setError(err.response?.data?.message || "Nepavyko gauti partnerių sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch - only on mount
  useEffect(() => {
    shouldFetch.current = true
    return () => {
      shouldFetch.current = false
    }
  }, [])

  // Centralized data fetching in a single useEffect
  useEffect(() => {
    fetchPartners()
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters])

  const handlePartnerClick = (partner: PartnerResponse) => {
    // Navigate to partner details page
    navigate(`/partner-list/${partner.id}`)
  }

  const handleAddPartner = () => {
    setCreateModalOpen(true)
  }

  const handleCreateSuccess = () => {
    fetchPartners()
    setSnackbar({
      open: true,
      message: "Partneris sėkmingai sukurtas!",
      severity: "success",
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
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

  const handleApplyFilters = (filters: PartnerFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) // Reset to first page when filtering
    setIsFilterDrawerOpen(false)
  }

  /**
   * Count how many filters are active
   */
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.types.length > 0) count++
    if (selectedFilters.countries.length > 0) count++
    if (selectedFilters.continents.length > 0) count++
    if (selectedFilters.onlyMine) count++
    return count
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Partnerių sąrašas
      </Typography>

      <SearchBar
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Ieškoti pagal pavadinimą, miestą, šalį..."
      />

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
          <Button variant="contained" color="primary" onClick={handleAddPartner}>
            Sukurti partnerį
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
            options={["Pavadinimas A-Z", "Pavadinimas Z-A", "Naujausi pirmi", "Seniausi pirmi"]}
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
          minHeight: partners.length > 0 ? "800px" : "auto",
        }}
      >
        {!isMobile && (
          <Box sx={{ position: "sticky", top: 0, alignSelf: "flex-start", zIndex: 1 }}>
            <PartnerFilterPanel
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
          ) : partners.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {partners.map((partner) => (
                  <Grid item xs={12} sm={6} md={4} key={partner.id}>
                    <PartnerCard partner={partner} onClick={() => handlePartnerClick(partner)} />
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
              Nėra sukurtų partnerių.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Create Partner Modal */}
      <CreatePartnerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />

      {isMobile && (
        <PartnerFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default PartnerListPage
