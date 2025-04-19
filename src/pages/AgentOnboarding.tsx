"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Divider,
  Avatar,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material"
import { API_URL } from "../Utils/Configuration"
import axios from "axios"
import CustomSnackbar from "../components/CustomSnackBar"
import CustomDateTimePicker from "../components/CustomDatePicker"
import { Person, Lock, Badge, Visibility, VisibilityOff } from "@mui/icons-material"
import dayjs from "dayjs"
import type { AgentOnboardingRequest, AgentOnboardingResponse } from "../types/AgentOnboarding"

const AgentOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [wantsToReceiveReminders, setWantsToReceiveReminders] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const onboardingToken = params.get("token")
    if (!onboardingToken) {
      navigate("/login")
    } else {
      setToken(onboardingToken)
    }
  }, [navigate])

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = "Slaptažodis yra privalomas"
    } else if (password.length < 6) {
      newErrors.password = "Slaptažodį turi sudaryti bent 6 simboliai"
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Slaptažodžiai nesutampa"
    }

    if (!firstName.trim()) {
      newErrors.firstName = "Vardas yra privalomas"
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Pavardė yra privaloma"
    }

    if (!birthday) {
      newErrors.birthday = "Gimimo data yra privaloma"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const requestData: AgentOnboardingRequest = {
        token,
        password,
        firstName,
        lastName,
        birthday,
        wantsToReceiveReminders,
      }

      const response = await axios.post<AgentOnboardingResponse>(`${API_URL}/Auth/agent-onboarding`, requestData)

      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)

      setSnackbar({
        open: true,
        message: "Paskyra sėkmingai aktyvuota!",
        severity: "success",
      })

      setTimeout(() => {
        navigate("/2fa-setup")
      }, 1500)
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Nepavyko aktyvuoti paskyros. Patikrinkite įvestus duomenis.",
        severity: "error",
      })
      setLoading(false)
    }
  }

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setBirthday(date.format("YYYY-MM-DD"))

      // Clear error if it exists
      if (errors.birthday) {
        const newErrors = { ...errors }
        delete newErrors.birthday
        setErrors(newErrors)
      }
    } else {
      setBirthday("")
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", justifyContent: "center" }}
    >
      <CssBaseline />
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 2,
          mt: -8, // Move the card up a bit
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
          <Person fontSize="large" />
        </Avatar>

        <Typography component="h1" variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Paskyros aktyvavimas
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          Užpildykite žemiau esančią formą, kad aktyvuotumėte savo agento paskyrą.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Slaptažodis"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
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
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Pakartokite slaptažodį"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Vardas"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Pavardė"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <CustomDateTimePicker
                label="Gimimo data"
                value={birthday ? dayjs(birthday) : null}
                onChange={handleDateChange}
                showTime={false}
                disableFuture={true}
                helperText={errors.birthday}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={wantsToReceiveReminders}
                    onChange={(e) => setWantsToReceiveReminders(e.target.checked)}
                    color="primary"
                  />
                }
                label="Noriu gauti priminimus apie artėjančias keliones ir svarbius įvykius"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              py: 1.5,
              mt: 1,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Aktyvuoti paskyrą"}
          </Button>
        </Box>
      </Paper>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity as any}
        onClose={handleSnackbarClose}
      />
    </Container>
  )
}

export default AgentOnboarding
