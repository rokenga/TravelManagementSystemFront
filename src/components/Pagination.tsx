"use client"

import type React from "react"
import { Box, Button, Typography } from "@mui/material"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (newPage: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null
  }

  const handlePageChange = (newPage: number) => {
    // Option 1: Instant scrolling (no animation)
    //window.scrollTo(0, 0)

    // Option 2: If you still want smooth scrolling but faster,
    // you can use this custom function instead:
    
    const scrollToTop = () => {
      const currentPosition = window.pageYOffset;
      if (currentPosition > 0) {
        // Faster scroll by using a larger step (adjust the 30 to control speed)
        window.scrollTo(0, Math.max(0, currentPosition - 50));
        window.requestAnimationFrame(scrollToTop);
      }
    };
    scrollToTop();
    

    // Call the original onPageChange function
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

