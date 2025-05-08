"use client"

import type React from "react"
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material"
import {
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
  AccessTime,
  LocationOn,
} from "@mui/icons-material"
import type { PublicOfferWizardData, Accommodation, Transport, Cruise } from "./CreatePublicOfferWizardForm"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import StarRating from "../StarRating"

interface Step2ReviewProps {
  offerData: PublicOfferWizardData
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
  details: (string | React.ReactNode)[]
  originalData: Accommodation | Transport | Cruise
}

const Step2ReviewConfirm: React.FC<Step2ReviewProps> = ({ offerData }) => {
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

  // Get transport type label in Lithuanian
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

  // Calculate total price for the offer
  const calculateTotalPrice = (): number => {
    const accommodationTotal = offerData.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = offerData.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = offerData.cruises ? offerData.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Function to get all offer elements in a single array and sort them chronologically
  const getChronologicalOfferElements = (): OfferElement[] => {
    const elements: OfferElement[] = []

    // Add accommodations
    offerData.accommodations.forEach((acc) => {
      const details: (string | React.ReactNode)[] = []
      const detailsBox = (
        <Box key="details" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* First row with room type, board basis, star rating, and hotel link */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {acc.roomType && (
              <Typography variant="body2" color="text.secondary">
                Kambario tipas: {acc.roomType}
              </Typography>
            )}
            {acc.boardBasis && (
              <Typography variant="body2" color="text.secondary">
                Maitinimas: {getBoardBasisLabel(acc.boardBasis)}
              </Typography>
            )}
            {acc.starRating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Žvaigždučių reitingas:
                </Typography>
                <StarRating value={acc.starRating} readOnly size="small" />
              </Box>
            )}
            {acc.hotelLink && (
              <Typography variant="body2" color="text.secondary">
                Adresas: {acc.hotelLink}
              </Typography>
            )}
          </Box>

          {/* Second row with description */}
          {acc.description && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Aprašymas: {acc.description}
              </Typography>
            </Box>
          )}
        </Box>
      )
      details.push(detailsBox)

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
    offerData.transports.forEach((trans) => {
      const details: (string | React.ReactNode)[] = []
      const detailsBox = (
        <Box key="details" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* First row with company, transport code, and cabin type */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {trans.companyName && (
              <Typography variant="body2" color="text.secondary">
                Kompanija: {trans.companyName}
              </Typography>
            )}
            {trans.transportCode && (
              <Typography variant="body2" color="text.secondary">
                Kodas: {trans.transportCode}
              </Typography>
            )}
            {trans.cabinType && (
              <Typography variant="body2" color="text.secondary">
                Klasė: {trans.cabinType}
              </Typography>
            )}
          </Box>

          {/* Second row with description */}
          {trans.description && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Aprašymas: {trans.description}
              </Typography>
            </Box>
          )}
        </Box>
      )
      details.push(detailsBox)

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

    // Add cruises
    if (offerData.cruises) {
      offerData.cruises.forEach((cruise) => {
        const details: (string | React.ReactNode)[] = []
        const detailsBox = (
          <Box key="details" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* First row with company, cruise code, and cabin type */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {cruise.companyName && (
                <Typography variant="body2" color="text.secondary">
                  Kompanija: {cruise.companyName}
                </Typography>
              )}
              {cruise.transportCode && (
                <Typography variant="body2" color="text.secondary">
                  Kodas: {cruise.transportCode}
                </Typography>
              )}
              {cruise.cabinType && (
                <Typography variant="body2" color="text.secondary">
                  Kajutė: {cruise.cabinType}
                </Typography>
              )}
            </Box>

            {/* Second row with description */}
            {cruise.description && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Aprašymas: {cruise.description}
                </Typography>
              </Box>
            )}
          </Box>
        )
        details.push(detailsBox)

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

  const offerElements = getChronologicalOfferElements()
  const totalPrice = calculateTotalPrice()

  return (
    <Box sx={{ width: "100%" }}>
      {/* Main Trip Information */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Tooltip title={offerData.tripName || "Nepavadinta kelionė"} placement="top-start">
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              mb: 3,
              fontWeight: 500,
              color: theme.palette.primary.main,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {offerData.tripName || "Nepavadinta kelionė"}
          </Typography>
        </Tooltip>

        <Grid container spacing={3}>
          {/* Left column - Main trip details */}
          <Grid item xs={12} md={6}>
            <List disablePadding>
              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <LocationOn color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Kelionės tikslas:
                      </Typography>{" "}
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {offerData.destination || "Nenustatyta"}
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
                        {formatDate(offerData.startDate)} - {formatDate(offerData.endDate)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem alignItems="center" sx={{ py: 1 }}>
                <ListItemIcon>
                  <AccessTime color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Galioja iki:
                      </Typography>{" "}
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {formatDate(offerData.validUntil)}
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
                        {getCategoryLabel(offerData.category || "")}
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
                        <Chip icon={<Group />} label={`${offerData.adultCount} suaugę`} size="small" />
                        {offerData.childrenCount > 0 && (
                          <Chip icon={<ChildCare />} label={`${offerData.childrenCount} vaikai`} size="small" />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Grid>

          {/* Right column - Description */}
          <Grid item xs={12} md={6}>
            {offerData.description && (
              <Box sx={{ mb: 2, textAlign: "left" }}>
                <Typography variant="body1" color="text.primary" gutterBottom fontWeight="medium">
                  Aprašymas:
                </Typography>
                <Typography variant="body1" align="left">
                  {offerData.description}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Images preview */}
        {offerData.images && offerData.images.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
              Nuotraukos ({offerData.images.length})
            </Typography>
            <Grid container spacing={1}>
              {offerData.images.map((image, index) => (
                <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
                  <Box
                    sx={{
                      width: "100%",
                      height: 100,
                      borderRadius: 1,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={URL.createObjectURL(image) || "/placeholder.svg"}
                      alt={`Nuotrauka ${index + 1}`}
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
          </Box>
        )}

        {/* Existing images preview */}
        {offerData.existingImages && offerData.existingImages.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
              Nuotraukos ({offerData.existingImages.length})
            </Typography>
            <Grid container spacing={1}>
              {offerData.existingImages.map((image, index) => (
                <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
                  <Box
                    sx={{
                      width: "100%",
                      height: 100,
                      borderRadius: 1,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Nuotrauka ${index + 1}`}
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
          </Box>
        )}

        {/* Total price */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Chip
            label={`Bendra kaina: ${totalPrice.toFixed(2)} €`}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem", py: 2 }}
          />
        </Box>
      </Paper>

      {/* Offer Elements */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500, color: theme.palette.primary.main }}>
        Pasiūlymo elementai
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        {offerElements.length === 0 ? (
          <Typography variant="body1" sx={{ fontStyle: "italic", textAlign: "center", py: 3 }}>
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
                    <Box sx={{ pl: 4 }}>
                      {element.details.map((detail, index) => (
                        <Box key={index} sx={{ mt: 1 }}>
                          {typeof detail === "string" ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              {detail}
                            </Typography>
                          ) : (
                            detail
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  )
}

export default Step2ReviewConfirm
