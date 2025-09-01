"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback, useRef } from "react"
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip,
  Tabs,
  Tab,
} from "@mui/material"
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
import CompanyCard from "../components/CompanyCard"
import ClientFormModal from "../components/ClientFormModal"
import CompanyFormModal from "../components/CompanyFormModal"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import ClientFilterPanel, { type ClientFilters, type CategoryTagFilter } from "../components/filters/ClientFilterPanel"
import type { CompanyResponse } from "../types/Company"

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

interface CompanyQueryParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sortBy?: string
  descending: boolean
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
  activeTab: number
  companyPage: number
  companyPageSize: number
  companySearchTerm: string
  companySortOption: string
}

const defaultFilters: ClientFilters = {
  categoryFilters: [],
}

const AdminClientList: React.FC = () => {
  const { savePageState, getPageState, isNavbarNavigation } = useNavigation()
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  // Client state
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Vardas A-Z")
  const [selectedFilters, setSelectedFilters] = useState<ClientFilters>(defaultFilters)

  // Company state
  const [companySearchTerm, setCompanySearchTerm] = useState<string>("")
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1)
  const [companyPageSize, setCompanyPageSize] = useState(25)
  const [companyTotalPages, setCompanyTotalPages] = useState(1)
  const [companySortOption, setCompanySortOption] = useState<string>("Pavadinimas A-Z")

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState(0) // 0 = Clients, 1 = Companies

  const navigate = useNavigate()
  const user = useContext(UserContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const isInitialMount = useRef(true)

  const saveCurrentState = useCallback(() => {
    const state: ClientListState = {
      page: currentPage,
      pageSize,
      searchTerm,
      sortOption,
      filters: selectedFilters,
      activeTab,
      companyPage: companyCurrentPage,
      companyPageSize,
      companySearchTerm,
      companySortOption,
    }
    savePageState("admin-client-list", state)
  }, [
    currentPage,
    pageSize,
    searchTerm,
    sortOption,
    selectedFilters,
    activeTab,
    companyCurrentPage,
    companyPageSize,
    companySearchTerm,
    companySortOption,
    savePageState,
  ])

  useEffect(() => {
    if (isNavbarNavigation) {
      setCurrentPage(1)
      setPageSize(25)
      setSearchTerm("")
      setSortOption("Vardas A-Z")
      setSelectedFilters(defaultFilters)
      setActiveTab(0)
      setCompanyCurrentPage(1)
      setCompanyPageSize(25)
      setCompanySearchTerm("")
      setCompanySortOption("Pavadinimas A-Z")

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
        if (savedState.activeTab !== undefined) setActiveTab(savedState.activeTab)
        if (savedState.companyPage) setCompanyCurrentPage(savedState.companyPage)
        if (savedState.companyPageSize) setCompanyPageSize(savedState.companyPageSize)
        if (savedState.companySearchTerm !== undefined) setCompanySearchTerm(savedState.companySearchTerm)
        if (savedState.companySortOption) setCompanySortOption(savedState.companySortOption)

        if (savedState.activeTab === 1) {
          fetchCompanies(
            savedState.companyPage || 1,
            savedState.companyPageSize || 25,
            savedState.companySearchTerm || "",
            savedState.companySortOption || "Pavadinimas A-Z",
          )
        } else {
          fetchClients(
            savedState.page || 1,
            savedState.pageSize || 25,
            savedState.searchTerm || "",
            savedState.filters || defaultFilters,
          )
        }
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
      if (activeTab === 0) {
        fetchClients(currentPage, pageSize, searchTerm, selectedFilters)
      } else {
        fetchCompanies(companyCurrentPage, companyPageSize, companySearchTerm, companySortOption)
      }
    }
  }, [
    sortOption,
    currentPage,
    pageSize,
    searchTerm,
    selectedFilters,
    refreshTrigger,
    activeTab,
    companySortOption,
    companyCurrentPage,
    companyPageSize,
    companySearchTerm,
  ])

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

  const fetchCompanies = async (page: number, size: number, search: string, sortOption: string) => {
    try {
      setLoading(true)

      const params: CompanyQueryParams = {
        pageNumber: page,
        pageSize: size,
        searchTerm: search || undefined,
        sortBy: "name",
        descending: false,
      }

      if (sortOption === "Pavadinimas A-Z") {
        params.sortBy = "name"
        params.descending = false
      } else if (sortOption === "Pavadinimas Z-A") {
        params.sortBy = "name"
        params.descending = true
      }

      const response = await axios.post<PaginatedResponse<CompanyResponse>>(`${API_URL}/Company/search`, params, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setCompanies(response.data.items)
      setCompanyCurrentPage(response.data.pageNumber)
      setCompanyPageSize(response.data.pageSize)

      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setCompanyTotalPages(calculatedTotalPages)
    } catch (err: any) {
      setError("Nepavyko gauti įmonių sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setError(null)

    if (newValue === 0) {
      fetchClients(currentPage, pageSize, searchTerm, selectedFilters)
    } else {
      fetchCompanies(companyCurrentPage, companyPageSize, companySearchTerm, companySortOption)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (activeTab === 0) {
      setCurrentPage(newPage)
      fetchClients(newPage, pageSize, searchTerm, selectedFilters)
    } else {
      setCompanyCurrentPage(newPage)
      fetchCompanies(newPage, companyPageSize, companySearchTerm, companySortOption)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (activeTab === 0) {
      setPageSize(newPageSize)
      setCurrentPage(1)
      fetchClients(1, newPageSize, searchTerm, selectedFilters)
    } else {
      setCompanyPageSize(newPageSize)
      setCompanyCurrentPage(1)
      fetchCompanies(1, newPageSize, companySearchTerm, companySortOption)
    }
  }

  const handleSearchChange = (newSearchTerm: string) => {
    if (activeTab === 0) {
      setSearchTerm(newSearchTerm)
      setCurrentPage(1)
      fetchClients(1, pageSize, newSearchTerm, selectedFilters)
    } else {
      setCompanySearchTerm(newSearchTerm)
      setCompanyCurrentPage(1)
      fetchCompanies(1, companyPageSize, newSearchTerm, companySortOption)
    }
  }

  const handleSortChange = (option: string) => {
    if (activeTab === 0) {
      setSortOption(option)
      setCurrentPage(1)
      fetchClients(1, pageSize, searchTerm, selectedFilters)
    } else {
      setCompanySortOption(option)
      setCompanyCurrentPage(1)
      fetchCompanies(1, companyPageSize, companySearchTerm, option)
    }
  }

  const handleApplyFilters = (filters: ClientFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1)
    fetchClients(1, pageSize, searchTerm, filters)
    setIsFilterDrawerOpen(false)
  }

  const handleClientClick = (clientId: string) => {
    saveCurrentState()
    navigate(`/admin-client-list/client/${clientId}`)
  }

  const handleCompanyClick = (companyId: string) => {
    saveCurrentState()
    navigate(`/admin-client-list/company/${companyId}`)
  }

  const refreshClientTags = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const refreshList = () => {
    if (activeTab === 0) {
      setCurrentPage(1)
    } else {
      setCompanyCurrentPage(1)
    }
    setRefreshTrigger((prev) => prev + 1)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.categoryFilters.length > 0) {
      count += selectedFilters.categoryFilters.length
    }
    return count
  }

  const isClientsTab = activeTab === 0
  const isCompaniesTab = activeTab === 1

  const currentSearchTerm = isClientsTab ? searchTerm : companySearchTerm
  const currentSortOption = isClientsTab ? sortOption : companySortOption
  const currentPageSize = isClientsTab ? pageSize : companyPageSize
  const currentTotalPages = isClientsTab ? totalPages : companyTotalPages
  const currentPageNumber = isClientsTab ? currentPage : companyCurrentPage

  const sortOptions = isClientsTab
    ? ["Vardas A-Z", "Vardas Z-A", "Naujausi pirmi", "Seniausi pirmi"]
    : ["Pavadinimas A-Z", "Pavadinimas Z-A"]

  const searchPlaceholder = isClientsTab ? "Ieškoti klientų..." : "Ieškoti įmonių..."

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Kontaktai
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, display: "flex", justifyContent: "center" }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="client company tabs" centered>
            <Tab label="Klientai" />
            <Tab label="Įmonės" />
          </Tabs>
        </Box>

        {/* Search Bar */}
        <SearchBar value={currentSearchTerm} onChange={handleSearchChange} placeholder={searchPlaceholder} />

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
            {isClientsTab && (
              <>
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
              </>
            )}
            {isCompaniesTab && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsCompanyModalOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Sukurti naują įmonę
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <PageSizeSelector
              pageSize={currentPageSize}
              onPageSizeChange={handlePageSizeChange}
              options={[25, 50, 100]}
            />

            {isClientsTab && isMobile && (
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

            <SortMenu options={sortOptions} onSort={handleSortChange} value={currentSortOption} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          {!isMobile && isClientsTab && (
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
            ) : (
              <>
                {isClientsTab && (
                  <>
                    {clients.length > 0 ? (
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
                          <Pagination
                            currentPage={currentPageNumber}
                            totalPages={currentTotalPages}
                            onPageChange={handlePageChange}
                          />
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" align="center">
                        {searchTerm ? "Nerasta klientų pagal paieškos kriterijus." : "Nėra sukurtų klientų."}
                      </Typography>
                    )}
                  </>
                )}

                {isCompaniesTab && (
                  <>
                    {companies.length > 0 ? (
                      <>
                        <Grid container spacing={3}>
                          {companies.map((company) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={company.id}>
                              <CompanyCard company={company} onClick={() => handleCompanyClick(company.id)} />
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
                          <Pagination
                            currentPage={currentPageNumber}
                            totalPages={currentTotalPages}
                            onPageChange={handlePageChange}
                          />
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" align="center">
                        {companySearchTerm ? "Nerasta įmonių pagal paieškos kriterijus." : "Nėra sukurtų įmonių."}
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      <ClientTagManager
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagsUpdated={refreshClientTags}
      />

      <ClientFormModal open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSuccess={refreshList} />

      <CompanyFormModal
        open={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSuccess={refreshList}
      />

      {isMobile && isClientsTab && (
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
