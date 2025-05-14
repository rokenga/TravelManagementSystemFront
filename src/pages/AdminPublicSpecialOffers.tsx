"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Box, Typography, Grid, Button, CircularProgress, useTheme, useMediaQuery, Chip } from "@mui/material"
import { FilterList } from "@mui/icons-material"
import AdminPublicOfferCard from "../components/AdminPublicOfferCard"
import type { TripResponse } from "../types/ClientTrip"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import PublicSpecialOfferFilterPanel, {
  type PublicSpecialOfferFilters,
} from "../components/filters/PublicSpecialOfferFilterPanel"
import { useNavigation } from "../contexts/NavigationContext"

export enum OfferStatus {
  Active = "Active",
  Expired = "Expired",
  ManuallyDisabled = "ManuallyDisabled",
}

const defaultFilters: PublicSpecialOfferFilters = {
  categories: [],
  statuses: [],
  destinations: [],
  startDate: null,
  endDate: null,
  priceRange: [0, 10000],
  onlyMine: false,
}

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
  priceFrom?: number
  priceTo?: number
  startDateFrom?: string
  startDateTo?: string
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

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Naujausi pirmi")
  const [selectedFilters, setSelectedFilters] = useState<PublicSpecialOfferFilters>(defaultFilters)

  const saveCurrentState = useCallback(() => {
    const state: PublicOfferListState = {
      page: currentPage,
      pageSize,
      searchTerm,
      sortOption,
      filters: selectedFilters,
    }
    savePageState("admin-public-offers", state)
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters, savePageState])

  useEffect(() => {
    if (isNavbarNavigation) {
      setCurrentPage(1)
      setPageSize(25)
      setSearchTerm("")
      setSortOption("Naujausi pirmi")
      setSelectedFilters(defaultFilters)

      fetchOffers(1, 25, "", defaultFilters)
      return
    }

    if (isInitialMount.current) {
      isInitialMount.current = false

      const savedState = getPageState("admin-public-offers") as PublicOfferListState | null

      if (savedState) {
        if (savedState.page) setCurrentPage(savedState.page)
        if (savedState.pageSize) setPageSize(savedState.pageSize)
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm)
        if (savedState.sortOption) setSortOption(savedState.sortOption)
        if (savedState.filters) setSelectedFilters(savedState.filters)

        fetchOffers(
          savedState.page || 1,
          savedState.pageSize || 25,
          savedState.searchTerm || "",
          savedState.filters || defaultFilters,
          savedState.sortOption || "Naujausi pirmi",
        )
      } else {
        fetchOffers(1, 25, "", defaultFilters)
      }
    }
  }, [getPageState, isNavbarNavigation])

  useEffect(() => {
    return () => {
      saveCurrentState()
    }
  }, [saveCurrentState])

  const fetchOffers = async (
    page: number,
    size: number,
    search: string,
    filters: PublicSpecialOfferFilters,
    sort: string = sortOption, 
  ) => {
    try {
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

      if (filters.priceRange[0] > 0) {
        requestBody.priceFrom = filters.priceRange[0]
      }

      if (filters.priceRange[1] < 10000) {
        requestBody.priceTo = filters.priceRange[1]
      }

      if (filters.startDate) {
        requestBody.startDateFrom = filters.startDate
      }

      if (filters.endDate) {
        requestBody.startDateTo = filters.endDate
      }

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
    } catch (err: any) {
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
    setCurrentPage(1) 
    fetchOffers(1, pageSize, searchTerm, selectedFilters, option) 
  }

  const handleApplyFilters = (filters: PublicSpecialOfferFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1) 
    fetchOffers(1, pageSize, searchTerm, filters, sortOption)
    setIsFilterDrawerOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categories.length > 0) count++
    if (selectedFilters.statuses.length > 0) count++
    if (selectedFilters.destinations.length > 0) count++
    if (selectedFilters.startDate) count++
    if (selectedFilters.endDate) count++
    if (selectedFilters.onlyMine) count++

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
                    <AdminPublicOfferCard offer={offer} onClick={() => handleOfferClick(offer.id)} />
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
