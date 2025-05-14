"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Chip,
  Button,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  Divider,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  Flight as FlightIcon,
  DirectionsCar as CarIcon,
  DirectionsBus as BusIcon,
  DirectionsBoat as BoatIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  Info as InfoIcon,
  DirectionsBus as DirectionsBusIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  Euro as EuroIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from "@mui/icons-material"

import ImageSlider from "../components/ImageSlider"

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })
}

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

const renderStarRating = (rating?: number) => {
  if (!rating) return null

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {[...Array(rating)].map((_, i) => (
        <StarIcon key={i} sx={{ color: "#FFD700", fontSize: "1rem" }} />
      ))}
    </Box>
  )
}

const SpecialOfferDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<PublicOfferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(`${API_URL}/PublicTripOfferFacade/${id}`)
        setOffer(response.data)
      } catch (err) {
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

  const galleryImages: ImageItem[] =
    offer?.files
      .filter((file) => file.type === "Image")
      .map((file) => ({
        id: file.id,
        url: file.url,
        altText: file.altText,
      })) || []

  const allAccommodations = offer?.itinerary.steps.flatMap((step) => step.accommodations || []) || []

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
            <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
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
                  }}
                />
              </Box>
            )}
          </Paper>

          {isMobile && (
            <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
              <Fab color="primary" aria-label="reserve" onClick={handleReserve}>
                <ShoppingCartIcon />
              </Fab>
            </Box>
          )}

          <Paper elevation={3} sx={{ borderRadius: 2, p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography
              variant={isSmallMobile ? "h5" : "h4"}
              gutterBottom
              fontWeight="bold"
              sx={{ color: theme.palette.primary.main, textAlign: "left" }}
            >
              {offer.tripName}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 2,
                "& .MuiChip-root": {
                  height: "32px",
                  fontSize: "0.875rem",
                },
              }}
            >
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
                label={translateTripCategory(offer.category)}
                color="secondary"
                variant="outlined"
              />
              <Chip
                icon={<EuroIcon />}
                label={`Nuo: ${new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(offer.price)}`}
                color="success"
                variant="outlined"
              />
            </Box>

            {/* Trip description */}
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                lineHeight: 1.6,
                color: theme.palette.text.primary,
                textAlign: "left",
              }}
            >
              {offer.description}
            </Typography>
          </Paper>

          {/* Itinerary Steps */}
          {offer.itinerary.steps.map((step, index) => (
            <Paper key={index} elevation={3} sx={{ borderRadius: 2, p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                  mb: 2,
                  textAlign: "left",
                }}
              >
                {step.description}
              </Typography>

              {/* Transport section */}
              {step.transports.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {step.transports.map((transport, tIndex) => (
                    <Box
                      key={tIndex}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: tIndex < step.transports.length - 1 ? "1px solid rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, textAlign: "left", mb: 1 }}
                      >
                        {transport.companyName}
                        {transport.transportName && transport.companyName && " - "}
                        {transport.transportName}
                        {transport.transportCode && ` (${transport.transportCode})`}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                            >
                              Išvykimas:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              <strong>{transport.departurePlace}</strong>
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              {formatDate(transport.departureTime)}, {formatTime(transport.departureTime)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                            >
                              Atvykimas:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              <strong>{transport.arrivalPlace}</strong>
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              {formatDate(transport.arrivalTime)}, {formatTime(transport.arrivalTime)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {transport.cabinType && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            color: "text.secondary",
                            textAlign: "left",
                          }}
                        >
                          Klasė/Kabina: {transport.cabinType}
                        </Typography>
                      )}

                      {transport.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            textAlign: "left",
                          }}
                        >
                          {transport.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {step.transports.length > 0 && step.accommodations.length > 0 && <Divider sx={{ my: 3 }} />}

              {step.accommodations.length > 0 && (
                <Box sx={{ mt: step.transports.length > 0 ? 3 : 0 }}>
                  {step.accommodations.map((accommodation, aIndex) => (
                    <Box
                      key={aIndex}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: aIndex < step.accommodations.length - 1 ? "1px solid rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, textAlign: "left", mb: 1 }}
                      >
                        {accommodation.hotelName}
                        {accommodation.starRating && renderStarRating(accommodation.starRating)}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                            >
                              Įsiregistravimas:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              {formatDate(accommodation.checkIn)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                            >
                              Išsiregistravimas:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                            >
                              {formatDate(accommodation.checkOut)}
                            </Typography>
                          </Box>
                        </Grid>

                        {(accommodation.roomType || accommodation.boardBasis) && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                          </Grid>
                        )}

                        {accommodation.roomType && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                              >
                                Kambario tipas:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                              >
                                {accommodation.roomType}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {accommodation.boardBasis && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, textAlign: "left" }}
                              >
                                Maitinimas:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, textAlign: "left" }}
                              >
                                {translateBoardBasisType(accommodation.boardBasis)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {accommodation.description && <Divider sx={{ my: 1 }} />}

                      {accommodation.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            textAlign: "left",
                          }}
                        >
                          {accommodation.description}
                        </Typography>
                      )}

                      {accommodation.hotelLink && (
                        <Box sx={{ mt: 2, height: 250, borderRadius: 1, overflow: "hidden" }}>
                          <LeafletMapDisplay address={accommodation.hotelLink} height={250} hideErrors={true} />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ))}
        </Grid>

        <Grid item xs={12} md={3}>
          <Box
            sx={{
              position: { xs: "static", md: "sticky" },
              top: "20px",
              width: "100%",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                borderRadius: 2,
                p: { xs: 2, sm: 2.5 },
                mb: 3,
                background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleReserve}
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  fontWeight: "bold",
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  mb: 2,
                }}
              >
                Rezervuoti kelionę
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, textAlign: "left" }}>
                Reikia pagalbos?
              </Typography>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<PhoneIcon />}
                sx={{ py: 1, mb: 1.5, justifyContent: "flex-start" }}
                component="a"
                href="tel:+37037224409"
              >
                +370 37 224409
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<EmailIcon />}
                sx={{ py: 1, justifyContent: "flex-start" }}
                component="a"
                href="mailto:info@saitas.lt"
              >
                info@saitas.lt
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}

export default SpecialOfferDetailsPage
