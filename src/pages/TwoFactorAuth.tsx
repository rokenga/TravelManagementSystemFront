"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Avatar,
  InputAdornment,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material"
import { LockOutlined, VerifiedUser, Key } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "../components/CustomSnackBar"

export default function TwoFactorAuth() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = localStorage.getItem("2fa_user_id")

    if (!userId) {
      setError("Trūksta naudotojo informacijos. Bandykite iš naujo.")
      return
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      setError("Įveskite 6 skaitmenų kodą")
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/Auth/2fa/verify`, {
        userId,
        code,
      })

      localStorage.removeItem("2fa_user_id")
      localStorage.setItem("accessToken", response.data.accessToken)
      localStorage.setItem("refreshToken", response.data.refreshToken)

      setSnackbar({
        open: true,
        message: "Sėkmingai prisijungta!",
        severity: "success",
      })

      setTimeout(() => {
        if (response.data.requiresProfileCompletion) {
          navigate("/complete-profile")
        } else {
          navigate("/")
          window.location.reload()
        }
      }, 1000)
    } catch (err) {
      setError("Neteisingas kodas. Bandykite dar kartą.")
      setLoading(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setCode(value.slice(0, 6))
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          mt: 4,
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
          <LockOutlined fontSize="large" />
        </Avatar>

        <Typography variant="h5" gutterBottom fontWeight="medium" color="primary.main">
          Dviejų žingsnių patvirtinimas
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          Saugumui užtikrinti, įveskite 6 skaitmenų kodą iš jūsų autentifikavimo programėlės.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            label="Patvirtinimo kodas"
            value={code}
            onChange={handleCodeChange}
            inputProps={{
              maxLength: 6,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Key color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", mb: 3, width: "100%" }}>
            <VerifiedUser color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Kodas keičiasi kas 30 sekundžių.
            </Typography>
          </Box>

          <Divider sx={{ width: "100%", mb: 3 }} />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "500",
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Patvirtinti"}
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
