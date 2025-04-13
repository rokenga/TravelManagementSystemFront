"use client"

import type React from "react"
import { Box, Button, Paper, useTheme, useMediaQuery } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import AddIcon from "@mui/icons-material/Add"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import DownloadIcon from "@mui/icons-material/Download"
import UpdateIcon from "@mui/icons-material/Update"
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
  onChangeStatus?: () => void
  onConvertToTrip?: () => void
  onClone?: () => void
  onPreviewPdf?: () => void
  onDownloadPdf?: () => void
  showEditButton?: boolean
  showDeleteButton?: boolean
  showTagButton?: boolean
  showCreateTripButton?: boolean
  showCreateOfferButton?: boolean
  showChangeStatusButton?: boolean
  showConvertToTripButton?: boolean
  showCloneButton?: boolean
  showPdfButtons?: boolean
  pdfLoading?: boolean
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
  onChangeStatus,
  onConvertToTrip,
  onClone,
  onPreviewPdf,
  onDownloadPdf,
  showEditButton = false,
  showDeleteButton = false,
  showTagButton = false,
  showCreateTripButton = false,
  showCreateOfferButton = false,
  showChangeStatusButton = false,
  showConvertToTripButton = false,
  showCloneButton = false,
  showPdfButtons = false,
  pdfLoading = false,
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

  // Helper function to render buttons in the correct order
  const renderActionButtons = () => {
    const buttons = []

    // Client-specific buttons (furthest from right)
    if (showCreateTripButton && onCreateTrip) {
      buttons.push(
        <Button
          key="create-trip"
          variant="outlined"
          color="primary"
          startIcon={<FlightTakeoffIcon />}
          onClick={onCreateTrip}
          sx={{ textTransform: "none" }}
        >
          Sukurti kelionę
        </Button>,
      )
    }

    if (showCreateOfferButton && onCreateOffer) {
      buttons.push(
        <Button
          key="create-offer"
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateOffer}
          sx={{ textTransform: "none" }}
        >
          Sukurti pasiūlymą
        </Button>,
      )
    }

    if (showTagButton && onTagManage) {
      buttons.push(
        <Button
          key="tag-manage"
          variant="outlined"
          color="primary"
          startIcon={<LocalOfferIcon />}
          onClick={onTagManage}
          sx={{ textTransform: "none" }}
        >
          Tvarkyti žymeklius
        </Button>,
      )
    }

    // Trip-specific buttons
    if (showPdfButtons) {
      buttons.push(
        <Box key="pdf-buttons" sx={{ display: "flex" }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={onPreviewPdf}
            startIcon={<PictureAsPdfIcon />}
            disabled={pdfLoading}
            sx={{
              textTransform: "none",
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: "none",
            }}
          >
            {pdfLoading ? "Ruošiamas..." : "Peržiūrėti PDF"}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={onDownloadPdf}
            startIcon={<DownloadIcon />}
            disabled={pdfLoading}
            sx={{
              textTransform: "none",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            {pdfLoading ? "Ruošiamas..." : "Atsisiųsti"}
          </Button>
        </Box>,
      )
    }

    if (showCloneButton && onClone) {
      buttons.push(
        <Button
          key="clone"
          variant="outlined"
          color="primary"
          startIcon={<FlightTakeoffIcon />}
          onClick={onClone}
          sx={{ textTransform: "none" }}
        >
          Klonuoti
        </Button>,
      )
    }

    if (showChangeStatusButton && onChangeStatus) {
      buttons.push(
        <Button
          key="change-status"
          variant="outlined"
          color="primary"
          startIcon={<UpdateIcon />}
          onClick={onChangeStatus}
          sx={{ textTransform: "none" }}
        >
          Keisti statusą
        </Button>,
      )
    }

    if (showConvertToTripButton && onConvertToTrip) {
      buttons.push(
        <Button
          key="convert-to-trip"
          variant="outlined"
          color="primary"
          startIcon={<FlightTakeoffIcon />}
          onClick={onConvertToTrip}
          sx={{ textTransform: "none" }}
        >
          Paversti į kelionę
        </Button>,
      )
    }

    // Common buttons (closest to right)
    if (showEditButton && onEdit) {
      buttons.push(
        <Button
          key="edit"
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={onEdit}
          sx={{ textTransform: "none" }}
        >
          Redaguoti
        </Button>,
      )
    }

    if (showDeleteButton && onDelete) {
      buttons.push(
        <Button
          key="delete"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          sx={{ textTransform: "none" }}
        >
          Ištrinti
        </Button>,
      )
    }

    return buttons
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
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "background.paper",
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
        {renderActionButtons()}
        {children}
      </Box>
    </Paper>
  )
}

export default ActionBar
