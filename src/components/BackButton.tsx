"use client"

import type React from "react"
import { Button, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigation } from "../contexts/NavigationContext"
import { useNavigate } from "react-router-dom"

interface BackButtonProps {
  fallbackPath?: string
  label?: string
  tooltip?: string
  iconOnly?: boolean
  sx?: React.CSSProperties
}

const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = "/",
  label = "Grįžti atgal",
  tooltip = "Grįžti į ankstesnį puslapį",
  iconOnly = false,
  sx = {},
}) => {
  const { navigateBack, previousPath } = useNavigation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const navigate = useNavigate()

  const handleBack = () => {
    if (previousPath) {
      navigateBack()
    } else {
      navigate(fallbackPath)
    }
  }

  if (isMobile || iconOnly) {
    return (
      <Tooltip title={tooltip}>
        <IconButton onClick={handleBack} color="primary" aria-label={label} sx={{ ...sx }}>
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={handleBack}
      sx={{
        textTransform: "none",
        ...sx,
      }}
    >
      {label}
    </Button>
  )
}

export default BackButton
