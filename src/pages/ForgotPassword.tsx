"use client"

import type React from "react"

import { useState } from "react"
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
} from "@mui/material"
import { LockReset } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Link } from "react-router-dom"

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError("El. paštas yra privalomas")
      return false
    } else if (!emailRegex.test(email)) {
      setEmailError("Neteisingas el. pašto formatas")
      return false
    }
    setEmailError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await axios.post(`${API_URL}/Auth/forgot-password`, { email })
      setSuccess(true)
    } catch (err: any) {
      console.error("Error requesting password reset:", err)
      setError("Įvyko klaida siunčiant slaptažodžio atstatymo nuorodą. Patikrinkite el. paštą ir bandykite dar kartą.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
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
          Slaptažodžio atkūrimas
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          Įveskite savo el. paštą, ir mes atsiųsime jums slaptažodžio atstatymo nuorodą.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ width: "100%", textAlign: "center" }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Jei nurodytas el. paštas egzistuoja mūsų sistemoje, slaptažodžio atstatymo nuoroda buvo išsiųsta.
              Patikrinkite savo el. paštą.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Negavote laiško? Patikrinkite savo šlamšto (spam) aplanką arba bandykite dar kartą.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              color="primary"
              sx={{ mt: 2, textTransform: "none" }}
            >
              Grįžti į prisijungimo puslapį
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
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                textTransform: "none",
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Siųsti atstatymo nuorodą"}
            </Button>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <MuiLink component={Link} to="/login" variant="body2" color="primary">
                Grįžti į prisijungimo puslapį
              </MuiLink>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default ForgotPassword
