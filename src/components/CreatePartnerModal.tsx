"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Typography,
  Autocomplete,
  Alert,
  InputAdornment,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type CreatePartnerRequest, PartnerType, type PartnerResponse } from "../types/Partner"
import { translatePartnerType } from "../Utils/translateEnums"
import type { Continent, Country } from "../types/Geography"

import continentsData from "../assets/continents.json"
import countriesData from "../assets/full-countries-lt.json"

interface PartnerFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (partner: PartnerResponse) => void
  partner?: PartnerResponse
  isEditing?: boolean
}

const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  partner,
  isEditing = false,
}) => {
  const initialFormState: CreatePartnerRequest = {
    name: "",
    type: PartnerType.Other,
    region: "",
    country: "",
    city: "",
    websiteUrl: "",
    email: "",
    phone: "",
    facebook: "",
    loginEmail: "",
    loginPassword: "",
    notes: "",
    isVisibleToAll: true,
  }

  const [formData, setFormData] = useState<CreatePartnerRequest>(initialFormState)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const continents: Continent[] = continentsData as Continent[]
  const countries: Country[] = countriesData as Country[]

  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    if (isEditing && partner) {
      const partnerFormData: CreatePartnerRequest = {
        name: partner.name || "",
        type:
          typeof partner.type === "string" ? convertTypeStringToEnum(partner.type) : partner.type || PartnerType.Other,
        region: partner.region || "",
        country: partner.country || "",
        city: partner.city || "",
        websiteUrl: partner.websiteUrl || "",
        email: partner.email || "",
        phone: partner.phone || "",
        facebook: partner.facebook || "",
        //  Don't include login credentials in edit mode
        loginEmail: "",
        loginPassword: "",
        notes: partner.notes || "",
        isVisibleToAll: partner.isVisibleToAll !== undefined ? partner.isVisibleToAll : true,
      }

      setFormData(partnerFormData)

      if (partner.region) {
        const continent = continents.find((c) => c.name === partner.region) || null
        setSelectedContinent(continent)
      }

      if (partner.country) {
        const country = countries.find((c) => c.name === partner.country) || null
        setSelectedCountry(country)
      }
    } else {
      setFormData(initialFormState)
      setSelectedContinent(null)
      setSelectedCountry(null)
    }
  }, [isEditing, partner, continents, countries])

  const convertTypeStringToEnum = (typeString: string): PartnerType => {
    const typeMap: Record<string, PartnerType> = {
      HotelSystem: PartnerType.HotelSystem,
      Guide: PartnerType.Guide,
      DestinationPartner: PartnerType.DestinationPartner,
      TransportCompany: PartnerType.TransportCompany,
      Other: PartnerType.Other,
    }

    return typeMap[typeString] !== undefined ? typeMap[typeString] : PartnerType.Other
  }

  const filteredCountries = selectedContinent
    ? countries.filter((country) => country.continent === selectedContinent.name)
    : countries

  useEffect(() => {
    if (selectedCountry) {
      const countryContinent = selectedCountry.continent
      const continent = continents.find((c) => c.name === countryContinent) || null

      if (continent && (!selectedContinent || selectedContinent.name !== countryContinent)) {
        setSelectedContinent(continent)
        setFormData((prev) => ({
          ...prev,
          region: continent.name,
        }))
      }
    }
  }, [selectedCountry, continents, selectedContinent])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    if (!name) return

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleContinentChange = (_event: React.SyntheticEvent, value: Continent | null) => {
    setSelectedContinent(value)
    setFormData((prev) => ({
      ...prev,
      region: value?.name || "",
    }))

    if (value && selectedCountry && selectedCountry.continent !== value.name) {
      setSelectedCountry(null)
      setFormData((prev) => ({
        ...prev,
        country: "",
      }))
    }
  }

  const handleCountryChange = (_event: React.SyntheticEvent, value: Country | null) => {
    setSelectedCountry(value)
    setFormData((prev) => ({
      ...prev,
      country: value?.name || "",
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Pavadinimas yra privalomas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setSubmitError(null)

    try {
      let response

      if (isEditing && partner) {
        //  Remove login credentials from edit request
        const editData = { ...formData }
        delete editData.loginEmail
        delete editData.loginPassword
        
        response = await axios.put<PartnerResponse>(`${API_URL}/Partner/${partner.id}`, editData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      } else {
        response = await axios.post<PartnerResponse>(`${API_URL}/Partner`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      }

      if (!isEditing) {
        setFormData(initialFormState)
        setSelectedContinent(null)
        setSelectedCountry(null)
      }

      if (onSuccess && response.data) {
        onSuccess(response.data)
      }

      onClose()
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSubmitError("Jūs neturite teisių atlikti šį veiksmą.")
      } else {
        setSubmitError(err.response?.data?.message || `Nepavyko ${isEditing ? "atnaujinti" : "sukurti"} partnerio`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormState)
      setErrors({})
      setSubmitError(null)
      setSelectedContinent(null)
      setSelectedCountry(null)
      setShowPassword(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        {isEditing ? "Redaguoti partnerį" : "Naujas partneris"}
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
              Pagrindinė informacija
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Pavadinimas"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading} size="small">
              <InputLabel id="partner-type-label">Tipas</InputLabel>
              <Select
                labelId="partner-type-label"
                name="type"
                value={formData.type}
                label="Tipas"
                onChange={handleChange}
              >
                {Object.values(PartnerType)
                  .filter((value) => typeof value === "number")
                  .map((type) => (
                    <MenuItem key={type} value={type}>
                      {translatePartnerType(type as PartnerType)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              label="El. paštas"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="phone"
              label="Telefonas"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="websiteUrl"
              label="Svetainė"
              value={formData.websiteUrl}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              placeholder="https://example.com"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="facebook"
              label="Facebook"
              value={formData.facebook}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              placeholder="https://facebook.com/example"
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
              Vietos informacija
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={continents}
              getOptionLabel={(option) => option.name}
              value={selectedContinent}
              onChange={handleContinentChange}
              disabled={loading}
              renderInput={(params) => <TextField {...params} label="Žemynas" size="small" fullWidth />}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={filteredCountries}
              getOptionLabel={(option) => option.name}
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={loading}
              renderInput={(params) => <TextField {...params} label="Šalis" size="small" fullWidth />}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              name="city"
              label="Miestas"
              value={formData.city}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              size="small"
            />
          </Grid>

          {/*  Add login credentials section only for creation */}
          {!isEditing && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
                  Prisijungimo duomenys
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="loginEmail"
                  label="Prisijungimo el. paštas"
                  type="email"
                  value={formData.loginEmail}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="loginPassword"
                  label="Prisijungimo slaptažodis"
                  type={showPassword ? "text" : "password"}
                  value={formData.loginPassword}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
              Papildoma informacija
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Pastabos"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              disabled={loading}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isVisibleToAll}
                  onChange={handleCheckboxChange}
                  name="isVisibleToAll"
                  disabled={loading}
                />
              }
              label="Matomas visiems"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose} disabled={loading}>
          Atšaukti
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? "Siunčiama..." : isEditing ? "Išsaugoti" : "Sukurti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PartnerFormModal
