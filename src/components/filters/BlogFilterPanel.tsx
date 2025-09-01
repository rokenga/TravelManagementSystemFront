"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Drawer,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
} from "@mui/material"
import { BlogCategory, type BlogFilters, defaultBlogFilters } from "../../types/Blog"

interface BlogFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: BlogFilters) => void
  initialFilters?: BlogFilters
}

const getCategoryName = (category: BlogCategory): string => {
  switch (category) {
    case BlogCategory.Europe:
      return "Europa"
    case BlogCategory.Asia:
      return "Azija"
    case BlogCategory.Africa:
      return "Afrika"
    case BlogCategory.Australia:
      return "Australija"
    case BlogCategory.Advice:
      return "Patarimai"
    case BlogCategory.Inspiration:
      return "Įkvėpimas"
    default:
      return category
  }
}

const BlogFilterPanel: React.FC<BlogFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters = defaultBlogFilters,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [filters, setFilters] = useState<BlogFilters>(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const handleApply = () => {
    onApplyFilters(filters)
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setFilters(defaultBlogFilters)
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : "300px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ textAlign: "left" }}>
          Filtrai
        </Typography>
        <Button size="small" onClick={handleReset}>
          Išvalyti
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Paieška"
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          variant="outlined"
          size="small"
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Kategorija</InputLabel>
          <Select
            value={filters.category || ""}
            label="Kategorija"
            onChange={(e) => setFilters({ ...filters, category: e.target.value as BlogCategory || undefined })}
          >
            <MenuItem value="">Visos kategorijos</MenuItem>
            {Object.values(BlogCategory).map((category) => (
              <MenuItem key={category} value={category}>
                {getCategoryName(category)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Rūšiuoti pagal</InputLabel>
          <Select
            value={filters.sortBy}
            label="Rūšiuoti pagal"
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <MenuItem value="publishedAt">Publikavimo data</MenuItem>
            <MenuItem value="createdAt">Sukūrimo data</MenuItem>
            <MenuItem value="title">Pavadinimas</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.descending}
              onChange={(e) => setFilters({ ...filters, descending: e.target.checked })}
            />
          }
          label="Mažėjančia tvarka"
        />
      </Box>

      <Button variant="contained" color="primary" fullWidth onClick={handleApply}>
        Taikyti filtrus
      </Button>
    </Box>
  )

  return isMobile ? (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      {filterContent}
    </Drawer>
  ) : (
    <Paper elevation={2} sx={{ borderRadius: 2, height: "fit-content", alignSelf: "flex-start" }}>
      {filterContent}
    </Paper>
  )
}

export default BlogFilterPanel
