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

enum TagCategory {
  TravelFrequency = 1,
  TravelPreference = 2,
  DestinationInterest = 3,
  SpecialRequirements = 4,
  Other = 5,
}

interface ClientTag {
  id: string
  name: string
  category: string
  createdByAgentId: string
}

interface GroupedTagItem {
  category: string
  tags: ClientTag[]
}

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
  refreshTrigger?: boolean | number
}

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

const getCategoryName = (categoryStr: string): string => {
  switch (categoryStr) {
    case "TravelFrequency":
      return "Kelionių dažnumas"
    case "TravelPreference":
      return "Kelionių pomėgiai"
    case "DestinationInterest":
      return "Mėgstamos vietos"
    case "SpecialRequirements":
      return "Specialūs pageidavimai"
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
  const [hasFilters, setHasFilters] = useState(false)

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

      const tags = response.data || []
      setGroupedTags(tags)

      const hasTags = tags.some((group: GroupedTagItem) => group.tags && group.tags.length > 0)
      setHasFilters(hasTags)
    } catch (err) {
      setError("Nepavyko gauti žymeklių.")
      setHasFilters(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const newSelectedTags: { [key: string]: boolean } = {}

    if (initialFilters && initialFilters.categoryFilters) {
      initialFilters.categoryFilters.forEach((filter) => {
        filter.tagIds.forEach((tagId) => {
          newSelectedTags[tagId] = true
        })
      })
    }

    setSelectedTags(newSelectedTags)
  }, [initialFilters])

  const handleTagChange = (tagId: string) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tagId]: !prev[tagId],
    }))
  }

  const handleApply = () => {
    const categoryFilters: CategoryTagFilter[] = []

    groupedTags.forEach((group) => {
      const category = getCategoryEnum(group.category)
      const selectedTagIds = group.tags.filter((tag) => selectedTags[tag.id]).map((tag) => tag.id)

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

  if (!hasFilters && !loading && !isMobile) {
    return null
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

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography color="error" align="left" my={4}>
          {error}
        </Typography>
      ) : groupedTags.length === 0 ? (
        <Typography align="left" my={4}>
          Nėra žymeklių
        </Typography>
      ) : (
        groupedTags.map((group, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: "left" }}>
              {getCategoryName(group.category)}
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
              {group.tags.map((tag) => (
                <FormControlLabel
                  key={tag.id}
                  control={<Checkbox checked={!!selectedTags[tag.id]} onChange={() => handleTagChange(tag.id)} />}
                  label={tag.name}
                  sx={{
                    textAlign: "left",
                    ".MuiFormControlLabel-label": {
                      textAlign: "left",
                      display: "block",
                    },
                  }}
                />
              ))}
            </FormGroup>
            {index < groupedTags.length - 1 && <Divider sx={{ mt: 2 }} />}
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
    <Paper elevation={2} sx={{ borderRadius: 2, height: "fit-content", alignSelf: "flex-start" }}>
      {filterContent}
    </Paper>
  )
}

export default ClientFilterPanel
