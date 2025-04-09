"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Grid, TextField, Button, Typography, Box, Autocomplete, InputAdornment, MenuItem } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { Person, ArrowForward } from "@mui/icons-material"
import CustomSnackbar from "../CustomSnackBar"
import type { OfferWizardData } from "./CreateClientOfferWizardForm"
import { validateDateTimeConstraints } from "../../Utils/validationUtils"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import DestinationAutocomplete, { Country } from "../DestinationAutocomplete"

interface Client {
  id: string
  name: string
  surname: string
  // Add any other fields your API returns
}

interface Step1Props {
  initialData: OfferWizardData
  onSubmit: (data: Partial<OfferWizardData>) => void
}

const Step1TripInfo: React.FC<Step1Props> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    tripName: initialData.tripName || "",
    clientId: initialData.clientId || "",
    clientName: initialData.clientName || null,
    startDate: initialData.startDate || null,
    endDate: initialData.endDate || null,
    clientWishes: initialData.clientWishes || "",
    adultCount: initialData.adultCount || 2,
    childrenCount: initialData.childrenCount || 0,
    category: initialData.category || "",
    description: initialData.description || "",
    insuranceTaken: initialData.insuranceTaken || false,
    destination: initialData.destination || null,
  })

  const [clients, setClients] = useState<Client[]>([])
  const selectedClientIdRef = useRef<string>(initialData.clientId || "")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [dateError, setDateError] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

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
  }, [formData.startDate, formData.endDate])

  // Initialize selected client
  useEffect(() => {
    if (initialData.clientId) {
      const client = clients.find((c) => c.id === initialData.clientId)
      if (client) setSelectedClient(client)
    }
  }, [initialData.clientId, clients])

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClientChange = (newValue: Client | null) => {
    setSelectedClient(newValue)

    // Update both the form state and the ref
    const clientIdValue = newValue?.id || ""
    selectedClientIdRef.current = clientIdValue

    handleInputChange("clientId", clientIdValue)
    handleInputChange("clientName", newValue ? `${newValue.name} ${newValue.surname}` : null)
  }

  const handleDestinationChange = (newValue: Country | null) => {
    handleInputChange("destination", newValue)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const fetchClients = async () => {
    try {
      const response = await axios.get<Client[]>(`${API_URL}/Client/lookup`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClients(response.data)

      // If we have a clientId, try to select it
      if (selectedClientIdRef.current) {
        initializeSelectedClient(selectedClientIdRef.current)
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
    }
  }

  // Add this function to initialize the selected client
  const initializeSelectedClient = async (clientId: string) => {
    // If we already have the list of clients, see if we can find one matching
    const found = clients.find((c) => c.id === clientId)
    if (found) {
      setSelectedClient(found)
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: `${found.name} ${found.surname}`,
      }))
      return
    }

    // Otherwise try a direct fetch
    try {
      const response = await axios.get<Client>(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      if (response.data) {
        setSelectedClient(response.data)
        setFormData((prev) => ({
          ...prev,
          clientId: response.data.id,
          clientName: `${response.data.name} ${response.data.surname}`,
        }))
      }
    } catch (err) {
      console.error("Failed to load single client:", err)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Initialize the ref with the initial client ID
  useEffect(() => {
    if (initialData?.clientId) {
      selectedClientIdRef.current = initialData.clientId
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (dateError) {
      return
    }

    // Use the client ID from the ref to ensure it's not lost
    const clientId = selectedClientIdRef.current

    // The rest of your submit logic...
    onSubmit({
      ...formData,
      clientId: clientId,
    })
  }

  const handleDateChange = (field: "startDate" | "endDate", newValue: any) => {
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
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Pagrindinė informacija
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Kelionės pavadinimas"
            value={formData.tripName}
            onChange={(e) => handleInputChange("tripName", e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => `${option.name} ${option.surname}`}
            value={selectedClient}
            onChange={(_, newValue) => handleClientChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Klientas"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Add destination field */}
        <Grid item xs={12}>
          <DestinationAutocomplete 
            value={formData.destination} 
            onChange={handleDestinationChange}
          />
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

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Kelionės detalės
          </Typography>
        </Grid>

        {/* Category, Adult Count, and Children Count in one line */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={6} md={4}>
              <TextField
                label="Suaugusių skaičius"
                type="number"
                value={formData.adultCount}
                onChange={(e) => handleInputChange("adultCount", Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Vaikų skaičius"
                type="number"
                value={formData.childrenCount}
                onChange={(e) => handleInputChange("childrenCount", Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <DatePicker
            label="Kelionės pradžia"
            value={formData.startDate}
            onChange={(newDate) => handleDateChange("startDate", newDate)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
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

        <Grid item xs={12}>
          <TextField
            label="Kliento norai / komentarai"
            value={formData.clientWishes}
            onChange={(e) => handleInputChange("clientWishes", e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!!dateError}
              endIcon={<ArrowForward />}
              sx={{ minWidth: 120 }}
            >
              Toliau
            </Button>
          </Box>
        </Grid>
      </Grid>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </form>
  )
}

export default Step1TripInfo
