"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import CustomSnackbar from "./CustomSnackBar"
import CloseIcon from "@mui/icons-material/Close"
import CustomDateTimePicker from "./CustomDatePicker"

interface ClientFormData {
  name: string
  surname: string
  phoneNumber: string
  email: string
  birthday: Dayjs | null
  notes: string
}

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  clientId?: string // If provided, we're in edit mode
  initialData?: Partial<ClientFormData> // Initial data for edit mode
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ open, onClose, onSuccess, clientId, initialData }) => {
  const isEditMode = Boolean(clientId)

  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    surname: "",
    phoneNumber: "",
    email: "",
    birthday: null,
    notes: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success")

  const initialFormData = useCallback(
    () => ({
      name: "",
      surname: "",
      phoneNumber: "",
      email: "",
      birthday: null as Dayjs | null,
      notes: "",
    }),
    [],
  )

  // Fetch client data if in edit mode
  useEffect(() => {
    if (open && isEditMode && clientId) {
      const fetchClientData = async () => {
        setFetchLoading(true)
        try {
          const response = await axios.get(`${API_URL}/Client/${clientId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          })

          const clientData = response.data
          setFormData({
            name: clientData.name || "",
            surname: clientData.surname || "",
            phoneNumber: clientData.phoneNumber || "",
            email: clientData.email || "",
            birthday: clientData.birthday ? dayjs(clientData.birthday) : null,
            notes: clientData.notes || "",
          })
        } catch (err) {
          console.error("Error fetching client data:", err)
          setSnackbarMessage("Nepavyko gauti kliento duomenų.")
          setSnackbarSeverity("error")
          setSnackbarOpen(true)
        } finally {
          setFetchLoading(false)
        }
      }

      fetchClientData()
    } else if (open && !isEditMode) {
      // Reset form for create mode
      setFormData(initialFormData())
    }
  }, [open, isEditMode, clientId, initialFormData])

  // Apply initial data if provided (for edit mode)
  useEffect(() => {
    if (initialData && open) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        birthday: initialData.birthday || null,
      }))
    }
  }, [initialData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Construct payload with formatted birthday
    const payload = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
      birthday: formData.birthday ? formData.birthday.format("YYYY-MM-DD") : null,
    }

    try {
      let response

      if (isEditMode && clientId) {
        // Update existing client
        response = await axios.put(`${API_URL}/Client/${clientId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setSnackbarMessage("Klientas sėkmingai atnaujintas!")
      } else {
        // Create new client
        response = await axios.post(`${API_URL}/Client`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setSnackbarMessage("Klientas sėkmingai sukurtas!")
      }

      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Wait a bit before closing the modal
      setTimeout(() => {
        onClose()
        // Call onSuccess callback to refresh the client list
        if (onSuccess) {
          console.log("Calling onSuccess callback to refresh client list")
          onSuccess()
        }
      }, 1500)
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} client:`, error)

      // Check if backend provided an error response
      if (error.response) {
        console.log("Server Response:", error.response.data)
        setSnackbarMessage(error.response.data?.message || `Nepavyko ${isEditMode ? "atnaujinti" : "sukurti"} kliento.`)
      } else {
        setSnackbarMessage("Serverio klaida, bandykite dar kartą.")
      }

      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="lt">
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 5,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5">{isEditMode ? "Redaguoti klientą" : "Sukurti naują klientą"}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {fetchLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              component="form"
              id="client-form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
            >
              <TextField label="Vardas" name="name" value={formData.name} onChange={handleChange} fullWidth required />
              <TextField
                label="Pavardė"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Telefono numeris"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="El. paštas"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                fullWidth
                required
              />
              <CustomDateTimePicker
                label="Gimimo data"
                value={formData.birthday}
                onChange={(newDate: any) => setFormData((prev) => ({ ...prev, birthday: newDate }))}
                showTime={false} // No time selection for birthdays
              />
              <TextField
                label="Pastabos"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            type="submit"
            form="client-form"
            variant="contained"
            color="primary"
            disabled={isLoading || fetchLoading}
            sx={{ textTransform: "none" }}
          >
            {isLoading ? <CircularProgress size={24} /> : isEditMode ? "Išsaugoti pakeitimus" : "Sukurti klientą"}
          </Button>
          <Button variant="outlined" color="secondary" onClick={onClose} sx={{ textTransform: "none" }}>
            Atšaukti
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Snackbar Component */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage || ""}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </LocalizationProvider>
  )
}

export default ClientFormModal
