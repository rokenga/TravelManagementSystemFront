"use client"

import type React from "react"
import { Paper, Box, Button, Tooltip, IconButton, Chip } from "@mui/material"
import { Menu, ArrowBack, ArrowForward, Description } from "@mui/icons-material"
import type { OfferStep } from "../CreateClientOfferWizardForm"

interface MobileOfferSelectorProps {
  selectedOfferIndex: number
  totalOffers: number
  currentOffer: OfferStep
  onOpenDrawer: () => void
  onPreviousOffer: () => void
  onNextOffer: () => void
}

const MobileOfferSelector: React.FC<MobileOfferSelectorProps> = ({
  selectedOfferIndex,
  totalOffers,
  currentOffer,
  onOpenDrawer,
  onPreviousOffer,
  onNextOffer,
}) => {
  // Calculate total price for an offer
  const calculateOfferTotal = (offer: OfferStep): number => {
    const accommodationTotal = offer.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = offer.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = offer.cruises ? offer.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Function to truncate text to 100 characters
  const truncateText = (text: string, maxLength = 100): string => {
    if (!text) return ""
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  return (
    <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button startIcon={<Menu />} onClick={onOpenDrawer} variant="outlined" size="medium">
          {truncateText(currentOffer.name) || `Pasiūlymas ${selectedOfferIndex + 1}`}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Ankstesnis pasiūlymas">
            <span>
              <IconButton onClick={onPreviousOffer} disabled={selectedOfferIndex === 0} size="small" color="primary">
                <ArrowBack />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Kitas pasiūlymas">
            <span>
              <IconButton
                onClick={onNextOffer}
                disabled={selectedOfferIndex === totalOffers - 1}
                size="small"
                color="primary"
              >
                <ArrowForward />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Chip
        label={`${calculateOfferTotal(currentOffer).toFixed(2)} €`}
        size="small"
        icon={<Description />}
        sx={{ mt: 1 }}
      />
    </Paper>
  )
}

export default MobileOfferSelector

