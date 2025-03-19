"use client"

import type React from "react"
import { FormControl, Select, MenuItem, type SelectChangeEvent, Box, Typography } from "@mui/material"

interface PageSizeSelectorProps {
  pageSize: number
  onPageSizeChange: (newPageSize: number) => void
  options: number[]
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({ pageSize, onPageSizeChange, options }) => {
  const handleChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(Number(event.target.value))
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="body2" sx={{ mr: 1, display: { xs: "none", sm: "block" } }}>
        Rodyti po:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          id="page-size-select"
          value={pageSize}
          onChange={handleChange}
          variant="outlined"
          displayEmpty
          sx={{ height: 36 }}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default PageSizeSelector

