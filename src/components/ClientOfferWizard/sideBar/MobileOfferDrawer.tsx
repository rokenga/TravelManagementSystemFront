"use client"

import type React from "react"
import { Drawer, List, ListItem, ListItemText, Typography, Box, IconButton, Divider, useTheme } from "@mui/material"
import { Close, DragIndicator, Description, Add as AddIcon } from "@mui/icons-material"
import type { OfferStep } from "../CreateClientOfferWizardForm"

interface MobileOfferDrawerProps {
  open: boolean
  onClose: () => void
  offers: OfferStep[]
  selectedOfferIndex: number
  onSelectOffer: (index: number) => void
  onDragStart: (e: React.DragEvent, stepIndex: number) => void
  onDragOver: (e: React.DragEvent, stepIndex: number) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stepIndex: number) => void
  onDragEnd: (e: React.DragEvent) => void
  draggedStepIndex: number | null
  onAddOffer: () => void
}

const MobileOfferDrawer: React.FC<MobileOfferDrawerProps> = ({
  open,
  onClose,
  offers,
  selectedOfferIndex,
  onSelectOffer,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedStepIndex,
  onAddOffer,
}) => {
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

  const theme = useTheme()

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, p: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
            Pasiūlymo variantai
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={onAddOffer}
              data-tab-button="true"
              sx={{
                color: "primary.contrastText",
                mr: 1,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <AddIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose} data-tab-button="true" sx={{ color: "primary.contrastText" }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        <Divider />
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
                onClick={() => {
                  onSelectOffer(idx)
                  onClose()
                }}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
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
                    color: "text.secondary",
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
                        <Description fontSize="inherit" /> {countOfferItems(offer as OfferStep)} elementai
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
      </Box>
    </Drawer>
  )
}

export default MobileOfferDrawer
