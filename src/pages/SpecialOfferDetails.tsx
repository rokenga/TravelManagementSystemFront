"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PublicOfferDetails } from "../types/PublicSpecialOffer"
import type { ImageItem } from "../components/ImageGallery"
import { translateBoardBasisType, translateTripCategory } from "../Utils/translateEnums"
import LeafletMapDisplay from "../components/LeafletMapDisplay"
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Divider,
  Chip,
  Button,
  Card,
  CardContent,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Fab,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Flight as FlightIcon,
  DirectionsCar as CarIcon,
  DirectionsBus as BusIcon,
  DirectionsBoat as BoatIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  Info as InfoIcon,
  EventAvailable as ValidUntilIcon,
  Bed as BedIcon,
  Euro as EuroIcon,
  Description as DescriptionIcon,
  DirectionsBus as DirectionsBusIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material"

// Import the ImageSlider component
import ImageSlider from "../components/ImageSlider"

// Helper function to format dates in Lithuanian
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

// Helper function to format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
}

// Helper function to get transport icon
const getTransportIcon = (type: string) => {
  switch (type) {
    case "Flight":
      return <FlightIcon />
    case "Car":
      return <CarIcon />
    case "Bus":
      return <BusIcon />
    case "Cruise":
      return <BoatIcon />
    case "Train":
      return <DirectionsBusIcon sx={{ transform: "rotate(90deg)" }} />
    default:
      return <FlightIcon />
  }
}

const SpecialOfferDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<PublicOfferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAccommodationTab, setActiveAccommodationTab] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const reservationSectionRef = useRef<HTMLDivElement>(null)

  const scrollToReservation = () => {
    reservationSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(`${API_URL}/PublicTripOfferFacade/${id}`)
        setOffer(response.data)
      } catch (err) {
        console.error("Failed to fetch offer details:", err)
        setError("Nepavyko gauti pasiūlymo detalių. Bandykite vėliau.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOfferDetails()
    }
  }, [id])

  const handleReserve = () => {
    navigate(`/reserve-special-offer/${id}`)
  }

  const handleAccommodationTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveAccommodationTab(newValue)
  }

  // Prepare images for gallery
  const galleryImages: ImageItem[] =
    offer?.files
      .filter((file) => file.type === "Image")
      .map((file) => ({
        id: file.id,
        url: file.url,
        altText: file.altText,
      })) || []

  // Get all accommodations from all steps
  const allAccommodations = offer?.itinerary.steps.flatMap((step) => step.accommodations || []) || []

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
            <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/specialOffers")}>
          Grįžti į pasiūlymų sąrašą
        </Button>
      </Container>
    )
  }

  if (!offer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Pasiūlymas nerastas.</Alert>
        <Button variant="outlined" onClick={() => navigate("/specialOffers")} sx={{ mt: 2 }}>
          Grįžti į pasiūlymų sąrašą
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12}>
          {/* Hero Section with Image Slider */}
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              mb: 3,
              position: "relative",
            }}
          >
            {galleryImages.length > 0 && (
              <Box sx={{ position: "relative" }}>
                <ImageSlider
                  images={galleryImages}
                  onImageClick={(index) => {
                    // You could implement a full-screen gallery view here
                    console.log("Image clicked:", index)
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* Floating Reservation Button */}
          <Box
            sx={{
              position: "sticky",
              top: 20,
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={scrollToReservation}
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: "bold",
                boxShadow: 3,
              }}
            >
              Rezervuoti kelionę
            </Button>
          </Box>
          <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
            <Fab color="primary" aria-label="reserve" onClick={scrollToReservation}>
              <ShoppingCartIcon />
            </Fab>
          </Box>

          {/* Description with trip details */}
          <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {offer.tripName}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
              <Chip
                icon={<CalendarIcon />}
                label={`${formatDate(offer.startDate)} - ${formatDate(offer.endDate)}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<PersonIcon />}
                label={`${offer.adultsCount} suaugę${offer.adultsCount !== 1 ? "" : "s"}`}
                color="primary"
                variant="outlined"
              />
              {offer.childrenCount > 0 && (
                <Chip
                  icon={<ChildIcon />}
                  label={`${offer.childrenCount} vaik${offer.childrenCount === 1 ? "as" : "ai"}`}
                  color="primary"
                  variant="outlined"
                />
              )}
              <Chip
                icon={<InfoIcon />}
                label={`Kategorija: ${translateTripCategory(offer.category)}`}
                color="secondary"
                variant="outlined"
              />
              <Chip
                icon={<ValidUntilIcon />}
                label={`Pasiūlymas galioja iki: ${formatDate(offer.validUntil)}`}
                color="info"
                variant="outlined"
              />
            </Box>

            <Typography variant="h5" gutterBottom fontWeight="bold">
              Apie kelionę
            </Typography>
            <Typography variant="body1" paragraph>
              {offer.description}
            </Typography>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Kaina nuo:
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(offer.price)}
              </Typography>
            </Box>
          </Paper>

          {/* Accommodations Section with Map */}
          {allAccommodations.length > 0 && (
            <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Apgyvendinimas
              </Typography>

              {allAccommodations.length > 1 && (
                <Tabs
                  value={activeAccommodationTab}
                  onChange={handleAccommodationTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 3 }}
                >
                  {allAccommodations.map((accommodation, index) => (
                    <Tab
                      key={index}
                      label={accommodation.hotelName || `Viešbutis ${index + 1}`}
                      id={`accommodation-tab-${index}`}
                      aria-controls={`accommodation-tabpanel-${index}`}
                    />
                  ))}
                </Tabs>
              )}

              {allAccommodations.map((accommodation, index) => (
                <Box
                  key={index}
                  role="tabpanel"
                  hidden={activeAccommodationTab !== index}
                  id={`accommodation-tabpanel-${index}`}
                  aria-labelledby={`accommodation-tab-${index}`}
                >
                  {activeAccommodationTab === index && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ height: "100%" }}>
                          <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                              <HotelIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                              <Typography variant="h6" fontWeight="bold">
                                {accommodation.hotelName}
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                  <TimeIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      Atvykimas:
                                    </Typography>
                                    <Typography variant="body1">{formatDate(accommodation.checkIn)}</Typography>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                  <TimeIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      Išvykimas:
                                    </Typography>
                                    <Typography variant="body1">{formatDate(accommodation.checkOut)}</Typography>
                                  </Box>
                                </Box>
                              </Grid>

                              {accommodation.roomType && (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                    <BedIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Kambario tipas:
                                      </Typography>
                                      <Typography variant="body1">{accommodation.roomType}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}

                              {accommodation.boardBasis && (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                    <RestaurantIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Maitinimas:
                                      </Typography>
                                      <Typography variant="body1">
                                        {translateBoardBasisType(accommodation.boardBasis)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}

                              {accommodation.price && (
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                    <EuroIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Kaina:
                                      </Typography>
                                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                                        {new Intl.NumberFormat("lt-LT", {
                                          style: "currency",
                                          currency: "EUR",
                                        }).format(accommodation.price)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}

                              {accommodation.hotelLink && (
                                <Grid item xs={12}>
                                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                    <LocationIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Adresas:
                                      </Typography>
                                      <Typography variant="body1">{accommodation.hotelLink}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>

                            {accommodation.description && (
                              <>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                                  <DescriptionIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Aprašymas:
                                    </Typography>
                                    <Typography variant="body1">{accommodation.description}</Typography>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Map Section */}
                      {accommodation.hotelLink && (
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined" sx={{ height: "100%", minHeight: 400 }}>
                            <CardContent sx={{ height: "100%", p: 0 }}>
                              <Box sx={{ height: "100%" }}>
                                <LeafletMapDisplay address={accommodation.hotelLink} />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>
              ))}
            </Paper>
          )}

          {/* Simplified Itinerary */}
          <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Pasiūlymas
            </Typography>
            <Typography variant="body1" paragraph>
              {offer.itinerary.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {offer.itinerary.steps.map((step, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                  {step.description}
                </Typography>

                {/* Transports - no accordion */}
                {step.transports.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Transportas
                    </Typography>
                    {step.transports.map((transport, tIndex) => (
                      <Card key={tIndex} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Box sx={{ mr: 1 }}>{getTransportIcon(transport.transportType)}</Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {transport.companyName} - {transport.transportName}
                              {transport.transportCode && ` (${transport.transportCode})`}
                            </Typography>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <LocationIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                <Typography variant="body2">
                                  Išvykimas: <strong>{transport.departurePlace}</strong>
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <TimeIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                <Typography variant="body2">
                                  {formatDate(transport.departureTime)}, {formatTime(transport.departureTime)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <LocationIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                <Typography variant="body2">
                                  Atvykimas: <strong>{transport.arrivalPlace}</strong>
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <TimeIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                <Typography variant="body2">
                                  {formatDate(transport.arrivalTime)}, {formatTime(transport.arrivalTime)}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {transport.description && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                              {transport.description}
                            </Typography>
                          )}

                          {transport.cabinType && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Klasė/Kabina: {transport.cabinType}
                              </Typography>
                            </Box>
                          )}

                          {transport.price && (
                            <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                              <Typography variant="body2" color="text.secondary">
                                Kaina:{" "}
                                <strong>
                                  {new Intl.NumberFormat("lt-LT", {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(transport.price)}
                                </strong>
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Paper>

          {/* Need Help Section */}
          <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Reikia pagalbos?
            </Typography>
            <Typography variant="body1" paragraph>
              Turite klausimų apie šią kelionę? Susisiekite su mumis ir mielai padėsime!
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                  +370 600 00000
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                  info@keliones.lt
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Reservation Card */}
          <Paper
            ref={reservationSectionRef}
            elevation={3}
            sx={{
              borderRadius: 2,
              p: 3,
              background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
            }}
          >
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Kelionės kaina
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Kaina asmeniui nuo
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {new Intl.NumberFormat("lt-LT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(offer.price)}
                  </Typography>
                </Box>

                {/* Fix the price calculation (remove multiplication) */}
                <Box sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Bendra kaina ({offer.adultsCount + offer.childrenCount} asm.)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {new Intl.NumberFormat("lt-LT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(offer.price)}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                  Pasiūlymas galioja iki {formatDate(offer.validUntil)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleReserve}
                  sx={{ py: 2, fontWeight: "bold" }}
                >
                  Rezervuoti kelionę
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default SpecialOfferDetailsPage

