"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Link as MuiLink,
  InputAdornment,
  IconButton,
} from "@mui/material"
import { LockReset, Visibility, VisibilityOff } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Link, useNavigate, useLocation } from "react-router-dom"

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formErrors, setFormErrors] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenParam = params.get("token")
    const emailParam = params.get("email")

    if (tokenParam) setToken(tokenParam)
    if (emailParam) setEmail(emailParam)
    
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [location])

  const validateForm = (): boolean => {
    const errors = {
      email: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
    }
    let isValid = true

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = "El. paštas yra privalomas"
      isValid = false
    } else if (!emailRegex.test(email)) {
      errors.email = "Neteisingas el. pašto formatas"
      isValid = false
    }

    if (!token) {
      errors.token = "Atstatymo kodas yra privalomas"
      isValid = false
    }

    if (!newPassword) {
      errors.newPassword = "Naujas slaptažodis yra privalomas"
      isValid = false
    } else if (newPassword.length < 6) {
      errors.newPassword = "Slaptažodis turi būti bent 6 simbolių ilgio"
      isValid = false
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Pakartokite naują slaptažodį"
      isValid = false
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Slaptažodžiai nesutampa"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await axios.post(`${API_URL}/Auth/reset-password`, {
        email,
        token,
        newPassword,
      })
      setSuccess(true)

      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Įvyko klaida atstatant slaptažodį. Patikrinkite įvestus duomenis ir bandykite dar kartą.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      {isInitialLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            borderTop: 3,
            borderColor: "primary.main",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
            <LockReset fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
            Slaptažodžio keitimas
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
            Įveskite naują slaptažodį, kurį naudosite prisijungimui.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Jūsų slaptažodis sėkmingai pakeistas! Dabar galite prisijungti naudodami naują slaptažodį.
              </Alert>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                color="primary"
                sx={{ mt: 2, textTransform: "none" }}
              >
                Eiti į prisijungimo puslapį
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="El. paštas"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={!!location.search.includes("email=")}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Naujas slaptažodis"
                type={showPassword ? "text" : "password"}
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!formErrors.newPassword}
                helperText={formErrors.newPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Pakartokite naują slaptažodį"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, textTransform: "none" }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Pakeisti slaptažodį"}
              </Button>

              <Box sx={{ mt: 3, textAlign: "center" }}>
                <MuiLink component={Link} to="/login" variant="body2" color="primary">
                  Grįžti į prisijungimo puslapį
                </MuiLink>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  )
}

export default ResetPassword
