"use client"

import type React from "react"
import { Box, Rating, Typography } from "@mui/material"
import { Star, StarBorder } from "@mui/icons-material"

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  readOnly?: boolean
  size?: "small" | "medium" | "large"
  label?: string
  showEmptyStars?: boolean
  precision?: number
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = "medium",
  label,
  showEmptyStars = true,
  precision = 1,
}) => {
  // Convert null to 0 for display purposes
  const displayValue = value === null ? 0 : value

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Rating
        value={displayValue}
        onChange={(_, newValue) => {
          if (onChange) {
            onChange(newValue)
          }
        }}
        precision={precision}
        readOnly={readOnly}
        size={size}
        emptyIcon={showEmptyStars ? <StarBorder fontSize="inherit" /> : undefined}
        icon={<Star fontSize="inherit" />}
      />
    </Box>
  )
}

export default StarRating
