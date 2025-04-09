"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Paper,
  Alert,
  Autocomplete,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { ArrowForward, ExpandMore, Delete as DeleteIcon, Hotel, DirectionsCar, Sailing } from "@mui/icons-material"
import CustomSnackbar from "../CustomSnackBar"
import ConstrainedDateTimePicker from "../ConstrainedDateTimePicker"
import type { PublicOfferWizardData, Accommodation, Transport, Cruise } from "./CreatePublicOfferWizardForm"
import { validateDateTimeConstraints } from "../../Utils/validationUtils"
import OfferImageUpload from "../ClientOfferWizard/OfferImageUpload"
import AddEventMenu from "./AddEventMenu"
import DestinationAutocomplete from "../DestinationAutocomplete"
import type { Country } from "../DestinationAutocomplete"
import countries from "../../assets/full-countries-lt.json"

interface Step1Props {
  initialData: PublicOfferWizardData
  onSubmit: (data: Partial<PublicOfferWizardData>) => void
}

const Step1OfferDetails: React.FC<Step1Props> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<PublicOfferWizardData>({
    ...initialData,
    destination: initialData.destination || "",
  })

  const [dateError, setDateError] = useState<string | null>(null)
  const [validUntilError, setValidUntilError] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")
  const [timeErrors, setTimeErrors] = useState<Record<string, string | null>>({})

  // If startDate/endDate are set, do immediate validation
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const validation = validateDateTimeConstraints(formData.startDate, formData.endDate)
      if (!validation.isValid) {
        setDateError(validation.errorMessage)
      } else {
        setDateError(null)
      }
    } else {
      setDateError(null)
    }

    // Validate validUntil date is in the future
    if (formData.validUntil) {
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Set to start of today
      if (formData.validUntil.toDate() < now) {
        setValidUntilError("Galiojimo data turi būti ateityje")
      } else {
        setValidUntilError(null)
      }
    } else {
      setValidUntilError(null)
    }
  }, [formData.startDate, formData.endDate, formData.validUntil])

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const handleDateChange = (field: "startDate" | "endDate" | "validUntil", newValue: any) => {
    handleInputChange(field, newValue)

    if (field === "startDate" && formData.endDate && newValue) {
      const validation = validateDateTimeConstraints(newValue, formData.endDate)
      if (!validation.isValid) {
        setSnackbarMessage(validation.errorMessage || "Pabaigos data negali būti ankstesnė už pradžios datą")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    if (field === "endDate" && formData.startDate && newValue) {
      const validation = validateDateTimeConstraints(formData.startDate, newValue)
      if (!validation.isValid) {
        setSnackbarMessage(validation.errorMessage || "Pabaigos data negali būti ankstesnė už pradžios datą")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    if (field === "validUntil" && newValue) {
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Set to start of today
      if (newValue.toDate() < now) {
        setSnackbarMessage("Galiojimo data turi būti ateityje")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }
  }

  // Validate time constraints and show error if needed
  const validateTimeConstraint = (startTime: any, endTime: any, errorKey: string): boolean => {
    if (startTime && endTime && endTime.isBefore(startTime)) {
      const errorMessage = "Pabaigos laikas negali būti ankstesnis už pradžios laiką"
      setTimeErrors((prev) => {
        if (prev[errorKey] === errorMessage) {
          return prev
        }
        return {
          ...prev,
          [errorKey]: errorMessage,
        }
      })

      // Also show in snackbar
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)

      return false
    } else {
      setTimeErrors((prev) => {
        if (prev[errorKey] === null) {
          return prev
        }
        return {
          ...prev,
          [errorKey]: null,
        }
      })
      return true
    }
  }

  // Handle accommodation date changes with validation
  const handleAccommodationDateChange = (accIndex: number, field: "checkIn" | "checkOut", value: any) => {
    const acc = formData.accommodations[accIndex]
    const errorKey = `acc-${accIndex}`

    // Determine which dates to validate
    const startDate = field === "checkIn" ? value : acc.checkIn
    const endDate = field === "checkOut" ? value : acc.checkOut

    // Update the value first
    const updatedAccommodations = [...formData.accommodations]
    updatedAccommodations[accIndex] = {
      ...updatedAccommodations[accIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      accommodations: updatedAccommodations,
    }))

    // Then validate if both dates exist
    if (startDate && endDate) {
      validateTimeConstraint(startDate, endDate, errorKey)
    }
  }

  // Handle transport time changes with validation
  const handleTransportTimeChange = (transIndex: number, field: "departureTime" | "arrivalTime", value: any) => {
    const trans = formData.transports[transIndex]
    const errorKey = `trans-${transIndex}`

    // Determine which times to validate
    const startTime = field === "departureTime" ? value : trans.departureTime
    const endTime = field === "arrivalTime" ? value : trans.arrivalTime

    // Update the value first
    const updatedTransports = [...formData.transports]
    updatedTransports[transIndex] = {
      ...updatedTransports[transIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      transports: updatedTransports,
    }))

    // Then validate if both times exist
    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  // Handle cruise time changes with validation
  const handleCruiseTimeChange = (cruiseIndex: number, field: "departureTime" | "arrivalTime", value: any) => {
    const cruise = formData.cruises[cruiseIndex]
    const errorKey = `cruise-${cruiseIndex}`

    // Determine which times to validate
    const startTime = field === "departureTime" ? value : cruise.departureTime
    const endTime = field === "arrivalTime" ? value : cruise.arrivalTime

    // Update the value first
    const updatedCruises = [...formData.cruises]
    updatedCruises[cruiseIndex] = {
      ...updatedCruises[cruiseIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      cruises: updatedCruises,
    }))

    // Then validate if both times exist
    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  // Handle accommodation field changes
  const handleAccommodationChange = (accIndex: number, field: keyof Accommodation, value: any) => {
    const updatedAccommodations = [...formData.accommodations]
    if (field === "price") {
      // Ensure price is stored as a number
      updatedAccommodations[accIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedAccommodations[accIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      accommodations: updatedAccommodations,
    }))
  }

  // Handle transport field changes
  const handleTransportChange = (transIndex: number, field: keyof Transport, value: any) => {
    const updatedTransports = [...formData.transports]
    if (field === "price") {
      // Ensure price is stored as a number
      updatedTransports[transIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedTransports[transIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      transports: updatedTransports,
    }))
  }

  // Handle cruise field changes
  const handleCruiseChange = (cruiseIndex: number, field: keyof Cruise, value: any) => {
    const updatedCruises = [...formData.cruises]
    if (field === "price") {
      // Ensure price is stored as a number
      updatedCruises[cruiseIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedCruises[cruiseIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      cruises: updatedCruises,
    }))
  }

  // Add a new accommodation
  const handleAddAccommodation = () => {
    setFormData((prev) => ({
      ...prev,
      accommodations: [
        ...prev.accommodations,
        {
          hotelName: "",
          checkIn: null,
          checkOut: null,
          hotelLink: "",
          description: "",
          boardBasis: "",
          roomType: "",
          price: 0,
        },
      ],
    }))
  }

  // Remove an accommodation
  const handleRemoveAccommodation = (accIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      accommodations: prev.accommodations.filter((_, idx) => idx !== accIndex),
    }))
  }

  // Add a new transport
  const handleAddTransport = () => {
    setFormData((prev) => ({
      ...prev,
      transports: [
        ...prev.transports,
        {
          transportType: "Flight",
          departureTime: null,
          arrivalTime: null,
          departurePlace: "",
          arrivalPlace: "",
          description: "",
          companyName: "",
          transportName: "",
          transportCode: "",
          cabinType: "",
          price: 0,
        },
      ],
    }))
  }

  // Remove a transport
  const handleRemoveTransport = (transIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      transports: prev.transports.filter((_, idx) => idx !== transIndex),
    }))
  }

  // Add a new cruise
  const handleAddCruise = () => {
    setFormData((prev) => ({
      ...prev,
      cruises: [
        ...prev.cruises,
        {
          departureTime: null,
          arrivalTime: null,
          departurePlace: "",
          arrivalPlace: "",
          description: "",
          companyName: "",
          transportName: "",
          transportCode: "",
          cabinType: "",
          price: 0,
        },
      ],
    }))
  }

  // Remove a cruise
  const handleRemoveCruise = (cruiseIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      cruises: prev.cruises.filter((_, idx) => idx !== cruiseIndex),
    }))
  }

  // Handle image changes
  const handleImageChange = (files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      images: files,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check for date errors
    if (dateError || validUntilError) {
      setSnackbarMessage("Prašome ištaisyti klaidas prieš tęsiant.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    // Check for time errors
    const hasTimeErrors = Object.values(timeErrors).some((error) => error !== null)
    if (hasTimeErrors) {
      setSnackbarMessage("Prašome ištaisyti laiko klaidas prieš tęsiant.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    // Validate that all events have required fields filled
    const validationErrors = validateEventRequiredFields()
    if (validationErrors.length > 0) {
      setSnackbarMessage(validationErrors[0])
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    // Validate that all event dates are within the offer date range
    const dateRangeErrors = validateEventDateRanges()
    if (dateRangeErrors.length > 0) {
      setSnackbarMessage(dateRangeErrors[0])
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    onSubmit(formData)
  }

  // Function to validate required fields for all events
  const validateEventRequiredFields = (): string[] => {
    const errors: string[] = []

    // Validate accommodations
    formData.accommodations.forEach((acc, index) => {
      if (!acc.hotelName || acc.hotelName.trim() === "") {
        errors.push(`Apgyvendinimas #${index + 1}: Viešbučio pavadinimas yra privalomas`)
      }
      if (!acc.checkIn) {
        errors.push(`Apgyvendinimas #${index + 1}: Atvykimo data yra privaloma`)
      }
      if (!acc.checkOut) {
        errors.push(`Apgyvendinimas #${index + 1}: Išvykimo data yra privaloma`)
      }
    })

    // Validate transports
    formData.transports.forEach((trans, index) => {
      if (!trans.departurePlace || trans.departurePlace.trim() === "") {
        errors.push(`Transportas #${index + 1}: Išvykimo vieta yra privaloma`)
      }
      if (!trans.arrivalPlace || trans.arrivalPlace.trim() === "") {
        errors.push(`Transportas #${index + 1}: Atvykimo vieta yra privaloma`)
      }
      if (!trans.departureTime) {
        errors.push(`Transportas #${index + 1}: Išvykimo laikas yra privalomas`)
      }
      if (!trans.arrivalTime) {
        errors.push(`Transportas #${index + 1}: Atvykimo laikas yra privalomas`)
      }
    })

    // Validate cruises
    formData.cruises.forEach((cruise, index) => {
      if (!cruise.departurePlace || cruise.departurePlace.trim() === "") {
        errors.push(`Kruizas #${index + 1}: Išvykimo uostas yra privalomas`)
      }
      if (!cruise.arrivalPlace || cruise.arrivalPlace.trim() === "") {
        errors.push(`Kruizas #${index + 1}: Atvykimo uostas yra privalomas`)
      }
      if (!cruise.departureTime) {
        errors.push(`Kruizas #${index + 1}: Išvykimo laikas yra privalomas`)
      }
      if (!cruise.arrivalTime) {
        errors.push(`Kruizas #${index + 1}: Atvykimo laikas yra privalomas`)
      }
    })

    return errors
  }

  // Function to validate that all event dates are within the offer date range
  const validateEventDateRanges = (): string[] => {
    const errors: string[] = []

    // If offer dates aren't set, we can't validate event dates
    if (!formData.startDate || !formData.endDate) {
      return errors
    }

    const offerStartDate = formData.startDate.startOf("day")
    const offerEndDate = formData.endDate.endOf("day")

    // Validate accommodations
    formData.accommodations.forEach((acc, index) => {
      if (acc.checkIn && acc.checkIn.isBefore(offerStartDate)) {
        errors.push(`Apgyvendinimas #${index + 1}: Atvykimo data negali būti ankstesnė nei kelionės pradžios data`)
      }
      if (acc.checkOut && acc.checkOut.isAfter(offerEndDate)) {
        errors.push(`Apgyvendinimas #${index + 1}: Išvykimo data negali būti vėlesnė nei kelionės pabaigos data`)
      }
    })

    // Validate transports
    formData.transports.forEach((trans, index) => {
      if (trans.departureTime && trans.departureTime.isBefore(offerStartDate)) {
        errors.push(`Transportas #${index + 1}: Išvykimo laikas negali būti ankstesnis nei kelionės pradžios data`)
      }
      if (trans.arrivalTime && trans.arrivalTime.isAfter(offerEndDate)) {
        errors.push(`Transportas #${index + 1}: Atvykimo laikas negali būti vėlesnis nei kelionės pabaigos data`)
      }
    })

    // Validate cruises
    formData.cruises.forEach((cruise, index) => {
      if (cruise.departureTime && cruise.departureTime.isBefore(offerStartDate)) {
        errors.push(`Kruizas #${index + 1}: Išvykimo laikas negali būti ankstesnis nei kelionės pradžios data`)
      }
      if (cruise.arrivalTime && cruise.arrivalTime.isAfter(offerEndDate)) {
        errors.push(`Kruizas #${index + 1}: Atvykimo laikas negali būti vėlesnis nei kelionės pabaigos data`)
      }
    })

    return errors
  }

  // Helper arrays for dropdowns
  const boardBasisOptions = [
    { value: "BedAndBreakfast", label: "Nakvynė su pusryčiais" },
    { value: "HalfBoard", label: "Pusryčiai ir vakarienė" },
    { value: "FullBoard", label: "Pusryčiai, pietūs ir vakarienė" },
    { value: "AllInclusive", label: "Viskas įskaičiuota" },
    { value: "UltraAllInclusive", label: "Ultra viskas įskaičiuota" },
  ]

  const transportTypeOptions = [
    { value: "Flight", label: "Skrydis" },
    { value: "Train", label: "Traukinys" },
    { value: "Bus", label: "Autobusas" },
    { value: "Car", label: "Automobilis" },
    { value: "Ferry", label: "Keltas" },
  ]

  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Kelionės pavadinimas"
            name="tripName"
            value={formData.tripName}
            onChange={(e) => handleInputChange("tripName", e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <DestinationAutocomplete
            value={formData.destination ? { code: "", name: formData.destination } : null}
            onChange={(country) => handleInputChange("destination", country?.name || "")}
            label="Kelionės tikslas"
            required
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Kelionės kategorija"
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            fullWidth
          >
            <MenuItem value="">--Nepasirinkta--</MenuItem>
            <MenuItem value="Tourist">Turistinė</MenuItem>
            <MenuItem value="Group">Grupinė</MenuItem>
            <MenuItem value="Relax">Poilsinė</MenuItem>
            <MenuItem value="Business">Verslo</MenuItem>
            <MenuItem value="Cruise">Kruizas</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Aprašymas"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DatePicker
            label="Kelionės pradžia"
            value={formData.startDate}
            onChange={(newDate) => handleDateChange("startDate", newDate)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <DatePicker
            label="Kelionės pabaiga"
            value={formData.endDate}
            onChange={(newDate) => handleDateChange("endDate", newDate)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          {dateError && (
            <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
              {dateError}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <DatePicker
            label="Galioja iki"
            value={formData.validUntil}
            onChange={(newDate) => handleDateChange("validUntil", newDate)}
            slotProps={{
              textField: { fullWidth: true },
            }}
            disablePast
          />
          {validUntilError && (
            <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
              {validUntilError}
            </Typography>
          )}
        </Grid>

        <Grid item xs={6} md={3}>
          <TextField
            label="Suaugusių skaičius"
            type="number"
            value={formData.adultCount}
            onChange={(e) => handleInputChange("adultCount", Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Vaikų skaičius"
            type="number"
            value={formData.childrenCount}
            onChange={(e) => handleInputChange("childrenCount", Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Pasiūlymo nuotraukos
          </Typography>
          <OfferImageUpload images={formData.images} onImageChange={handleImageChange} />
        </Grid>
      </Grid>

      {/* Divider between main info and offer details */}
      <Divider sx={{ my: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Pasiūlymo elementai
        </Typography>
      </Divider>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {(validateEventRequiredFields().length > 0 || validateEventDateRanges().length > 0) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Yra neužpildytų privalomų laukų arba datų neatitikimų. Prašome patikrinti visus įvestus duomenis.
          </Alert>
        )}
        {/* Add Event Menu */}
        <Box sx={{ mb: 4 }}>
          <AddEventMenu
            onAddAccommodation={handleAddAccommodation}
            onAddTransport={handleAddTransport}
            onAddCruise={handleAddCruise}
          />
        </Box>

        {/* Combined events section */}
        {formData.accommodations.length === 0 && formData.transports.length === 0 && formData.cruises.length === 0 && (
          <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", mb: 2, textAlign: "center" }}>
            Nėra pridėtų pasiūlymo elementų. Naudokite mygtuką viršuje, kad pridėtumėte elementus.
          </Typography>
        )}

        {/* Accommodations */}
        {formData.accommodations.map((acc, accIndex) => (
          <Accordion key={`acc-${accIndex}`} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Hotel sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1">{acc.hotelName || `Apgyvendinimas ${accIndex + 1}`}</Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveAccommodation(accIndex)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Viešbučio pavadinimas"
                    value={acc.hotelName}
                    onChange={(e) => handleAccommodationChange(accIndex, "hotelName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Viešbučio nuoroda"
                    placeholder="https://..."
                    value={acc.hotelLink}
                    onChange={(e) => handleAccommodationChange(accIndex, "hotelLink", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Atvykimo data"
                    value={acc.checkIn}
                    onChange={(newDate) => handleAccommodationDateChange(accIndex, "checkIn", newDate)}
                    minDate={formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Išvykimo data"
                    value={acc.checkOut}
                    onChange={(newDate) => handleAccommodationDateChange(accIndex, "checkOut", newDate)}
                    minDate={acc.checkIn || formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                  {timeErrors[`acc-${accIndex}`] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                      {timeErrors[`acc-${accIndex}`]}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Maitinimo tipas</InputLabel>
                    <Select
                      value={acc.boardBasis}
                      onChange={(e) => handleAccommodationChange(accIndex, "boardBasis", e.target.value)}
                      label="Maitinimo tipas"
                    >
                      <MenuItem value="">-- Pasirinkite --</MenuItem>
                      {boardBasisOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kambario tipas"
                    value={acc.roomType}
                    onChange={(e) => handleAccommodationChange(accIndex, "roomType", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Papildomas aprašymas"
                    value={acc.description}
                    onChange={(e) => handleAccommodationChange(accIndex, "description", e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{ ml: "auto" }}>
                  <TextField
                    label="Kaina (€)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    value={acc.price}
                    onChange={(e) => handleAccommodationChange(accIndex, "price", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Transports */}
        {formData.transports.map((trans, transIndex) => (
          <Accordion key={`trans-${transIndex}`} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <DirectionsCar sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1">{trans.transportName || `Transportas ${transIndex + 1}`}</Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveTransport(transIndex)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Transporto tipas</InputLabel>
                    <Select
                      value={trans.transportType}
                      onChange={(e) => handleTransportChange(transIndex, "transportType", e.target.value)}
                      label="Transporto tipas"
                    >
                      <MenuItem value="">-- Pasirinkite --</MenuItem>
                      {transportTypeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kompanijos pavadinimas"
                    value={trans.companyName}
                    onChange={(e) => handleTransportChange(transIndex, "companyName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Transporto pavadinimas"
                    value={trans.transportName}
                    onChange={(e) => handleTransportChange(transIndex, "transportName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Transporto kodas"
                    value={trans.transportCode}
                    onChange={(e) => handleTransportChange(transIndex, "transportCode", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Išvykimo vieta"
                    value={trans.departurePlace}
                    onChange={(e) => handleTransportChange(transIndex, "departurePlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Išvykimo laikas"
                    value={trans.departureTime}
                    onChange={(newDate) => handleTransportTimeChange(transIndex, "departureTime", newDate)}
                    minDate={formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Atvykimo vieta"
                    value={trans.arrivalPlace}
                    onChange={(e) => handleTransportChange(transIndex, "arrivalPlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Atvykimo laikas"
                    value={trans.arrivalTime}
                    onChange={(newDate) => handleTransportTimeChange(transIndex, "arrivalTime", newDate)}
                    minDate={trans.departureTime || formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                  {timeErrors[`trans-${transIndex}`] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                      {timeErrors[`trans-${transIndex}`]}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Aprašymas"
                    value={trans.description}
                    onChange={(e) => handleTransportChange(transIndex, "description", e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{ ml: "auto" }}>
                  <TextField
                    label="Kaina (€)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    value={trans.price}
                    onChange={(e) => handleTransportChange(transIndex, "price", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Cruises */}
        {formData.cruises.map((cruise, cruiseIndex) => (
          <Accordion key={`cruise-${cruiseIndex}`} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Sailing sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1">{cruise.transportName || `Kruizas ${cruiseIndex + 1}`}</Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveCruise(cruiseIndex)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kruizo kompanija"
                    value={cruise.companyName}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "companyName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Laivo pavadinimas"
                    value={cruise.transportName}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "transportName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kruizo kodas"
                    value={cruise.transportCode}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "transportCode", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kajutės tipas"
                    value={cruise.cabinType}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "cabinType", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Išvykimo uostas"
                    value={cruise.departurePlace}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "departurePlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Išvykimo laikas"
                    value={cruise.departureTime}
                    onChange={(newDate) => handleCruiseTimeChange(cruiseIndex, "departureTime", newDate)}
                    minDate={formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Atvykimo uostas"
                    value={cruise.arrivalPlace}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "arrivalPlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ConstrainedDateTimePicker
                    label="Atvykimo laikas"
                    value={cruise.arrivalTime}
                    onChange={(newDate) => handleCruiseTimeChange(cruiseIndex, "arrivalTime", newDate)}
                    minDate={cruise.departureTime || formData.startDate}
                    maxDate={formData.endDate}
                    onValidationError={(errorMessage) => {
                      setSnackbarMessage(errorMessage)
                      setSnackbarSeverity("error")
                      setSnackbarOpen(true)
                    }}
                  />
                  {timeErrors[`cruise-${cruiseIndex}`] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                      {timeErrors[`cruise-${cruiseIndex}`]}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Papildomas aprašymas"
                    value={cruise.description}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "description", e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{ ml: "auto" }}>
                  <TextField
                    label="Kaina (€)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    value={cruise.price}
                    onChange={(e) => handleCruiseChange(cruiseIndex, "price", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!!dateError || !!validUntilError}
          endIcon={<ArrowForward />}
          sx={{ minWidth: 120 }}
        >
          Toliau
        </Button>
      </Box>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  )
}

export default Step1OfferDetails

