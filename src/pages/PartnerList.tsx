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

interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

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

  const [partners, setPartners] = useState<PartnerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<string>("Pavadinimas A-Z")
  const [selectedFilters, setSelectedFilters] = useState<PartnerFilters>(defaultPartnerFilters)

  const isInitialMount = useRef(true)
  const shouldFetch = useRef(true)

  const fetchPartners = async () => {
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

      if (selectedFilters.types.length > 0) {
        selectedFilters.types.forEach((type) => {
          searchParams.append("Types", type.toString())
        })
      }

      if (selectedFilters.countries.length > 0) {
        selectedFilters.countries.forEach((country) => {
          searchParams.append("Countries", country)
        })
      }

      if (selectedFilters.continents.length > 0) {
        selectedFilters.continents.forEach((continent) => {
          searchParams.append("Continents", continent)
        })
      }

      if (selectedFilters.onlyMine) {
        searchParams.append("OnlyMine", "true")
      }

      const queryString = searchParams.toString()

      const response = await axios.get<PaginatedResponse<PartnerResponse>>(
        `${API_URL}/Partner/paginated?${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setPartners(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)

      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setTotalPages(calculatedTotalPages)

    } catch (err: any) {
      setError(err.response?.data?.message || "Nepavyko gauti partnerių sąrašo.")
    } finally {
      setLoading(false)
      setTimeout(() => {
        setIsInitialLoading(false)
      }, 1000)
    }
  }

  useEffect(() => {
    shouldFetch.current = true
    return () => {
      shouldFetch.current = false
    }
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters])

  const handlePartnerClick = (partner: PartnerResponse) => {
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

  const handleApplyFilters = (filters: PartnerFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1)
    setIsFilterDrawerOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.types.length > 0) count++
    if (selectedFilters.countries.length > 0) count++
    if (selectedFilters.continents.length > 0) count++
    if (selectedFilters.onlyMine) count++
    return count
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
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

        <Box sx={{ display: "flex", gap: 3 }}>
          {!isMobile && (
            <PartnerFilterPanel
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={selectedFilters}
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
            ) : partners.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {partners.map((partner) => (
                    <Grid item xs={12} sm={6} md={4} key={partner.id}>
                      <PartnerCard partner={partner} onClick={() => handlePartnerClick(partner)} />
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
                Partnerių nerasta
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <CreatePartnerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

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
