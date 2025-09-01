"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Box, Typography, Grid, Button, CircularProgress, Chip, useMediaQuery, useTheme } from "@mui/material"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PaginatedBlogResponse, BlogFilters } from "../types/Blog"
import { defaultBlogFilters } from "../types/Blog"
import BlogCard from "../components/BlogCard"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import BlogFilterPanel from "../components/filters/BlogFilterPanel"
import { FilterList } from "@mui/icons-material"

const AdminBlogList: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const navigate = useNavigate()
  const token = localStorage.getItem("accessToken")

  const [blogs, setBlogs] = useState<PaginatedBlogResponse["items"]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<string>("Naujausi pirmi")
  const [selectedFilters, setSelectedFilters] = useState<BlogFilters>(defaultBlogFilters)

  const shouldFetch = useRef(true)

  const fetchBlogs = async () => {
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
          case "Naujausi pirmi":
            sortBy = "publishedAt"
            descending = true
            break
          case "Seniausi pirmi":
            sortBy = "publishedAt"
            descending = false
            break
          case "Pavadinimas A-Z":
            sortBy = "title"
            descending = false
            break
          case "Pavadinimas Z-A":
            sortBy = "title"
            descending = true
            break
          default:
            sortBy = "publishedAt"
            descending = true
        }

        searchParams.append("SortBy", sortBy)
        searchParams.append("Descending", descending.toString())
      }

      if (selectedFilters.category) {
        searchParams.append("Category", selectedFilters.category.toString())
      }

      const queryString = searchParams.toString()

      const response = await axios.get<PaginatedBlogResponse>(`${API_URL}/Blog/paginated?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBlogs(response.data.items)
      setCurrentPage(response.data.pageNumber)
      setPageSize(response.data.pageSize)

      const calculatedTotalPages = Math.ceil(response.data.totalCount / response.data.pageSize)
      setTotalPages(calculatedTotalPages)
    } catch (err: any) {
      setError(err.response?.data?.message || "Nepavyko gauti tinklaraščio įrašų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    shouldFetch.current = true
    return () => {
      shouldFetch.current = false
    }
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [currentPage, pageSize, searchTerm, sortOption, selectedFilters])

  const handleBlogClick = (blog: any) => {
    navigate(`/admin-blog-list/blog/${blog.id}`)
  }

  const handleCreateBlog = () => {
    navigate("/admin-blog-list/create")
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

  const handleApplyFilters = (filters: BlogFilters) => {
    setSelectedFilters(filters)
    setCurrentPage(1)
    setIsFilterDrawerOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.category) count++
    return count
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tinklaraščio įrašai
      </Typography>

      <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Ieškoti tinklaraščio įrašų..." />

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
          <Button variant="contained" color="primary" onClick={handleCreateBlog}>
            Sukurti įrašą
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
            options={["Naujausi pirmi", "Seniausi pirmi", "Pavadinimas A-Z", "Pavadinimas Z-A"]}
            onSort={handleSortChange}
            value={sortOption}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        {!isMobile && (
          <BlogFilterPanel
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            onApplyFilters={handleApplyFilters}
            initialFilters={selectedFilters}
          />
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
          ) : blogs.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {blogs.map((blog) => (
                  <Grid item xs={12} sm={6} md={4} key={blog.id}>
                    <BlogCard blog={blog} onClick={() => handleBlogClick(blog)} />
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
              Tinklaraščio įrašų nerasta
            </Typography>
          )}
        </Box>
      </Box>

      {isMobile && (
        <BlogFilterPanel
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={selectedFilters}
        />
      )}
    </Box>
  )
}

export default AdminBlogList
