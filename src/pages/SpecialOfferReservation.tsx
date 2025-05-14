"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PublicOfferDetails } from "../types/PublicSpecialOffer"
import type { ParticipantResponse } from "../types/Reservation"
import CustomDateTimePicker from "../components/ReservationDatePicker"
import CustomSnackbar from "../components/CustomSnackBar"
import type { Dayjs } from "dayjs"
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
  CircularProgress,
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
  birthDate: Dayjs | null
  isChild: boolean
}

interface ReservationFormData {
  email: string
  phone: string
  firstName: string
  lastName: string
  birthDate: Dayjs | null
  travelers: TravelerInfo[]
  agreeToTerms: boolean
}

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
  const [isInitialLoading, setIsInitialLoading] = useState(true)
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

  const today = new Date()

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(`${API_URL}/PublicTripOfferFacade/${id}`)
        setOffer(response.data)

        const initialTravelers: TravelerInfo[] = []

        for (let i = 0; i < response.data.adultsCount - 1; i++) {
          initialTravelers.push({ firstName: "", lastName: "", birthDate: null, isChild: false })
        }

        for (let i = 0; i < response.data.childrenCount; i++) {
          initialTravelers.push({ firstName: "", lastName: "", birthDate: null, isChild: true })
        }

        setFormData((prev) => ({
          ...prev,
          travelers: initialTravelers,
        }))
      } catch (err) {
        setError("Nepavyko gauti pasiūlymo detalių. Bandykite vėliau.")
      } finally {
        setLoading(false)
        setTimeout(() => {
          setIsInitialLoading(false)
        }, 1000)
      }
    }

    if (id) {
      fetchOfferDetails()
    }
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) newErrors.email = "El. paštas yra privalomas"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Neteisingas el. pašto formatas"

    if (!formData.phone) newErrors.phone = "Telefono numeris yra privalomas"
    if (!formData.firstName) newErrors.firstName = "Vardas yra privalomas"
    if (!formData.lastName) newErrors.lastName = "Pavardė yra privaloma"
    if (!formData.birthDate) newErrors.birthDate = "Gimimo data yra privaloma"

    if (formData.birthDate) {
      const birthDate = formData.birthDate.toDate()
      if (birthDate > today) {
        newErrors.birthDate = "Gimimo data negali būti ateityje"
      }
    }

    formData.travelers.forEach((traveler, index) => {
      if (!traveler.firstName) newErrors[`traveler${index}FirstName`] = "Vardas yra privalomas"
      if (!traveler.lastName) newErrors[`traveler${index}LastName`] = "Pavardė yra privaloma"
      if (!traveler.birthDate) newErrors[`traveler${index}BirthDate`] = "Gimimo data yra privaloma"

      if (traveler.birthDate) {
        const birthDate = traveler.birthDate.toDate()
        if (birthDate > today) {
          newErrors[`traveler${index}BirthDate`] = "Gimimo data negali būti ateityje"
        }
      }
    })

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

  const handleDateChange = (date: Dayjs | null) => {
    setFormData({
      ...formData,
      birthDate: date,
    })
  }

  const handleTravelerChange = (index: number, field: keyof TravelerInfo, value: string | boolean | Dayjs | null) => {
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
      const participants: ParticipantResponse[] = [
        {
          id: "", 
          name: formData.firstName,
          surname: formData.lastName,
          birthDate: formData.birthDate?.toISOString() || "",
        },
        ...formData.travelers.map((traveler) => ({
          id: "",
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

      await axios.post(`${API_URL}/Reservation/${id}`, reservationData)

      setSnackbar({
        open: true,
        message: "Rezervacija sėkmingai pateikta! Netrukus su jumis susisieks kelionių agentas.",
        severity: "success",
      })

      setTimeout(() => {
        navigate(`/specialOfferDetails/${id}`)
      }, 2000)
    } catch (err) {
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
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
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

  const requiredLabel = (label: string) => (
    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
      {label}
      <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
        *
      </Box>
    </Box>
  )

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {isInitialLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
                  Kelionės rezervacija
                </Typography>

                <Typography
                  variant="h5"
                  color="primary.main"
                  gutterBottom
                  sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                >
                  {offer.tripName}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, my: 2 }}>
                  <Chip
                    icon={<CalendarIcon />}
                    label={`${formatDate(offer.startDate)} - ${formatDate(offer.endDate)}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Chip
                    icon={<PersonIcon />}
                    label={`${offer.adultsCount} suaugę${offer.adultsCount !== 1 ? "" : "s"}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  {offer.childrenCount > 0 && (
                    <Chip
                      icon={<ChildIcon />}
                      label={`${offer.childrenCount} vaik${offer.childrenCount === 1 ? "as" : "ai"}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                  <Chip
                    icon={<ValidUntilIcon />}
                    label={`Galioja iki: ${formatDate(offer.validUntil)}`}
                    color="info"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Chip
                    icon={<EuroIcon />}
                    label={`Kaina: ${new Intl.NumberFormat("lt-LT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(offer.price)}`}
                    color="success"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>
              </Paper>

              <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <form onSubmit={handleSubmit}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                    Užsakymo informacija
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="error">
                      * Privalomi laukai
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                    Pagrindinio keliautojo informacija
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label={requiredLabel("Vardas")}
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        size="small"
                        InputLabelProps={{ required: false }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label={requiredLabel("Pavardė")}
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        size="small"
                        InputLabelProps={{ required: false }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <CustomDateTimePicker
                        label={requiredLabel("Gimimo data")}
                        value={formData.birthDate}
                        onChange={handleDateChange}
                        showTime={false}
                        maxDate={today}
                        disableFuture={true}
                        helperText={errors.birthDate}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={requiredLabel("El. paštas")}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        size="small"
                        InputLabelProps={{ required: false }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={requiredLabel("Telefono numeris")}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        error={!!errors.phone}
                        helperText={errors.phone}
                        size="small"
                        InputLabelProps={{ required: false }}
                      />
                    </Grid>
                  </Grid>

                  {formData.travelers.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                        Papildomi keleiviai
                      </Typography>

                      {formData.travelers.map((traveler, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 3,
                            p: { xs: 1.5, sm: 2 },
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            Keleivis {index + 2} {traveler.isChild ? "(Vaikas)" : "(Suaugęs)"}
                          </Typography>

                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={12} sm={6} md={4}>
                              <TextField
                                label={requiredLabel("Vardas")}
                                value={traveler.firstName}
                                onChange={(e) => handleTravelerChange(index, "firstName", e.target.value)}
                                fullWidth
                                required
                                error={!!errors[`traveler${index}FirstName`]}
                                helperText={errors[`traveler${index}FirstName`]}
                                size="small"
                                InputLabelProps={{ required: false }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <TextField
                                label={requiredLabel("Pavardė")}
                                value={traveler.lastName}
                                onChange={(e) => handleTravelerChange(index, "lastName", e.target.value)}
                                fullWidth
                                required
                                error={!!errors[`traveler${index}LastName`]}
                                helperText={errors[`traveler${index}LastName`]}
                                size="small"
                                InputLabelProps={{ required: false }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <CustomDateTimePicker
                                label={requiredLabel("Gimimo data")}
                                value={traveler.birthDate}
                                onChange={(date) => handleTravelerChange(index, "birthDate", date)}
                                showTime={false}
                                maxDate={today}
                                disableFuture={true}
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
                      label={
                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                          Sutinku, kad su manimi nurodytu el. pašto arba telefono numeriu susisieks agentas
                          <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                            *
                          </Box>
                        </Typography>
                      }
                    />
                    {errors.agreeToTerms && (
                      <Typography color="error" variant="caption" display="block">
                        {errors.agreeToTerms}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      justifyContent: "space-between",
                      mt: 4,
                    }}
                  >
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate(`/specialOfferDetails/${id}`)}
                      sx={{ 
                        minWidth: { xs: "100%", sm: "200px" },
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 500
                      }}
                    >
                      Atgal į pasiūlymą
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      sx={{ 
                        minWidth: { xs: "100%", sm: "200px" },
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 500
                      }}
                    >
                      {submitting ? "Siunčiama..." : "Rezervuoti"}
                    </Button>
                  </Box>
                </form>
              </Paper>
            </Grid>
          </Grid>

          <CustomSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={handleCloseSnackbar}
          />
        </>
      )}
    </Container>
  )
}

export default SpecialOfferReservationPage
