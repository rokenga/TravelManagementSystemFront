"use client"

import type React from "react"
import { Card, Typography, Box, Chip, IconButton, Tooltip, Avatar } from "@mui/material"
import { Language, Email, Phone, Facebook, Info, LocationOn } from "@mui/icons-material"
import type { PartnerResponse } from "../types/Partner"
import { partnerTypeColors } from "../types/Partner"
import { translatePartnerType } from "../Utils/translateEnums"

interface PartnerCardProps {
  partner: PartnerResponse
  onClick?: (partner: PartnerResponse) => void
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(partner)
    }
  }

  const getLocationString = () => {
    const locationParts = [partner.city, partner.country, partner.region].filter(Boolean)
    return locationParts.length > 0 ? locationParts.join(", ") : null
  }

  const hasContactInfo = partner.websiteUrl || partner.email || partner.phone || partner.facebook || partner.notes

  const locationString = getLocationString()

  const getTypeColor = () => {
    if (typeof partner.type === "string") {
      const typeMap: Record<string, number> = {
        HotelSystem: 0,
        Guide: 1,
        DestinationPartner: 2,
        TransportCompany: 3,
        Other: 4,
      }
      const typeNumber = typeMap[partner.type] !== undefined ? typeMap[partner.type] : 4 
      return partnerTypeColors[typeNumber]
    }

    return partnerTypeColors[partner.type] || partnerTypeColors[4] 
  }

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: onClick ? "translateY(-4px)" : "none",
          boxShadow: onClick ? 4 : 1,
        },
        borderRadius: 2,
        overflow: "hidden",
      }}
      onClick={handleClick}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          {/* Logo */}
          {partner.logoUrl ? (
            <Avatar
              src={partner.logoUrl}
              alt={`${partner.name} logo`}
              variant="square"
              sx={{
                width: 80,
                height: 80,
                mr: 2,
                bgcolor: "#000",
              }}
            />
          ) : (
            <Avatar
              variant="square"
              sx={{
                width: 80,
                height: 80,
                mr: 2,
                bgcolor: "#f0f0f0",
                color: "#757575",
              }}
            >
              {partner.name?.substring(0, 2).toUpperCase() || "?"}
            </Avatar>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: "bold", mb: 0.5 }}>
              {partner.name || "Nenurodyta"}
            </Typography>
            <Chip
              label={translatePartnerType(partner.type)}
              size="small"
              sx={{
                bgcolor: getTypeColor(),
                color: "white",
                fontWeight: "medium",
                borderRadius: 4,
              }}
            />
          </Box>
        </Box>

        {locationString && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <LocationOn sx={{ color: "#757575", mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {locationString}
            </Typography>
          </Box>
        )}

        {hasContactInfo && (
          <Box sx={{ display: "flex", mt: 2, color: "#757575" }}>
            {partner.websiteUrl && (
              <IconButton
                size="medium"
                href={partner.websiteUrl.startsWith("http") ? partner.websiteUrl : `https://${partner.websiteUrl}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                sx={{ color: "inherit", mr: 1 }}
              >
                <Language />
              </IconButton>
            )}

            {partner.email && (
              <IconButton
                size="medium"
                href={`mailto:${partner.email}`}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: "inherit", mr: 1 }}
              >
                <Email />
              </IconButton>
            )}

            {partner.phone && (
              <IconButton
                size="medium"
                href={`tel:${partner.phone}`}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: "inherit", mr: 1 }}
              >
                <Phone />
              </IconButton>
            )}

            {partner.facebook && (
              <IconButton
                size="medium"
                href={partner.facebook.startsWith("http") ? partner.facebook : `https://${partner.facebook}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                sx={{ color: "inherit", mr: 1 }}
              >
                <Facebook />
              </IconButton>
            )}

            {partner.notes && (
              <Tooltip title="Pastabos">
                <IconButton size="medium" sx={{ color: "inherit" }}>
                  <Info />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Card>
  )
}

export default PartnerCard
