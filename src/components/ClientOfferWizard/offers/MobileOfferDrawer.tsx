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
  onDragEnd: () => void
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
  onDragEnd,
  draggedStepIndex,
  onAddOffer,
}) => {
  // Calculate total price for an offer
  const calculateOfferTotal = (offer: OfferStep): number => {
    const accommodationTotal = offer.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = offer.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = offer.cruises ? offer.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Count total items in an offer
  const countOfferItems = (offer: OfferStep): number => {
    return offer.accommodations.length + offer.transports.length + (offer.cruises ? offer.cruises.length : 0)
  }

  // Function to truncate text to 100 characters
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
            <IconButton size="small" onClick={onClose} sx={{ color: "primary.contrastText" }}>
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
                button
                key={idx}
                selected={selectedOfferIndex === idx}
                onClick={() => {
                  onSelectOffer(idx)
                  onClose()
                }}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                sx={{
                  py: 2,
                  borderLeft:
                    selectedOfferIndex === idx ? `4px solid ${theme.palette.primary.main}` : "4px solid transparent",
                  border: draggedStepIndex === idx ? `2px dashed ${theme.palette.success.main}` : undefined,
                  "&.Mui-selected": {
                    backgroundColor: "action.selected",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
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
      </Box>
    </Drawer>
  )
}

export default MobileOfferDrawer

