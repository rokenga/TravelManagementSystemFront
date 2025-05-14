"use client"

import type React from "react"
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material"
import {
  Person,
  CalendarMonth,
  Category,
  Group,
  ChildCare,
  Hotel,
  Flight,
  DirectionsCar,
  DirectionsBus,
  Train,
  Sailing,
  Star,
  Image as ImageIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import type { OfferWizardData, OfferStep, Accommodation, Transport, Cruise } from "./CreateClientOfferWizardForm"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"

interface Step3ReviewProps {
  tripData: OfferWizardData
  onImageDelete?: (stepIndex: number, imageId: string) => void
}

type OfferElement = {
  type: "accommodation" | "transport" | "cruise" | "image"
  name: string
  startDate?: Dayjs | null
  endDate?: Dayjs | null
  startPlace?: string
  endPlace?: string
  price?: number
  details?: string[]
  originalData?: Accommodation | Transport | Cruise
  images?: File[] | null
  existingImages?: Array<{
    id: string
    url: string
    altText?: string
  }> | null
}

const Step3Review: React.FC<Step3ReviewProps> = ({ tripData, onImageDelete }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  const formatDate = (date: Dayjs | null | string): string => {
    if (!date) return "Nenustatyta"
    if (typeof date === "string") {
      return dayjs(date).format("YYYY-MM-DD")
    }
    return date.format("YYYY-MM-DD")
  }

  const formatDateTime = (date: Dayjs | null | string): string => {
    if (!date) return "Nenustatyta"
    if (typeof date === "string") {
      return dayjs(date).format("YYYY-MM-DD HH:mm")
    }
    return date.format("YYYY-MM-DD HH:mm")
  }

  const getCategoryLabel = (category: string): string => {
    const categories: Record<string, string> = {
      Tourist: "Turistinė",
      Group: "Grupinė",
      Relax: "Poilsinė",
      Business: "Verslo",
      Cruise: "Kruizas",
    }
    return categories[category] || category || "Nepasirinkta"
  }

  const getTransportTypeLabel = (type: string): string => {
    const transportTypes: Record<string, string> = {
      Flight: "Skrydis",
      Train: "Traukinys",
      Bus: "Autobusas",
      Car: "Automobilis",
      Ferry: "Keltas",
      Cruise: "Kruizas",
    }
    return transportTypes[type] || type || "Transportas"
  }

  const getTransportIcon = (type: string) => {
    switch (type) {
      case "Flight":
        return <Flight color="primary" />
      case "Train":
        return <Train color="primary" />
      case "Bus":
        return <DirectionsBus color="primary" />
      case "Car":
        return <DirectionsCar color="primary" />
      case "Ferry":
        return <Sailing color="primary" />
      default:
        return <DirectionsCar color="primary" />
    }
  }

  const getBoardBasisLabel = (basis: string): string => {
    const options: Record<string, string> = {
      BedAndBreakfast: "Nakvynė su pusryčiais",
      HalfBoard: "Pusryčiai ir vakarienė",
      FullBoard: "Pusryčiai, pietūs ir vakarienė",
      AllInclusive: "Viskas įskaičiuota",
      UltraAllInclusive: "Ultra viskas įskaičiuota",
    }
    return options[basis] || basis || "Nepasirinkta"
  }

  const calculateOfferTotal = (step: OfferStep): number => {
    const accommodationTotal = step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  const getChronologicalOfferElements = (offer: OfferStep, offerIndex: number): OfferElement[] => {
    const elements: OfferElement[] = []

    offer.accommodations.forEach((acc) => {
      const details = []
      if (acc.roomType) details.push(`Kambario tipas: ${acc.roomType}`)
      if (acc.boardBasis) details.push(`Maitinimas: ${getBoardBasisLabel(acc.boardBasis)}`)
      if (acc.description) details.push(`Aprašymas: ${acc.description}`)

      elements.push({
        type: "accommodation",
        name: acc.hotelName || "Viešbutis",
        startDate: acc.checkIn,
        endDate: acc.checkOut,
        price: acc.price,
        details,
        originalData: acc,
      })
    })

    offer.transports.forEach((trans) => {
      const details = []
      if (trans.companyName) details.push(`Kompanija: ${trans.companyName}`)
      if (trans.transportCode) details.push(`Kodas: ${trans.transportCode}`)
      if (trans.cabinType) details.push(`Klasė: ${trans.cabinType}`)
      if (trans.description) details.push(`Aprašymas: ${trans.description}`)

      elements.push({
        type: "transport",
        name: trans.transportName || getTransportTypeLabel(trans.transportType) || "Transportas",
        startDate: trans.departureTime,
        endDate: trans.arrivalTime,
        startPlace: trans.departurePlace,
        endPlace: trans.arrivalPlace,
        price: trans.price,
        details,
        originalData: trans,
      })
    })

    if (offer.cruises) {
      offer.cruises.forEach((cruise) => {
        const details = []
        if (cruise.companyName) details.push(`Kompanija: ${cruise.companyName}`)
        if (cruise.transportCode) details.push(`Kodas: ${cruise.transportCode}`)
        if (cruise.cabinType) details.push(`Kajutė: ${cruise.cabinType}`)
        if (cruise.description) details.push(`Aprašymas: ${cruise.description}`)

        elements.push({
          type: "cruise",
          name: cruise.transportName || "Kruizas",
          startDate: cruise.departureTime,
          endDate: cruise.arrivalTime,
          startPlace: cruise.departurePlace,
          endPlace: cruise.arrivalPlace,
          price: cruise.price,
          details,
          originalData: cruise,
        })
      })
    }

    const hasImageSection =
      Array.isArray(offer.stepImages) || (offer.existingStepImages && offer.existingStepImages.length > 0)
    if (hasImageSection) {
      elements.push({
        type: "image",
        name: "Nuotraukos",
        images: offer.stepImages,
        existingImages: offer.existingStepImages,
      })
    }

    return elements.sort((a, b) => {
      if (a.type === "image") return 1
      if (b.type === "image") return -1

      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return a.startDate.valueOf() - b.startDate.valueOf()
    })
  }

  const getElementIcon = (element: OfferElement) => {
    if (element.type === "accommodation") {
      return <Hotel sx={{ color: theme.palette.primary.main }} />
    } else if (element.type === "transport") {
      const transport = element.originalData as Transport
      return getTransportIcon(transport.transportType)
    } else if (element.type === "cruise") {
      return <Sailing sx={{ color: theme.palette.primary.main }} />
    } else {
      return <ImageIcon sx={{ color: theme.palette.primary.main }} />
    }
  }

  const renderStars = (rating: number | undefined | null) => {
    if (!rating) return null
    return (
      <Box sx={{ display: "inline-flex", ml: 1, verticalAlign: "middle" }}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} fontSize="small" sx={{ color: "gold" }} />
        ))}
      </Box>
    )
  }

  const handleImageDelete = (stepIndex: number, imageId: string) => {
    if (onImageDelete) {
      onImageDelete(stepIndex, imageId)
    }
  }

  const getImageUrl = (img: any): string => {

    if (img.urlInline) return img.urlInline
    if (img.url) return img.url
    if (img.fileName && img.id) {
      return `/api/images/${img.id}`
    }

    return "/placeholder.svg"
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500, color: theme.palette.primary.main }}>
          {tripData.tripName || "Nepavadinta kelionė"}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <List disablePadding>
              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <Person color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Klientas:
                      </Typography>{" "}
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {tripData.clientName || "Nepasirinkta"}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <CalendarMonth color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Kelionės datos:
                      </Typography>{" "}
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <Category color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Kategorija:
                      </Typography>{" "}
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {getCategoryLabel(tripData.category || "")}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <Group color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Keliautojų skaičius:
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, ml: 1, flexWrap: "wrap" }}>
                        <Chip icon={<Person />} label={`${tripData.adultCount} suaugę`} size="small" />
                        {tripData.childrenCount > 0 && (
                          <Chip icon={<ChildCare />} label={`${tripData.childrenCount} vaikai`} size="small" />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            {tripData.description && (
              <Box sx={{ mb: 2, textAlign: "left" }}>
                <Typography variant="body1" color="text.primary" gutterBottom fontWeight="medium">
                  Aprašymas:
                </Typography>
                <Typography variant="body1" align="left">
                  {tripData.description}
                </Typography>
              </Box>
            )}

            {tripData.description && tripData.clientWishes && <Divider sx={{ my: 2 }} />}

            {tripData.clientWishes && (
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body1" color="text.primary" gutterBottom fontWeight="medium">
                  Kliento norai / komentarai:
                </Typography>
                <Typography variant="body1" align="left">
                  {tripData.clientWishes}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500, color: theme.palette.primary.main }}>
        Pasiūlymo variantai
      </Typography>

      {tripData.offerSteps.map((offer, offerIndex) => {
        const offerElements = getChronologicalOfferElements(offer, offerIndex)

        return (
          <Paper
            key={offerIndex}
            elevation={2}
            sx={{
              mb: 4,
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">{offer.name || `Pasiūlymas ${offerIndex + 1}`}</Typography>
              <Chip
                label={`${calculateOfferTotal(offer).toFixed(2)} €`}
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                }}
              />
            </Box>

            <Box sx={{ p: 3 }}>
              {offerElements.length === 0 ? (
                <Typography variant="body2" sx={{ fontStyle: "italic", textAlign: "left", color: "text.secondary" }}>
                  Nėra pridėtų pasiūlymo elementų.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {offerElements.map((element, elementIndex) => (
                    <Grid item xs={12} key={elementIndex}>
                      {element.type === "image" ? (
                        <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <Box sx={{ mr: 1 }}>{getElementIcon(element)}</Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Nuotraukos
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={1}>
                              {element.existingImages &&
                                element.existingImages.length > 0 &&
                                element.existingImages.map((img) => {
                                  if (!img || (!img.url && !img.urlInline && !img.id)) {
                                    return null
                                  }

                                  const imageUrl = getImageUrl(img)

                                  return (
                                    <Grid item key={img.id || `img-${Math.random()}`} xs={6} sm={4} md={3} lg={2}>
                                      <Box
                                        sx={{
                                          width: "100%",
                                          height: 100,
                                          borderRadius: 1,
                                          overflow: "hidden",
                                          position: "relative",
                                          border: "1px solid #eee",
                                          backgroundColor: "#f5f5f5", 
                                        }}
                                      >
                                        {imageUrl && imageUrl !== "/placeholder.svg" ? (
                                          <img
                                            src={imageUrl || "/placeholder.svg"}
                                            alt={img.altText || "Nuotrauka"}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                            onError={(e) => {
                                              ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                            }}
                                          />
                                        ) : (
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              height: "100%",
                                              padding: 1,
                                              textAlign: "center",
                                            }}
                                          >
                                            <ImageIcon sx={{ color: "text.secondary", mb: 1 }} />
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                              {img.id ? `ID: ${img.id.substring(0, 8)}...` : "No image data"}
                                            </Typography>
                                          </Box>
                                        )}
                                        {onImageDelete && (
                                          <IconButton
                                            size="small"
                                            sx={{
                                              position: "absolute",
                                              top: 4,
                                              right: 4,
                                              backgroundColor: "rgba(255, 255, 255, 0.7)",
                                              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" },
                                            }}
                                            onClick={() => handleImageDelete(offerIndex, img.id)}
                                            data-image-delete-button="true"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        )}
                                      </Box>
                                    </Grid>
                                  )
                                })}

                              {element.images &&
                                element.images.length > 0 &&
                                element.images.map((file, idx) => (
                                  <Grid item key={`new-${idx}`} xs={6} sm={4} md={3} lg={2}>
                                    <Box
                                      sx={{
                                        width: "100%",
                                        height: 100,
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        position: "relative",
                                        border: "1px solid #eee",
                                      }}
                                    >
                                      <img
                                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                                        alt={file.name}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </Box>
                                  </Grid>
                                ))}
                            </Grid>

                            {(!element.images || element.images.length === 0) &&
                              (!element.existingImages || element.existingImages.length === 0) && (
                                <Typography
                                  variant="body2"
                                  sx={{ fontStyle: "italic", color: "text.secondary", mt: 1 }}
                                >
                                  Nėra pridėtų nuotraukų.
                                </Typography>
                              )}
                          </Box>
                        </Paper>
                      ) : (
                        <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: element.details && element.details.length > 0 ? 1 : 0,
                            }}
                          >
                            <Box sx={{ mr: 1 }}>{getElementIcon(element)}</Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {element.name}
                              {element.type === "accommodation" &&
                                renderStars((element.originalData as Accommodation).starRating)}
                            </Typography>
                            <Box sx={{ ml: 2 }}>
                              {element.type === "accommodation" ? (
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(element.startDate)} - {formatDate(element.endDate)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {element.startPlace
                                    ? `${element.startPlace} (${formatDateTime(element.startDate)})`
                                    : formatDateTime(element.startDate)}{" "}
                                  →{" "}
                                  {element.endPlace
                                    ? `${element.endPlace} (${formatDateTime(element.endDate)})`
                                    : formatDateTime(element.endDate)}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {element.price?.toFixed(2)} €
                            </Typography>
                          </Box>

                          {element.details && element.details.length > 0 && (
                            <Box sx={{ display: "flex", pl: 4 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {element.details.join(" | ")}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      )}
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}

export default Step3Review
