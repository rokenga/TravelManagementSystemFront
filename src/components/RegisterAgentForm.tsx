"use client"

import type React from "react"
import { useState } from "react"
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  InputAdornment,
  Paper,
  Divider,
  Alert,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Email, PersonAdd } from "@mui/icons-material"
import CustomSnackbar from "../components/CustomSnackBar"

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const RegisterAgentForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })

  const validateEmail = (email: string) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("El. pašto adresas yra privalomas")
      return
    }

    if (!validateEmail(email)) {
      setError("Neteisingas el. pašto adresas")
      return
    }

    try {
      setLoading(true)
      await axios.post(
        `${API_URL}/Auth/register-agent`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      )

      setSnackbar({
        open: true,
        message: `Agentas ${email} sėkmingai užregistruotas!`,
        severity: "success",
      })

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Failed to register agent:", err)
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("Šis el. pašto adresas jau užregistruotas")
      } else {
        setError("Nepavyko užregistruoti agento. Bandykite dar kartą vėliau.")
      }
      setLoading(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Paper elevation={0}>
      <Box component="form" onSubmit={handleRegister} sx={{ width: "100%", minWidth: 300 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Įveskite agento el. pašto adresą. Agentui bus išsiųstas el. laiškas su nuoroda į paskyros aktyvavimą.
        </Typography>

        <TextField
          fullWidth
          label="El. paštas"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="primary" />
              </InputAdornment>
            ),
          }}
        />

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onClose} disabled={loading} sx={{ px: 3 }}>
            Atšaukti
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
            sx={{ px: 3 }}
          >
            {loading ? "Siunčiama..." : "Registruoti agentą"}
          </Button>
        </Box>

        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity as any}
          onClose={handleSnackbarClose}
        />
      </Box>
    </Paper>
  )
}

export default RegisterAgentForm
