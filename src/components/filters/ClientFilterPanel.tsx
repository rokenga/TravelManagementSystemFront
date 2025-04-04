"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Drawer,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"

// Define the tag category enum to match backend
enum TagCategory {
  TravelFrequency = 1,
  TravelPreference = 2,
  DestinationInterest = 3,
  SpecialRequirements = 4,
  Other = 5,
}

// Interface for a single tag
interface ClientTag {
  id: string
  name: string
  category: string
  createdByAgentId: string
}

// Interface for grouped tags - updated to match actual API response
interface GroupedTagItem {
  category: string
  tags: ClientTag[]
}

// Interface for category filter that will be sent to backend
export interface CategoryTagFilter {
  category: TagCategory
  tagIds: string[]
}

export interface ClientFilters {
  categoryFilters: CategoryTagFilter[]
}

interface ClientFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: ClientFilters) => void
  initialFilters?: ClientFilters
  refreshTrigger?: boolean
}

// Helper function to get category enum from string
const getCategoryEnum = (categoryStr: string): TagCategory => {
  switch (categoryStr) {
    case "TravelFrequency":
      return TagCategory.TravelFrequency
    case "TravelPreference":
      return TagCategory.TravelPreference
    case "DestinationInterest":
      return TagCategory.DestinationInterest
    case "SpecialRequirements":
      return TagCategory.SpecialRequirements
    case "Other":
      return TagCategory.Other
    default:
      return TagCategory.Other
  }
}

// Helper function to get category name in Lithuanian
const getCategoryName = (categoryStr: string): string => {
  switch (categoryStr) {
    case "TravelFrequency":
      return "Kelionių dažnumas"
    case "TravelPreference":
      return "Kelionių preferencijos"
    case "DestinationInterest":
      return "Domina kryptys"
    case "SpecialRequirements":
      return "Specialūs reikalavimai"
    case "Other":
      return "Kita"
    default:
      return "Nežinoma kategorija"
  }
}

const ClientFilterPanel: React.FC<ClientFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters = { categoryFilters: [] },
  refreshTrigger,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [groupedTags, setGroupedTags] = useState<GroupedTagItem[]>([])
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch grouped tags on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchGroupedTags()
  }, [refreshTrigger])

  const fetchGroupedTags = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const response = await axios.get(`${API_URL}/ClientTag/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Log the response to see its structure
      console.log("Grouped tags response:", response.data)

      // Ensure we're setting the data in the correct format
      setGroupedTags(response.data || [])
    } catch (err) {
      console.error("Failed to fetch grouped tags:", err)
      setError("Nepavyko gauti žymeklių.")
    } finally {
      setLoading(false)
    }
  }

  // Initialize selected tags from initialFilters
  useEffect(() => {
    const newSelectedTags: { [key: string]: boolean } = {}

    initialFilters.categoryFilters.forEach((filter) => {
      filter.tagIds.forEach((tagId) => {
        newSelectedTags[tagId] = true
      })
    })

    setSelectedTags(newSelectedTags)
  }, [initialFilters])

  const handleTagChange = (tagId: string) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tagId]: !prev[tagId],
    }))
  }

  const handleApply = () => {
    // Construct the CategoryFilters array for the backend
    const categoryFilters: CategoryTagFilter[] = []

    // For each category that has tags
    groupedTags.forEach((group) => {
      // Get the category enum from the string
      const category = getCategoryEnum(group.category)

      // Get all selected tag IDs for this category
      const selectedTagIds = group.tags.filter((tag) => selectedTags[tag.id]).map((tag) => tag.id)

      // Only add the category if at least one tag is selected
      if (selectedTagIds.length > 0) {
        categoryFilters.push({
          category,
          tagIds: selectedTagIds,
        })
      }
    })

    onApplyFilters({ categoryFilters })
    if (isMobile) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedTags({})
  }

  const filterContent = (
    <Box sx={{ p: 2, width: isMobile ? "auto" : "300px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Filtrai</Typography>
        <Button size="small" onClick={handleReset}>
          Išvalyti
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" my={4}>
          {error}
        </Typography>
      ) : groupedTags.length === 0 ? (
        <Typography align="center" my={4}>
          Nėra žymeklių
        </Typography>
      ) : (
        // Render each category and its tags
        groupedTags.map((group, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {getCategoryName(group.category)}
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
              {group.tags.map((tag) => (
                <FormControlLabel
                  key={tag.id}
                  control={<Checkbox checked={!!selectedTags[tag.id]} onChange={() => handleTagChange(tag.id)} />}
                  label={tag.name}
                />
              ))}
            </FormGroup>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))
      )}

      <Button variant="contained" color="primary" fullWidth onClick={handleApply} disabled={loading}>
        Taikyti filtrus
      </Button>
    </Box>
  )

  return isMobile ? (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      {filterContent}
    </Drawer>
  ) : (
    <Paper elevation={2} sx={{ borderRadius: 2 }}>
      {filterContent}
    </Paper>
  )
}

export default ClientFilterPanel

