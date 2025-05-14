"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material"
import { Close as CloseIcon, Visibility, VisibilityOff } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
    let isValid = true

    if (!currentPassword) {
      newErrors.currentPassword = "Dabartinis slaptažodis yra privalomas"
      isValid = false
    }

    if (!newPassword) {
      newErrors.newPassword = "Naujas slaptažodis yra privalomas"
      isValid = false
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Slaptažodis turi būti bent 6 simbolių ilgio"
      isValid = false
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Pakartokite naują slaptažodį"
      isValid = false
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Slaptažodžiai nesutampa"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await axios.post(
        `${API_URL}/Auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Nepavyko pakeisti slaptažodžio. Patikrinkite, ar teisingai įvedėte dabartinį slaptažodį.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      setSuccess(false)
      setErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Slaptažodžio keitimas
        <IconButton aria-label="close" onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Slaptažodis sėkmingai pakeistas!
            </Alert>
          )}

          <TextField
            margin="dense"
            label="Dabartinis slaptažodis"
            type={showCurrentPassword ? "text" : "password"}
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Naujas slaptažodis"
            type={showNewPassword ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Pakartokite naują slaptažodį"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "space-between" }}>
            <Button onClick={handleClose} disabled={loading}>
              Atšaukti
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || success}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : "Pakeisti"}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ChangePasswordModal
