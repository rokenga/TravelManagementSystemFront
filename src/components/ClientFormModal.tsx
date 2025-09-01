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
  Autocomplete,
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
import type { CompanyResponse } from "../types/Company"

interface ClientFormData {
  name: string
  surname: string
  phoneNumber: string
  email: string
  birthday: Dayjs | null
  notes: string
  companyId: string | null
  occupation: string
}

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  clientId?: string
  initialData?: Partial<ClientFormData>
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
    companyId: null,
    occupation: "",
  })

  const [companies, setCompanies] = useState<CompanyResponse[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(false)
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
      companyId: null as string | null,
      occupation: "",
    }),
    [],
  )

  // Fetch companies for autocomplete
  const fetchCompanies = useCallback(async () => {
    try {
      setCompaniesLoading(true)
      const response = await axios.get<CompanyResponse[]>(`${API_URL}/Company`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setCompanies(response.data)
    } catch (error) {
      console.error("Error fetching companies:", error)
    } finally {
      setCompaniesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchCompanies()
    }
  }, [open, fetchCompanies])

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
            companyId: clientData.companyId || null,
            occupation: clientData.occupation || "",
          })

          // Set selected company if exists
          if (clientData.companyId && companies.length > 0) {
            const company = companies.find((c) => c.id === clientData.companyId)
            setSelectedCompany(company || null)
          }
        } catch (err) {
          setSnackbarMessage("Nepavyko gauti kliento duomenų.")
          setSnackbarSeverity("error")
          setSnackbarOpen(true)
        } finally {
          setFetchLoading(false)
        }
      }

      if (companies.length > 0) {
        fetchClientData()
      }
    } else if (open && !isEditMode) {
      setFormData(initialFormData())
      setSelectedCompany(null)
    }
  }, [open, isEditMode, clientId, initialFormData, companies])

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

  const handleCompanyChange = (event: any, newValue: CompanyResponse | null) => {
    setSelectedCompany(newValue)
    setFormData((prev) => ({
      ...prev,
      companyId: newValue?.id || null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
      birthday: formData.birthday ? formData.birthday.format("YYYY-MM-DD") : null,
      companyId: formData.companyId,
      occupation: formData.occupation.trim(),
    }

    try {
      let response

      if (isEditMode && clientId) {
        response = await axios.put(`${API_URL}/Client/${clientId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setSnackbarMessage("Klientas sėkmingai atnaujintas!")
      } else {
        response = await axios.post(`${API_URL}/Client`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setSnackbarMessage("Klientas sėkmingai sukurtas!")
      }

      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (error: any) {
      if (error.response) {
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
                showTime={false}
              />

              <Autocomplete
                options={companies}
                getOptionLabel={(option) => option.name}
                value={selectedCompany}
                onChange={handleCompanyChange}
                loading={companiesLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Įmonė"
                    placeholder="Pasirinkite įmonę..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {companiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="Įmonių nerasta"
              />

              {selectedCompany && (
                <TextField
                  label="Pareigos"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Įveskite pareigas įmonėje..."
                />
              )}

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
