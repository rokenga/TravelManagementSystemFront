"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback, useRef } from "react"
import { Box, Typography, Grid, Button, CircularProgress, useMediaQuery, useTheme, Chip } from "@mui/material"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import { useNavigation } from "../contexts/NavigationContext"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import { FilterList } from "@mui/icons-material"
import ClientTagManager from "../components/ClientTagManager"
import ClientCard from "../components/ClientCard"
import ClientFormModal from "../components/ClientFormModal"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import ClientFilterPanel, { type ClientFilters, type CategoryTagFilter } from "../components/filters/ClientFilterPanel"

interface Client {
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  createdAt: Date
  notes?: string
  isOnTrip?: boolean
}

interface ClientQueryParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sortBy?: string
  descending?: boolean
  categoryFilters?: CategoryTagFilter[]
}

interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

interface ClientListState {
  page: number
  pageSize: number
  searchTerm: string
  sortOption: string
  filters: ClientFilters
}

const defaultFilters: ClientFilters = {
  categoryFilters: [],
}

const AdminClientList: React.FC = () => {
  const { savePageState, getPageState, isNavbarNavigation } = useNavigation()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Vardas A-Z")
  const [selectedFilters, setSelectedFilters] = useState<ClientFilters>(defaultFilters)
  const [refreshTrigger, setRefreshTrigger] = useState(0) 

  const navigate = useNavigate()
  const user = useContext(UserContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const isInitialMount = useRef(true)

  const saveCurrentState = useCallback(() => {
    const state: ClientListState = {
      page: currentPage,
      pageSize,
      searchTerm,
      sortOption,
      filters: selectedFilters,
    }
    savePageState("admin-client-list", state)
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters, savePageState])

  useEffect(() => {
    if (isNavbarNavigation) {
      setCurrentPage(1)
      setPageSize(25)
      setSearchTerm("")
      setSortOption("Vardas A-Z")
      setSelectedFilters(defaultFilters)

      fetchClients(1, 25, "", defaultFilters)
      return
    }

    if (isInitialMount.current) {
      isInitialMount.current = false

      const savedState = getPageState("admin-client-list") as ClientListState | null

      if (savedState) {
        if (savedState.page) setCurrentPage(savedState.page)
        if (savedState.pageSize) setPageSize(savedState.pageSize)
        if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm)
        if (savedState.sortOption) setSortOption(savedState.sortOption)
        if (savedState.filters) setSelectedFilters(savedState.filters)

        fetchClients(
          savedState.page || 1,
          savedState.pageSize || 25,
          savedState.searchTerm || "",
          savedState.filters || defaultFilters,
        )
      } else {
        fetchClients(1, 25, "", defaultFilters)
      }
    }
  }, [getPageState, isNavbarNavigation])

  useEffect(() => {
    return () => {
      saveCurrentState()
    }
  }, [saveCurrentState])

  useEffect(() => {
    if (!isInitialMount.current || refreshTrigger > 0) {
      fetchClients(currentPage, pageSize, searchTerm, selectedFilters)
    }
  }, [sortOption, currentPage, pageSize, searchTerm, selectedFilters, refreshTrigger])

  const fetchClients = async (page: number, size: number, search: string, filters: ClientFilters) => {
    try {
      setLoading(true)

      const params: ClientQueryParams = {
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
        sortBy: undefined,
        descending: false,
        categoryFilters: [],
      }

      if (sortOption === "Vardas A-Z") {
        params.sortBy = "name"
        params.descending = false
      } else if (sortOption === "Vardas Z-A") {
        params.sortBy = "name"
        params.descending = true
      } else if (sortOption === "Naujausi pirmi") {
        params.sortBy = "createdat"
        params.descending = true
      } else if (sortOption === "Seniausi pirmi") {
        params.sortBy = "createdat"
        params.descending = false
      }

      if (filters.categoryFilters && filters.categoryFilters.length > 0) {
        params.categoryFilters = filters.categoryFilters
      }

      const response = await axios.post<PaginatedResponse<Client>>(`${API_URL}/Client/search`, params, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setClients(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)

      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setTotalPages(calculatedTotalPages)
    } catch (err: any) {
      setError("Nepavyko gauti klientų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchClients(newPage, pageSize, searchTerm, selectedFilters)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) 
    fetchClients(1, newPageSize, searchTerm, selectedFilters)
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) 
    fetchClients(1, pageSize, newSearchTerm, selectedFilters)
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    setCurrentPage(1)
    fetchClients(1, pageSize, searchTerm, selectedFilters)
  }

  const handleApplyFilters = (filters: ClientFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1)
    fetchClients(1, pageSize, searchTerm, filters)
    setIsFilterDrawerOpen(false)
  }

  const handleClientClick = (clientId: string) => {
    saveCurrentState()
    navigate(`/admin-client-list/${clientId}`)
  }

  const refreshClientTags = () => {
    setRefreshTrigger((prev) => prev + 1) 
  }

  const refreshClientList = () => {
    setCurrentPage(1)
    setRefreshTrigger((prev) => prev + 1)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categoryFilters.length > 0) {
      count += selectedFilters.categoryFilters.length
    }
    return count
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Klientų sąrašas
        </Typography>

        <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Ieškoti klientų..." />

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
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsClientModalOpen(true)}
              sx={{ textTransform: "none" }}
            >
              Sukurti naują klientą
            </Button>

            <Button variant="outlined" color="secondary" onClick={() => setIsTagModalOpen(true)}>
              Tvarkyti žymeklius
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
              options={["Vardas A-Z", "Vardas Z-A", "Naujausi pirmi", "Seniausi pirmi"]}
              onSort={handleSortChange}
              value={sortOption}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          {!isMobile && (
            <ClientFilterPanel
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={selectedFilters}
              refreshTrigger={refreshTrigger}
            />
          )}
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" align="center">
                {error}
              </Typography>
            ) : clients.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {clients.map((client) => (
                    <Grid item xs={12} key={client.id}>
                      <ClientCard client={client} onClick={() => handleClientClick(client.id)} />
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
              <Typography variant="body1" align="center">
                Nėra sukurtų klientų.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <ClientTagManager
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagsUpdated={refreshClientTags}
      />

      <ClientFormModal
        open={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={refreshClientList}
      />

      {isMobile && (
        <ClientFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
          refreshTrigger={refreshTrigger}
        />
      )}
    </Box>
  )
}

export default AdminClientList
