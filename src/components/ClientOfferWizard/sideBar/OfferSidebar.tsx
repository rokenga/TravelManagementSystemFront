"use client"

import type React from "react"
import { List, ListItem, ListItemText, Paper, Typography, useTheme, Box, IconButton } from "@mui/material"
import { Description, DragIndicator, Add as AddIcon } from "@mui/icons-material"
import type { OfferStep } from "../CreateClientOfferWizardForm"

interface OfferSidebarProps {
  offers: OfferStep[]
  selectedOfferIndex: number
  onSelectOffer: (index: number) => void
  sidebarWidth: number
  onDragStart: (e: React.DragEvent, stepIndex: number) => void
  onDragOver: (e: React.DragEvent, stepIndex: number) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stepIndex: number) => void
  onDragEnd: (e: React.DragEvent) => void
  draggedStepIndex: number | null
  onAddOffer: () => void
}

const OfferSidebar: React.FC<OfferSidebarProps> = ({
  offers,
  selectedOfferIndex,
  onSelectOffer,
  sidebarWidth,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedStepIndex,
  onAddOffer,
}) => {
  const theme = useTheme()

  const calculateOfferTotal = (offer: OfferStep): number => {
    const accommodationTotal = offer.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = offer.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = offer.cruises ? offer.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Update the countOfferItems function to count image sections even when empty
  const countOfferItems = (offer: OfferStep): number => {
    const accommodationsCount = offer.accommodations?.length || 0
    const transportsCount = offer.transports?.length || 0
    const cruisesCount = offer.cruises?.length || 0
    // Count image section if it exists (is an array), regardless of whether it has images
    const hasImageSection = Array.isArray(offer.stepImages)

    return accommodationsCount + transportsCount + cruisesCount + (hasImageSection ? 1 : 0)
  }

  const truncateText = (text: string, maxLength = 100): string => {
    if (!text) return ""
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        borderRadius: 1,
        overflow: "hidden",
        height: "max-content",
        position: "sticky",
        top: 24,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
          Pasiūlymo variantai
        </Typography>
        <IconButton
          size="small"
          onClick={onAddOffer}
          data-tab-button="true"
          sx={{
            color: theme.palette.primary.contrastText,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
      <List sx={{ p: 0 }}>
        {offers.length === 0 ? (
          <ListItem>
            <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
              Nėra sukurtų pasiūlymo variantų.
            </Typography>
          </ListItem>
        ) : (
          offers.map((offer, idx) => (
            <ListItem
              key={idx}
              onClick={() => onSelectOffer(idx)}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnter={(e) => onDragEnter(e)}
              onDragLeave={(e) => onDragLeave(e)}
              onDrop={(e) => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              data-tab-button="true"
              sx={{
                py: 2,
                cursor: "pointer",
                borderLeft:
                  selectedOfferIndex === idx ? `4px solid ${theme.palette.primary.main}` : "4px solid transparent",
                border: draggedStepIndex === idx ? `2px dashed ${theme.palette.success.main}` : undefined,
                backgroundColor: selectedOfferIndex === idx ? "action.selected" : "inherit",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  cursor: "move",
                  mr: 1,
                  color: theme.palette.text.secondary,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <DragIndicator />
              </IconButton>
              <ListItemText
                primary={truncateText(offer.name) || `Pasiūlymas ${idx + 1}`}
                secondary={
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Description fontSize="inherit" /> {countOfferItems(offer)} elementai
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                      {calculateOfferTotal(offer).toFixed(2)} €
                    </Typography>
                  </Box>
                }
                primaryTypographyProps={{
                  fontSize: "1rem",
                  fontWeight: selectedOfferIndex === idx ? "bold" : "medium",
                }}
                secondaryTypographyProps={{
                  fontSize: "0.875rem",
                }}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  )
}

export default OfferSidebar
