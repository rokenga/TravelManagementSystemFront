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
} from "@mui/icons-material"
import type { OfferWizardData, OfferStep, Accommodation, Transport, Cruise } from "./CreateClientOfferWizardForm"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"

interface Step3ReviewProps {
  tripData: OfferWizardData
}

// Combined type for all offer elements
type OfferElement = {
  type: "accommodation" | "transport" | "cruise"
  name: string
  startDate: Dayjs | null
  endDate: Dayjs | null
  startPlace?: string
  endPlace?: string
  price: number
  details: string[]
  originalData: Accommodation | Transport | Cruise
}

const Step3Review: React.FC<Step3ReviewProps> = ({ tripData }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  // Format date for display
  const formatDate = (date: Dayjs | null | string): string => {
    if (!date) return "Nenustatyta"
    if (typeof date === "string") {
      return dayjs(date).format("YYYY-MM-DD")
    }
    return date.format("YYYY-MM-DD")
  }

  // Format date and time for display
  const formatDateTime = (date: Dayjs | null | string): string => {
    if (!date) return "Nenustatyta"
    if (typeof date === "string") {
      return dayjs(date).format("YYYY-MM-DD HH:mm")
    }
    return date.format("YYYY-MM-DD HH:mm")
  }

  // Get category label
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

  // Get transport type icon
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

  // Get board basis label
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

  // Calculate total price for a specific offer
  const calculateOfferTotal = (step: OfferStep): number => {
    const accommodationTotal = step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Function to get all offer elements in a single array and sort them chronologically
  const getChronologicalOfferElements = (offer: OfferStep): OfferElement[] => {
    const elements: OfferElement[] = []

    // Add accommodations
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

    // Add transports
    offer.transports.forEach((trans) => {
      const details = []
      if (trans.companyName) details.push(`Kompanija: ${trans.companyName}`)
      if (trans.transportCode) details.push(`Kodas: ${trans.transportCode}`)
      if (trans.cabinType) details.push(`Klasė: ${trans.cabinType}`)
      if (trans.description) details.push(`Aprašymas: ${trans.description}`)

      elements.push({
        type: "transport",
        name: trans.transportName || trans.transportType || "Transportas",
        startDate: trans.departureTime,
        endDate: trans.arrivalTime,
        startPlace: trans.departurePlace,
        endPlace: trans.arrivalPlace,
        price: trans.price,
        details,
        originalData: trans,
      })
    })

    // Add cruises
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

    // Sort by start date
    return elements.sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return a.startDate.valueOf() - b.startDate.valueOf()
    })
  }

  // Get icon for element type
  const getElementIcon = (element: OfferElement) => {
    if (element.type === "accommodation") {
      return <Hotel sx={{ color: theme.palette.primary.main }} />
    } else if (element.type === "transport") {
      const transport = element.originalData as Transport
      return getTransportIcon(transport.transportType)
    } else {
      return <Sailing sx={{ color: theme.palette.primary.main }} />
    }
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Main Trip Information */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500, color: theme.palette.primary.main }}>
          {tripData.tripName || "Nepavadinta kelionė"}
        </Typography>

        <Grid container spacing={3}>
          {/* Left column - Main trip details */}
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

          {/* Right column - Descriptions */}
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

      {/* Offer Options */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500, color: theme.palette.primary.main }}>
        Pasiūlymo variantai
      </Typography>

      {tripData.offerSteps.map((offer, offerIndex) => {
        const offerElements = getChronologicalOfferElements(offer)

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
                      <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                        {/* First row: Name, dates, locations, price */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: element.details.length > 0 ? 1 : 0 }}>
                          <Box sx={{ mr: 1 }}>{getElementIcon(element)}</Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {element.name}
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
                            {element.price.toFixed(2)} €
                          </Typography>
                        </Box>

                        {/* Second row: Additional details */}
                        {element.details.length > 0 && (
                          <Box sx={{ display: "flex", pl: 4 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {element.details.join(" | ")}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
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

