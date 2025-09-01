"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from "@mui/material"
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

interface UpdateLoginModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  partnerId: string
}

type Action = "keep" | "set" | "clear"

interface UpdatePartnerLoginRequest {
  loginEmail?: string
  loginPassword?: string
  clearEmail: boolean
  clearPassword: boolean
}

const UpdateLoginModal: React.FC<UpdateLoginModalProps> = ({
  open,
  onClose,
  onSuccess,
  partnerId,
}) => {
  const [emailAction, setEmailAction] = useState<Action>("keep")
  const [passwordAction, setPasswordAction] = useState<Action>("keep")

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hasEmail, setHasEmail] = useState<boolean | null>(null)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  useEffect(() => {
    if (!open) return
    setError(null)
    setEmailAction("keep")
    setPasswordAction("keep")
    setLoginEmail("")
    setLoginPassword("")
    setShowPassword(false)

    const fetchPresence = async () => {
      try {
        const res = await axios.get(`${API_URL}/Partner/${partnerId}/login-info`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setHasEmail(Boolean(res.data?.loginEmail))
        setHasPassword(Boolean(res.data?.loginPassword))
      } catch {
        // If we can't fetch, just hide the status chips
        setHasEmail(null)
        setHasPassword(null)
      }
    }
    fetchPresence()
  }, [open, partnerId, token])

  const canSubmit =
    !(emailAction === "set" && !loginEmail.trim()) &&
    !(passwordAction === "set" && !loginPassword.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const requestData: UpdatePartnerLoginRequest = {
        loginEmail: emailAction === "set" ? loginEmail.trim() : undefined,
        loginPassword: passwordAction === "set" ? loginPassword.trim() : undefined,
        clearEmail: emailAction === "clear",
        clearPassword: passwordAction === "clear",
      }

      await axios.put(`${API_URL}/Partner/${partnerId}/login-info`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Jūs neturite teisių redaguoti šio partnerio prisijungimo duomenų.")
      } else if (err.response?.status === 404) {
        setError("Partneris nerastas.")
      } else {
        setError(err.response?.data?.message || "Nepavyko atnaujinti prisijungimo duomenų.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold">Pakeisti prisijungimo informaciją</Typography>
          <IconButton onClick={handleClose} disabled={loading} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: "grid", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <FormLabel component="legend">Prisijungimo el. paštas</FormLabel>
                {hasEmail !== null && (
                  <Chip
                    size="small"
                    label={hasEmail ? "Šiuo metu: nustatytas" : "Šiuo metu: nėra"}
                    color={hasEmail ? "success" : "default"}
                    variant={hasEmail ? "filled" : "outlined"}
                  />
                )}
              </Box>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  row
                  value={emailAction}
                  onChange={(e) => setEmailAction(e.target.value as Action)}
                >
                  <FormControlLabel value="keep" control={<Radio />} label="Nepakeisti" />
                  <FormControlLabel value="set" control={<Radio />} label="Nustatyti naują" />
                  <FormControlLabel value="clear" control={<Radio />} label="Ištrinti" />
                </RadioGroup>
              </FormControl>

              <TextField
                sx={{ mt: 1 }}
                label="Naujas el. paštas"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                fullWidth
                disabled={loading || emailAction !== "set"}
                required={emailAction === "set"}
                placeholder="Įveskite naują el. paštą"
              />
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <FormLabel component="legend">Slaptažodis</FormLabel>
                {hasPassword !== null && (
                  <Chip
                    size="small"
                    label={hasPassword ? "Šiuo metu: nustatytas" : "Šiuo metu: nėra"}
                    color={hasPassword ? "success" : "default"}
                    variant={hasPassword ? "filled" : "outlined"}
                  />
                )}
              </Box>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  row
                  value={passwordAction}
                  onChange={(e) => setPasswordAction(e.target.value as Action)}
                >
                  <FormControlLabel value="keep" control={<Radio />} label="Nepakeisti" />
                  <FormControlLabel value="set" control={<Radio />} label="Nustatyti naują" />
                  <FormControlLabel value="clear" control={<Radio />} label="Ištrinti" />
                </RadioGroup>
              </FormControl>

              <TextField
                sx={{ mt: 1 }}
                label="Naujas slaptažodis"
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                fullWidth
                disabled={loading || passwordAction !== "set"}
                required={passwordAction === "set"}
                placeholder="Įveskite naują slaptažodį"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading || passwordAction !== "set"}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">Atšaukti</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !canSubmit}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? "Saugoma..." : "Išsaugoti"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default UpdateLoginModal
