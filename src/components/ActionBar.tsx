"use client"

import type React from "react"
import { Box, Button, Paper, useTheme, useMediaQuery } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import AddIcon from "@mui/icons-material/Add"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import { useNavigate } from "react-router-dom"
import { useNavigation } from "../contexts/NavigationContext"

interface ActionBarProps {
  title?: string
  backUrl?: string
  children?: React.ReactNode
  showBackButton?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onTagManage?: () => void
  onCreateTrip?: () => void
  onCreateOffer?: () => void
  showEditButton?: boolean
  showDeleteButton?: boolean
  showTagButton?: boolean
  showCreateTripButton?: boolean
  showCreateOfferButton?: boolean
  onBackClick?: () => void
}

const ActionBar: React.FC<ActionBarProps> = ({
  title,
  backUrl,
  children,
  showBackButton = true,
  onEdit,
  onDelete,
  onTagManage,
  onCreateTrip,
  onCreateOffer,
  showEditButton = false,
  showDeleteButton = false,
  showTagButton = false,
  showCreateTripButton = false,
  showCreateOfferButton = false,
  onBackClick,
}) => {
  const navigate = useNavigate()
  const { navigateBack, previousPath } = useNavigation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else if (previousPath) {
      navigateBack()
    } else if (backUrl) {
      navigate(backUrl)
    } else {
      navigate("/")
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 2,
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {showBackButton && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ textTransform: "none" }}>
            Grįžti atgal
          </Button>
        )}
        {title && (
          <Box component="h2" sx={{ m: 0, typography: "h6" }}>
            {title}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: isMobile ? "flex-start" : "flex-end",
          flex: 1,
        }}
      >
        {showCreateTripButton && onCreateTrip && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<FlightTakeoffIcon />}
            onClick={onCreateTrip}
            sx={{ textTransform: "none" }}
          >
            Sukurti kelionę
          </Button>
        )}
        {showCreateOfferButton && onCreateOffer && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onCreateOffer}
            sx={{ textTransform: "none" }}
          >
            Sukurti pasiūlymą
          </Button>
        )}
        {showTagButton && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LocalOfferIcon />}
            onClick={onTagManage}
            sx={{ textTransform: "none" }}
          >
            Tvarkyti žymeklius
          </Button>
        )}
        {showEditButton && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ textTransform: "none" }}
          >
            Redaguoti
          </Button>
        )}
        {showDeleteButton && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            sx={{ textTransform: "none" }}
          >
            Ištrinti
          </Button>
        )}
        {children}
      </Box>
    </Paper>
  )
}

export default ActionBar

