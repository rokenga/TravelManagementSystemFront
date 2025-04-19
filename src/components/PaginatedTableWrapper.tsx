"use client"

import type React from "react"
import { Box, Typography, CircularProgress } from "@mui/material"
import Pagination from "./Pagination"
import PageSizeSelector from "./PageSizeSelector"

interface PaginatedTableWrapperProps<T> {
  // Data can now be a PaginatedResponse or null if still loading
  data: {
    items: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
  } | null
  renderTable: (items: T[]) => React.ReactNode
  title?: string
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  loading?: boolean
  error?: string | null
}

function PaginatedTableWrapper<T>({
  data,
  renderTable,
  title,
  pageSizeOptions = [25, 50, 100],
  onPageChange,
  onPageSizeChange,
  loading = false,
  error = null,
}: PaginatedTableWrapperProps<T>) {
  // Calculate total pages based on the response data
  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1
  const currentPage = data?.pageNumber || 1
  const pageSize = data?.pageSize || pageSizeOptions[0]
  const items = data?.items || []
  const totalCount = data?.totalCount || 0

  return (
    <Box>
      {/* Header with count and page size selector */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {title}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Viso: {totalCount} {title?.toLowerCase() || "įrašų"}
          </Typography>
        </Box>
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} options={pageSizeOptions} />
      </Box>

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">
          {error}
        </Typography>
      ) : (
        <>
          {/* Render the table with items from the paginated response */}
          {renderTable(items)}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Box sx={{ mt: 3 }}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default PaginatedTableWrapper
