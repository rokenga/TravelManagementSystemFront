"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PublicOfferDetails } from "../types/PublicSpecialOffer"
import type { ParticipantResponse } from "../types/Reservation"
import CustomDateTimePicker from "../components/CustomDatePicker"
import CustomSnackbar from "../components/CustomSnackBar"
import type dayjs from "dayjs"
import {
  Container,
  Typography,
  TextField,
  Grid,
  Button,
  Box,
  Paper,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
  Skeleton,
  Chip,
  useTheme,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  EventAvailable as ValidUntilIcon,
  Euro as EuroIcon,
} from "@mui/icons-material"

interface TravelerInfo {
  firstName: string
  lastName: string
  birthDate: dayjs.Dayjs | null
  isChild: boolean
}

interface ReservationFormData {
  email: string
  phone: string
  firstName: string
  lastName: string
  birthDate: dayjs.Dayjs | null
  travelers: TravelerInfo[]
  agreeToTerms: boolean
}

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

const SpecialOfferReservationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [offer, setOffer] = useState<PublicOfferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [formData, setFormData] = useState<ReservationFormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    birthDate: null,
    travelers: [],
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(`${API_URL}/PublicTripOfferFacade/${id}`)
        setOffer(response.data)

        // Initialize travelers array based on offer details
        // First traveler is the main contact person, so we need adultsCount-1 additional adults
        // and childrenCount children
        const initialTravelers: TravelerInfo[] = []

        // Add additional adult travelers (main contact person is handled separately)
        for (let i = 0; i < response.data.adultsCount - 1; i++) {
          initialTravelers.push({ firstName: "", lastName: "", birthDate: null, isChild: false })
        }

        // Add child travelers
        for (let i = 0; i < response.data.childrenCount; i++) {
          initialTravelers.push({ firstName: "", lastName: "", birthDate: null, isChild: true })
        }

        setFormData((prev) => ({
          ...prev,
          travelers: initialTravelers,
        }))
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate main contact person
    if (!formData.email) newErrors.email = "El. paštas yra privalomas"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Neteisingas el. pašto formatas"

    if (!formData.phone) newErrors.phone = "Telefono numeris yra privalomas"
    if (!formData.firstName) newErrors.firstName = "Vardas yra privalomas"
    if (!formData.lastName) newErrors.lastName = "Pavardė yra privaloma"
    if (!formData.birthDate) newErrors.birthDate = "Gimimo data yra privaloma"

    // Validate additional travelers
    formData.travelers.forEach((traveler, index) => {
      if (!traveler.firstName) newErrors[`traveler${index}FirstName`] = "Vardas yra privalomas"
      if (!traveler.lastName) newErrors[`traveler${index}LastName`] = "Pavardė yra privaloma"
      if (!traveler.birthDate) newErrors[`traveler${index}BirthDate`] = "Gimimo data yra privaloma"
    })

    // Validate terms agreement
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "Turite sutikti su sąlygomis"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setFormData({
      ...formData,
      birthDate: date,
    })
  }

  const handleTravelerChange = (
    index: number,
    field: keyof TravelerInfo,
    value: string | boolean | dayjs.Dayjs | null,
  ) => {
    const updatedTravelers = [...formData.travelers]
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      travelers: updatedTravelers,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Prepare data for API according to the expected structure
      const participants: ParticipantResponse[] = [
        // Include main contact person as first participant
        {
          id: "", // Will be assigned by the server
          name: formData.firstName,
          surname: formData.lastName,
          birthDate: formData.birthDate?.toISOString() || "",
        },
        // Include additional travelers
        ...formData.travelers.map((traveler) => ({
          id: "", // Will be assigned by the server
          name: traveler.firstName,
          surname: traveler.lastName,
          birthDate: traveler.birthDate?.toISOString() || "",
        })),
      ]

      const reservationData = {
        email: formData.email,
        phoneNumber: formData.phone,
        participants: participants,
      }

      console.log("Submitting reservation data:", reservationData)

      // Submit to API
      await axios.post(`${API_URL}/Reservation/${id}`, reservationData)

      // Show success message
      setSnackbar({
        open: true,
        message: "Rezervacija sėkmingai pateikta! Netrukus su jumis susisieks kelionių agentas.",
        severity: "success",
      })

      // Navigate back to the offer details after a short delay
      setTimeout(() => {
        navigate(`/specialOfferDetails/${id}`)
      }, 2000)
    } catch (err) {
      console.error("Failed to submit reservation:", err)
      setSnackbar({
        open: true,
        message: "Nepavyko pateikti rezervacijos. Bandykite vėliau.",
        severity: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Paper>
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
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Kelionės rezervacija
            </Typography>

            <Typography variant="h5" color="primary.main" gutterBottom>
              {offer.tripName}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, my: 3 }}>
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
                icon={<ValidUntilIcon />}
                label={`Galioja iki: ${formatDate(offer.validUntil)}`}
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<EuroIcon />}
                label={`Kaina: ${new Intl.NumberFormat("lt-LT", {
                  style: "currency",
                  currency: "EUR",
                }).format(offer.price)}`}
                color="success"
                variant="outlined"
              />
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <form onSubmit={handleSubmit}>
              <Typography variant="h5" gutterBottom>
                Užsakymo informacija
              </Typography>

              <Divider sx={{ mb: 4 }} />

              <Typography variant="h6" gutterBottom>
                Pagrindinio keliautojo informacija
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Vardas"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Pavardė"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <CustomDateTimePicker
                    label="Gimimo data"
                    value={formData.birthDate}
                    onChange={handleDateChange}
                    showTime={false}
                    helperText={errors.birthDate}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="El. paštas"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefono numeris"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!errors.phone}
                    helperText={errors.phone}
                    size="small"
                  />
                </Grid>
              </Grid>

              {formData.travelers.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Papildomi keleiviai
                  </Typography>

                  {formData.travelers.map((traveler, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Keleivis {index + 2} {traveler.isChild ? "(Vaikas)" : "(Suaugęs)"}
                      </Typography>

                      <Grid container spacing={3} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={6} md={4}>
                          <TextField
                            label="Vardas"
                            value={traveler.firstName}
                            onChange={(e) => handleTravelerChange(index, "firstName", e.target.value)}
                            fullWidth
                            required
                            error={!!errors[`traveler${index}FirstName`]}
                            helperText={errors[`traveler${index}FirstName`]}
                            size="small"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <TextField
                            label="Pavardė"
                            value={traveler.lastName}
                            onChange={(e) => handleTravelerChange(index, "lastName", e.target.value)}
                            fullWidth
                            required
                            error={!!errors[`traveler${index}LastName`]}
                            helperText={errors[`traveler${index}LastName`]}
                            size="small"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <CustomDateTimePicker
                            label="Gimimo data"
                            value={traveler.birthDate}
                            onChange={(date) => handleTravelerChange(index, "birthDate", date)}
                            showTime={false}
                            helperText={errors[`traveler${index}BirthDate`]}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </>
              )}

              <Box sx={{ mt: 4, mb: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Sutinku, kad su manimi nurodytu el. pašto arba telefono numeriu susisieks agentas"
                />
                {errors.agreeToTerms && (
                  <Typography color="error" variant="caption" display="block">
                    {errors.agreeToTerms}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={() => navigate(`/specialOfferDetails/${id}`)}>
                  Atgal į pasiūlymą
                </Button>

                <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
                  {submitting ? "Siunčiama..." : "Patvirtinti rezervaciją"}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Success/Error Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default SpecialOfferReservationPage
