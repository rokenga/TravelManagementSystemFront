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
  Grid,
  IconButton,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material"
import CustomDateTimePicker from "../components/CustomDatePicker"
import dayjs from "dayjs"
import CloseIcon from "@mui/icons-material/Close"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "../components/CustomSnackBar"

interface User {
  id: string
  email: string
  role: "Admin" | "Agent" | null
  firstName: string
  lastName: string
  birthday: string 
  wantsToReceiveReminders: boolean
}

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (updatedUser: User) => void
  user: User | null
}

interface UpdateProfileRequest {
  firstName: string
  lastName: string
  birthday: dayjs.Dayjs
  wantsReminderEmails: boolean
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
    birthday: dayjs(),
    wantsReminderEmails: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        birthday: user.birthday ? dayjs(user.birthday) : dayjs(),
        wantsReminderEmails: user.wantsToReceiveReminders || false,
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
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

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target
    setFormData((prev) => ({
      ...prev,
      wantsReminderEmails: checked,
    }))
  }

  const handleDateChange = (date: any) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        birthday: date,
      }))

      if (errors.birthday) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.birthday
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "Vardas yra privalomas"
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Pavardė yra privaloma"
    }

    if (!formData.birthday) {
      newErrors.birthday = "Gimimo data yra privaloma"
    } else {
      const today = dayjs()
      const birthDate = formData.birthday

      if (birthDate.isAfter(today)) {
        newErrors.birthday = "Gimimo data negali būti ateityje"
      }

      const age = today.diff(birthDate, "year")
      if (age < 18) {
        newErrors.birthday = "Vartotojas turi būti bent 18 metų amžiaus"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const token = localStorage.getItem("accessToken")

      const response = await axios.put<User>(`${API_URL}/Auth/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (onSuccess && response.data) {
        onSuccess(response.data)
      }

      onClose()
    } catch (err: any) {

      if (err.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Jūs neturite teisių atlikti šį veiksmą.",
          severity: "error",
        })
      } else if (err.response?.status === 400) {
        if (err.response.data?.errors) {
          const serverErrors: Record<string, string> = {}
          Object.entries(err.response.data.errors).forEach(([key, value]) => {
            serverErrors[key.charAt(0).toLowerCase() + key.slice(1)] = Array.isArray(value) ? value[0] : String(value)
          })
          setErrors(serverErrors)

          setSnackbar({
            open: true,
            message: "Patikrinkite įvestus duomenis ir bandykite dar kartą.",
            severity: "error",
          })
        } else {
          setSnackbar({
            open: true,
            message: err.response.data?.message || "Nepavyko atnaujinti profilio. Patikrinkite įvestus duomenis.",
            severity: "error",
          })
        }
      } else {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Nepavyko atnaujinti profilio. Bandykite dar kartą.",
          severity: "error",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setErrors({})
      setSnackbar({ ...snackbar, open: false })
      onClose()
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <>
      <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          Redaguoti profilį
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Asmeninė informacija
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="Vardas"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
                size="medium"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Pavardė"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
                size="medium"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <CustomDateTimePicker
                label="Gimimo data"
                value={formData.birthday}
                onChange={handleDateChange}
                showTime={false}
                disableFuture={true}
                disabled={loading}
                helperText={errors.birthday}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                Pranešimai
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.wantsReminderEmails}
                      onChange={handleSwitchChange}
                      name="wantsReminderEmails"
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Gauti priminimus el. paštu
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gaukite priminimus apie artėjančias keliones ir svarbius įvykius
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
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
            {loading ? "Siunčiama..." : "Išsaugoti"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </>
  )
}

export default EditProfileModal
