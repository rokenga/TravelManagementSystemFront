"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  Avatar,
  Divider,
  Alert,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from "@mui/material"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "../components/CustomSnackBar"
import { Security, Key, ContentCopy, QrCode2, CheckCircle, Info } from "@mui/icons-material"

const TwoFactorSetup = () => {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [sharedKey, setSharedKey] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [verifying, setVerifying] = useState<boolean>(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [error, setError] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const response = await axios.get(`${API_URL}/Auth/2fa/setup`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })

        setQrCode(`data:image/png;base64,${response.data.qrCodeImageBase64}`)
        setSharedKey(response.data.sharedKey)
      } catch (err) {
        setSnackbar({ open: true, message: "Nepavyko sugeneruoti QR kodo", severity: "error" })
        setError("Nepavyko sugeneruoti QR kodo. Bandykite dar kartą vėliau.")
      } finally {
        setLoading(false)
      }
    }

    fetchQrCode()
  }, [])

  const handleEnable2FA = async () => {
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      setError("Įveskite 6 skaitmenų kodą")
      return
    }

    setVerifying(true)
    setError(null)

    try {
      await axios.post(
        `${API_URL}/Auth/2fa/enable`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      setSnackbar({ open: true, message: "Dviejų faktorių autentifikacija sėkmingai įjungta!", severity: "success" })
      setTimeout(() => navigate("/login"), 1500)
    } catch (err) {
      setError("Neteisingas kodas. Patikrinkite ir bandykite dar kartą.")
      setVerifying(false)
    }
  }

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sharedKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  // Handle code input to only allow numbers
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setCode(value.slice(0, 6))
    }
  }

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
          <Security fontSize="large" />
        </Avatar>

        <Typography variant="h5" gutterBottom fontWeight="medium" color="primary.main">
          Nustatyti dviejų faktorių autentifikaciją
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          Dviejų faktorių autentifikacija padeda apsaugoti jūsų paskyrą net jei slaptažodis būtų atskleistas.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", borderTop: 3, borderColor: "primary.main" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <QrCode2 color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="primary.main">
                      1. Nuskenuokite QR kodą
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Atsisiųskite autentifikavimo programėlę, pavyzdžiui, Google Authenticator, Microsoft Authenticator
                    arba Authy, ir nuskenuokite šį QR kodą:
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    {qrCode && (
                      <img
                        src={qrCode || "/placeholder.svg"}
                        alt="QR Code"
                        style={{
                          width: 220, // Increased QR code size
                          height: 220, // Increased QR code size
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                      />
                    )}
                  </Box>

                  <Alert severity="info" sx={{ mb: 2, bgcolor: "primary.light", color: "primary.contrastText" }}>
                    <Typography variant="body2">
                      Jei negalite nuskaityti QR kodo, galite rankiniu būdu įvesti slaptą raktą į savo autentifikavimo
                      programėlę.
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Slaptas raktas:
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      fontWeight: "medium",
                      letterSpacing: "0.5px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      wordBreak: "break-all", // Allow breaking of long text
                    }}
                  >
                    <Box sx={{ mr: 1 }}>{sharedKey}</Box>
                    <Tooltip title={keyCopied ? "Nukopijuota!" : "Kopijuoti raktą"}>
                      <IconButton size="small" onClick={copyToClipboard} color="primary">
                        {keyCopied ? (
                          <CheckCircle fontSize="small" color="success" />
                        ) : (
                          <ContentCopy fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%", borderTop: 3, borderColor: "primary.main" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Key color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="primary.main">
                      2. Įveskite patvirtinimo kodą
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Įveskite 6 skaitmenų kodą iš savo autentifikavimo programėlės, kad patvirtintumėte sėkmingą
                    nustatymą:
                  </Typography>

                  <TextField
                    fullWidth
                    label="Autentifikavimo kodas"
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

                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
                    <Info fontSize="small" color="primary" sx={{ mt: 0.5, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Kodas keičiasi kas 30 sekundžių.
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleEnable2FA}
                    disabled={verifying}
                    sx={{ py: 1.5, textTransform: "none", fontSize: "1rem" }}
                  >
                    {verifying ? <CircularProgress size={24} /> : "Patvirtinti ir įjungti 2FA"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
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

export default TwoFactorSetup
