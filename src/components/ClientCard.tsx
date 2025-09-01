"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material"
import { Email, Phone, Notes, LocalOffer, SwapHoriz, Business } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import TagManagementModal from "./TagManagementModal"
import { API_URL } from "../Utils/Configuration"
import type { ClientResponse } from "../types/Client"

enum TagCategory {
  DestinationInterest = "DestinationInterest",
  Other = "Other",
  SpecialRequirements = "SpecialRequirements",
  TravelFrequency = "TravelFrequency",
  TravelPreference = "TravelPreference",
}

interface ClientTagAssignmentResponse {
  clientId: string
  tagId: string
  tagName: string
  category: TagCategory
  assignedByAgentId: string
}

interface ClientCardProps {
  client: ClientResponse
  onClick?: (clientId: string) => void
}

const getAvatarColor = (name: string) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
  const charCode = name.charCodeAt(0)
  return colors[charCode % colors.length]
}

const truncateNotes = (notes: string, maxLength = 70) => {
  if (notes.length <= maxLength) return notes
  return notes.slice(0, maxLength) + "..."
}

const categoryColors: Record<TagCategory, string> = {
  [TagCategory.DestinationInterest]: "#FFA726",
  [TagCategory.Other]: "#66BB6A",
  [TagCategory.SpecialRequirements]: "#42A5F5",
  [TagCategory.TravelFrequency]: "#EC407A",
  [TagCategory.TravelPreference]: "#AB47BC",
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const navigate = useNavigate()
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [clientTags, setClientTags] = useState<ClientTagAssignmentResponse[]>([])

  const fetchClientTags = async () => {
    try {
      const response = await axios.get<ClientTagAssignmentResponse[]>(`${API_URL}/ClientTagAssignment/${client.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClientTags(response.data)
    } catch (error) {}
  }

  useEffect(() => {
    const fetchClientTags = async () => {
      try {
        const response = await axios.get<ClientTagAssignmentResponse[]>(`${API_URL}/ClientTagAssignment/${client.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })

        setClientTags(response.data)
      } catch (error) {}
    }

    fetchClientTags()
  }, [client.id])

  const handleTagClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsTagModalOpen(true)
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(client.id)
    } else {
      navigate(`/clients/${client.id}`)
    }
  }

  const theme = useTheme()
  const isHalfWidth = useMediaQuery(theme.breakpoints.down("md"))

  return (
    <>
      <Card
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: 6,
          },
          position: "relative",
        }}
      >
        <CardActionArea onClick={handleCardClick}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "flex-start",
              py: 2,
              px: 2,
              position: "relative",
            }}
          >
            <Avatar
              sx={{
                bgcolor: getAvatarColor(`${client.name} ${client.surname}`),
                width: 48,
                height: 48,
              }}
            >
              {client.name[0]}
              {client.surname[0]}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, ml: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6">
                    {client.name} {client.surname}
                  </Typography>
                  {client.isTransferred && client.transferredFromAgentName && (
                    <Tooltip title={`Perkeltas iš: ${client.transferredFromAgentName}`}>
                      <Chip
                        icon={<SwapHoriz />}
                        label="Perkeltas"
                        size="small"
                        color="info"
                        sx={{
                          ml: 1,
                          fontSize: "0.7rem",
                        }}
                      />
                    </Tooltip>
                  )}
                  {client.companyName && (
                    <Tooltip title={`Dirba: ${client.companyName}`}>
                      <Chip
                        icon={<Business />}
                        label={client.companyName}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{
                          ml: 1,
                          fontSize: "0.7rem",
                          maxWidth: "150px",
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: isHalfWidth ? "none" : "flex", gap: 1, mr: 4 }}>
                  {clientTags.slice(0, 3).map((tag) => (
                    <Chip
                      key={`${client.id}-${tag.tagId}`}
                      label={tag.tagName}
                      size="small"
                      sx={{
                        backgroundColor: categoryColors[tag.category],
                        color: "white",
                        maxWidth: "150px",
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  ))}
                  {clientTags.length > 4 && (
                    <Chip
                      key={`${client.id}-more-tags`}
                      label={`+${clientTags.length - 4}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                  <Email fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {client.email}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                  <Phone fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {client.phoneNumber}
                  </Typography>
                </Box>
                {client.occupation && (
                  <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontStyle: "italic",
                      }}
                    >
                      {client.occupation}
                    </Typography>
                  </Box>
                )}
                {client.notes && (
                  <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", minWidth: 0, flex: 1 }}>
                    <Notes fontSize="small" sx={{ mr: 0.5, color: "text.secondary", flexShrink: 0 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncateNotes(client.notes)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>

        <IconButton size="small" sx={{ position: "absolute", top: 8, right: 8 }} onClick={handleTagClick}>
          <LocalOffer />
        </IconButton>
      </Card>
      <TagManagementModal
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        clientId={client.id}
        clientTags={clientTags.map((t) => ({
          id: t.tagId,
          name: t.tagName,
          category: t.category,
        }))}
        onTagsUpdated={fetchClientTags}
      />
    </>
  )
}

export default ClientCard
