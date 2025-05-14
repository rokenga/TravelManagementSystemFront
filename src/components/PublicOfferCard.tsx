"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardActionArea, Typography, Box, CardMedia, Skeleton, styled } from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import PaymentIcon from "@mui/icons-material/Payment"
import ImageIcon from "@mui/icons-material/Image"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import { translateTripCategory } from "../Utils/translateEnums"
import { type TripResponse as TripResponseType, TripCategory } from "../types/ClientTrip"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

const formatDate = (dateString?: string) => {
  if (!dateString) return "Nežinoma data"
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString))
}

const truncateText = (text = "", maxLength = 70) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

const formatPrice = (price?: number) => {
  if (price === undefined) return "Kaina nenurodyta"
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

const lithuanianMonths = [
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio",
]

const categoryColors = {
  [TripCategory.Tourist]: "#2196F3",
  [TripCategory.Group]: "#9C27B0", 
  [TripCategory.Relax]: "#FF9800",
  [TripCategory.Business]: "#4CAF50",
  [TripCategory.Cruise]: "#E91E63",
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  position: "relative",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 16px 32px rgba(0,0,0,0.16)",
  },
  display: "flex",
  flexDirection: "column",
}))

const TopBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 16,
  left: 16,
  background: "#00E5FF",
  color: "#000",
  padding: "4px 12px",
  borderRadius: "4px",
  fontWeight: "bold",
  zIndex: 2,
  fontSize: "0.875rem",
}))

const CategorySticker = styled(Box)(({ bgcolor }) => ({
  position: "absolute",
  top: 16,
  right: 16,
  background: bgcolor || "#2196F3",
  color: "white",
  padding: "6px 12px",
  borderRadius: "4px",
  fontWeight: "bold",
  zIndex: 2,
  fontSize: "0.75rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  transform: "rotate(2deg)",
}))

const DestinationSticker = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 16,
  left: 16,
  maxWidth: "calc(100% - 32px)",
  background: "rgba(255, 255, 255, 0.9)",
  color: "#000",
  padding: "8px 12px",
  borderRadius: "6px",
  zIndex: 2,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
}))

const DateBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  marginTop: "2px",
}))

interface FileResponse {
  id: string
  url: string
  container: string
  type: string
  altText: string
  tripId: string
}

interface PublicOfferCardProps {
  offer: TripResponseType
  onClick: (id: string) => void
  isTopOffer?: boolean
}

const PublicOfferCard: React.FC<PublicOfferCardProps> = ({ offer, onClick, isTopOffer = false }) => {
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const formatDateRange = () => {
    if (!offer.startDate && !offer.endDate) return "Datos nenustatytos"

    const startDate = offer.startDate ? new Date(offer.startDate) : null
    const endDate = offer.endDate ? new Date(offer.endDate) : null

    if (startDate && endDate) {
      if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        const monthIndex = startDate.getMonth()
        const monthName = lithuanianMonths[monthIndex]
        return `${monthName} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`
      }
    }

    return `${formatDate(offer.startDate)} - ${formatDate(offer.endDate)}`
  }

  useEffect(() => {
    setLoading(true)

    const fetchImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/File/public-offer/${offer.id}/Image`, {

        })

        if (response.data && response.data.length > 0) {
          setCoverImage(response.data[0].url)
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [offer.id, offer.files])

  return (
    <StyledCard>
      {isTopOffer && <TopBadge>TOP</TopBadge>}

      <CardActionArea
        onClick={() => onClick(offer.id)}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box sx={{ position: "relative", height: 200 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={200} animation="wave" />
          ) : coverImage ? (
            <CardMedia
              component="img"
              height="200"
              image={coverImage}
              alt={offer.tripName || "Pasiūlymo nuotrauka"}
              sx={{ objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                bgcolor: "rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon sx={{ fontSize: 60, color: "rgba(0,0,0,0.2)" }} />
            </Box>
          )}

          {offer.category && (
            <CategorySticker bgcolor={categoryColors[offer.category]}>
              <LocalOfferIcon sx={{ fontSize: "0.875rem" }} />
              {translateTripCategory(offer.category)}
            </CategorySticker>
          )}

          <DestinationSticker>
            <Typography variant="body1" fontWeight="bold" noWrap>
              {truncateText(offer.tripName || "Pasiūlymas be pavadinimo", 30)}
            </Typography>
            <DateBadge>
              <CalendarTodayIcon sx={{ fontSize: "0.75rem", opacity: 0.7 }} />
              <Typography variant="caption" color="text.secondary">
                {formatDateRange()}
              </Typography>
            </DateBadge>
          </DestinationSticker>
        </Box>

        <CardContent sx={{ p: 2, flexGrow: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {offer.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {truncateText(offer.description, 80)}
              </Typography>
            )}

            {offer.price !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mt: "auto",
                  pt: 1,
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <PaymentIcon sx={{ fontSize: "1rem", mr: 1, color: "text.primary" }} />
                <Typography variant="body1" fontWeight="bold" color="text.primary">
                  nuo {formatPrice(offer.price)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  )
}

export default PublicOfferCard

