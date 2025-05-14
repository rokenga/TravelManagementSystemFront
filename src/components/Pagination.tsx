"use client"

import type React from "react"
import { Box, Button, Typography } from "@mui/material"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (newPage: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null
  }

  const handlePageChange = (newPage: number) => {

    
    const scrollToTop = () => {
      const currentPosition = window.pageYOffset;
      if (currentPosition > 0) {
        window.scrollTo(0, Math.max(0, currentPosition - 50));
        window.requestAnimationFrame(scrollToTop);
      }
    };
    scrollToTop();
    

    onPageChange(newPage)
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        variant="outlined"
        sx={{ mx: 1 }}
      >
        Ankstesnis
      </Button>

      <Typography variant="body2" sx={{ mx: 2 }}>
        Puslapis {currentPage} iš {totalPages}
      </Typography>

      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        variant="outlined"
        sx={{ mx: 1 }}
      >
        Kitas
      </Button>
    </Box>
  )
}

export default Pagination

