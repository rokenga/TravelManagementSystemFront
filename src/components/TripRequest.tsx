"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DOMPurify from "dompurify"
import {
  TextField,
  Button,
  Typography,
  Grid,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material"
import FlagIcon from "@mui/icons-material/Flag"
import { styled } from "@mui/system"
import axios from "axios"
import CustomSnackbar from "./CustomSnackBar"
import type { TripRequestCreate, TripRequestResponse } from "../types/TripRequest"
import { API_URL } from "../Utils/Configuration"

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
}))

// Maximum character limits
const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 1000

// Validation patterns
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PHONE_PATTERN = /^[0-9]{8}$/ // 8 digits after +370

interface ValidationErrors {
  name?: string
  phone?: string
  email?: string
  message?: string
}

const TripRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success")

  const handleChange = (field: string, value: string) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = DOMPurify.sanitize(value)

    // Apply character limits
    if (field === "name" && sanitizedValue.length > MAX_NAME_LENGTH) return
    if (field === "message" && sanitizedValue.length > MAX_MESSAGE_LENGTH) return

    // For phone field, only allow digits
    if (field === "phone") {
      const newValue = sanitizedValue.replace(/[^0-9]/g, "")
      setFormData({ ...formData, [field]: newValue })
      return
    }

    setFormData({ ...formData, [field]: sanitizedValue })
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Vardas yra privalomas"
      isValid = false
    }

    // Validate phone
    const phoneDigits = formData.phone.replace(/\D/g, "")
    if (phoneDigits && !PHONE_PATTERN.test(phoneDigits)) {
      newErrors.phone = "Telefono numeris turi būti 8 skaitmenų ilgio"
      isValid = false
    }

    // Validate email
    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      newErrors.email = "Neteisingas el. pašto formatas"
      isValid = false
    }

    // Validate message length
    if (formData.message.trim().length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Žinutė negali viršyti ${MAX_MESSAGE_LENGTH} simbolių`
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const token = localStorage.getItem("csrf_token") // CSRF protection (if implemented)

      const payload: TripRequestCreate = {
        fullName: formData.name.trim(),
        phoneNumber: `+370${formData.phone.replace(/\D/g, "")}`.trim(),
        email: formData.email.trim(),
        message: formData.message.trim() || undefined,
      }

      const response = await axios.post<TripRequestResponse>(`${API_URL}/TripRequest`, payload, {
        headers: {
          "X-CSRF-Token": token || "",
          "Content-Type": "application/json",
        },
      })

      if (response.status === 201 || response.status === 200) {
        setFormData({ name: "", phone: "", email: "", message: "" })
        setErrors({})
        setSnackbarMessage("Jūsų užklausa sėkmingai išsiųsta!")
        setSnackbarSeverity("success")
      }
    } catch {
      setSnackbarMessage("Nepavyko išsiųsti užklausos. Bandykite dar kartą.")
      setSnackbarSeverity("error")
    } finally {
      setIsLoading(false)
      setSnackbarOpen(true)
    }
  }

  return (
    <>
      <StyledPaper elevation={3}>
        <Typography variant="h5" align="center" gutterBottom color="primary">
          Susisieksime su Jumis per 1 val.
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          ir paruošime pasiūlymą su karštomis kainomis jau per 24 val.
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vardas"
                variant="outlined"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                disabled={isLoading}
                error={!!errors.name}
                helperText={errors.name || " "} // Empty space to maintain consistent spacing
                inputProps={{ maxLength: MAX_NAME_LENGTH }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefono numeris"
                variant="outlined"
                placeholder="99999999"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={isLoading}
                error={!!errors.phone}
                helperText={errors.phone || "Įveskite 8 skaitmenis po +370"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton disabled={isLoading}>
                        <FlagIcon />
                      </IconButton>
                      +370
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="El.pašto adresas"
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={isLoading}
                error={!!errors.email}
                helperText={errors.email || " "} // Empty space to maintain consistent spacing
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Žinutė (neprivaloma)"
                variant="outlined"
                multiline
                rows={3}
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                disabled={isLoading}
                error={!!errors.message}
                helperText={errors.message || `${formData.message.length}/${MAX_MESSAGE_LENGTH}`}
                inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{
                  backgroundColor: "#F58220",
                  "&:hover": { backgroundColor: "#d66d0e" },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Siųsti"}
              </Button>
            </Grid>
          </Grid>
        </form>
        <Typography variant="body2" align="center" sx={{ fontSize: 14, color: "text.secondary", mt: 2 }}>
          Sutinku su asmens duomenų{" "}
          <a href="#" style={{ color: "#004785", textDecoration: "none" }}>
            privatumo politika
          </a>
        </Typography>
      </StyledPaper>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  )
}

export default TripRequest

