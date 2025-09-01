"use client"

import type React from "react"
import { useState } from "react"
import { Box, Button, Paper, useTheme, useMediaQuery, Menu, MenuItem, IconButton } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import AddIcon from "@mui/icons-material/Add"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import DownloadIcon from "@mui/icons-material/Download"
import UpdateIcon from "@mui/icons-material/Update"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import RateReviewIcon from "@mui/icons-material/RateReview"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { useNavigate } from "react-router-dom"
import { useNavigation } from "../contexts/NavigationContext"
import SecurityIcon from "@mui/icons-material/Security"
import VpnKeyIcon from "@mui/icons-material/VpnKey"

interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  color?: "primary" | "error"
  variant?: "contained" | "outlined"
}

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
  showReviewButton?: boolean
  hasReview?: boolean
  onCreateReview?: () => void
  onViewReview?: () => void
  showReset2FAButton?: boolean
  onReset2FA?: () => void
  showReservationsButton?: boolean
  onViewReservations?: () => void
  //  Added props for login information update functionality
  showUpdateLoginButton?: boolean
  onUpdateLogin?: () => void
}

const ActionBar: React.FC<ActionBarProps> = ({
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
  showReviewButton = false,
  hasReview = false,
  onCreateReview,
  onViewReview,
  showReset2FAButton = false,
  onReset2FA,
  showReservationsButton = false,
  onViewReservations,
  //  Added new props for login update functionality
  showUpdateLoginButton = false,
  onUpdateLogin,
}) => {
  const navigate = useNavigate()
  const { navigateBack, previousPath } = useNavigation()

  const isCompact = useMediaQuery("(max-width:1199px)")

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

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

  const getMenuItems = () => {
    const items = []

    if (showReset2FAButton && onReset2FA) {
      items.push({
        key: "reset-2fa",
        label: "Atstatyti 2FA",
        icon: <SecurityIcon fontSize="small" />,
        onClick: onReset2FA,
      })
    }

    if (showReviewButton) {
      if (hasReview && onViewReview) {
        items.push({
          key: "view-review",
          label: "Peržiūrėti atsiliepimą",
          icon: <VisibilityIcon fontSize="small" />,
          onClick: onViewReview,
        })
      } else if (onCreateReview) {
        items.push({
          key: "create-review",
          label: "Sukurti atsiliepimą",
          icon: <RateReviewIcon fontSize="small" />,
          onClick: onCreateReview,
        })
      }
    }

    if (showPdfButtons) {
      items.push({
        key: "preview-pdf",
        label: "Peržiūrėti PDF",
        icon: <PictureAsPdfIcon fontSize="small" />,
        onClick: onPreviewPdf,
        disabled: pdfLoading,
      })
      items.push({
        key: "download-pdf",
        label: "Atsisiųsti PDF",
        icon: <DownloadIcon fontSize="small" />,
        onClick: onDownloadPdf,
        disabled: pdfLoading,
      })
    }

    if (showCloneButton && onClone) {
      items.push({
        key: "clone",
        label: "Klonuoti",
        icon: <FlightTakeoffIcon fontSize="small" />,
        onClick: onClone,
      })
    }

    if (showChangeStatusButton && onChangeStatus) {
      items.push({
        key: "change-status",
        label: "Keisti statusą",
        icon: <UpdateIcon fontSize="small" />,
        onClick: onChangeStatus,
      })
    }

    if (showReservationsButton && onViewReservations) {
      items.push({
        key: "view-reservations",
        label: "Rezervacijos",
        icon: <VisibilityIcon fontSize="small" />,
        onClick: onViewReservations,
      })
    }

    if (showConvertToTripButton && onConvertToTrip) {
      items.push({
        key: "convert-to-trip",
        label: "Paversti į kelionę",
        icon: <FlightTakeoffIcon fontSize="small" />,
        onClick: onConvertToTrip,
      })
    }

    if (showTagButton && onTagManage) {
      items.push({
        key: "tag-manage",
        label: "Tvarkyti žymeklius",
        icon: <LocalOfferIcon fontSize="small" />,
        onClick: onTagManage,
      })
    }

    if (showCreateTripButton && onCreateTrip) {
      items.push({
        key: "create-trip",
        label: "Sukurti kelionę",
        icon: <FlightTakeoffIcon fontSize="small" />,
        onClick: onCreateTrip,
      })
    }

    if (showCreateOfferButton && onCreateOffer) {
      items.push({
        key: "create-offer",
        label: "Sukurti pasiūlymą",
        icon: <AddIcon fontSize="small" />,
        onClick: onCreateOffer,
      })
    }

    //  Added update login button to menu items as a primary action
    if (showUpdateLoginButton && onUpdateLogin) {
      items.push({
        key: "update-login",
        label: "Pakeisti prisijungimo informaciją",
        icon: <VpnKeyIcon fontSize="small" />,
        onClick: onUpdateLogin,
        color: "primary" as const,
        variant: "outlined" as const,
      })
    }

    if (showEditButton && onEdit) {
      items.push({
        key: "edit",
        label: "Redaguoti",
        icon: <EditIcon fontSize="small" />,
        onClick: onEdit,
        color: "primary" as const,
        variant: "contained" as const,
      })
    }

    if (showDeleteButton && onDelete) {
      items.push({
        key: "delete",
        label: "Ištrinti",
        icon: <DeleteIcon fontSize="small" />,
        onClick: onDelete,
        color: "error" as const,
        variant: "contained" as const,
      })
    }

    return items
  }

  const menuItems = getMenuItems()

  const renderDesktopButtons = () => {
    const buttons: MenuItem[] = []
    const primaryButtons: MenuItem[] = []

    menuItems.forEach((item) => {
      //  Added update-login to primary buttons section to appear next to edit/delete
      if (item.key === "edit" || item.key === "delete" || item.key === "update-login") {
        primaryButtons.push(item)
      } else {
        buttons.push(item)
      }
    })

    //  Updated sorting to ensure proper order: update-login, edit, delete
    primaryButtons.sort((a, b) => {
      if (a.key === "update-login") return -1
      if (b.key === "update-login") return 1
      if (a.key === "edit") return -1
      if (b.key === "edit") return 1
      return 0
    })

    const secondaryButtons = buttons.map((item) => (
      <Button
        key={item.key}
        variant="outlined"
        color="primary"
        startIcon={item.icon}
        onClick={item.onClick}
        disabled={item.disabled}
        sx={{ textTransform: "none" }}
      >
        {item.label}
      </Button>
    ))

    const primaryActionButtons = primaryButtons.map((item) => (
      <Button
        key={item.key}
        variant={item.variant || "outlined"}
        color={item.color || "primary"}
        startIcon={item.icon}
        onClick={item.onClick}
        disabled={item.disabled}
        sx={{ textTransform: "none" }}
      >
        {item.label}
      </Button>
    ))

    return {
      secondaryButtons,
      primaryButtons: primaryActionButtons,
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
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {showBackButton && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ textTransform: "none" }}>
            Atgal
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        {!isCompact && <Box sx={{ display: "flex", gap: 1, mr: 2 }}>{renderDesktopButtons().secondaryButtons}</Box>}

        {!isCompact && renderDesktopButtons().primaryButtons}

        {isCompact && menuItems.length > 0 && (
          <>
            <IconButton
              onClick={handleMenuClick}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                width: 40,
                height: 40,
              }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="action-menu"
              anchorEl={anchorEl}
              keepMounted
              open={open}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 200 },
              }}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.key}
                  onClick={() => {
                    handleMenuClose()
                    item.onClick?.()
                  }}
                  disabled={item.disabled}
                  sx={{
                    color: item.color === "error" ? "error.main" : "inherit",
                    fontWeight: item.variant === "contained" ? "bold" : "normal",
                  }}
                >
                  <Box component="span" sx={{ mr: 1.5, display: "flex", alignItems: "center" }}>
                    {item.icon}
                  </Box>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        {children}
      </Box>
    </Paper>
  )
}

export default ActionBar
