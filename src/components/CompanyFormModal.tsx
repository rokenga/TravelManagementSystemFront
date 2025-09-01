"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { CompanyRequest, CompanyResponse } from "../types/Company"

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  companyId?: string
}

const CompanyFormModal: React.FC<CompanyFormModalProps> = ({ open, onClose, onSuccess, companyId }) => {
  const [formData, setFormData] = useState<CompanyRequest>({
    name: "",
    companyCode: "",
    vatCode: "",
    phoneNumber: "",
    email: "",
    website: "",
    address: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<CompanyRequest>>({})

  const isEditing = Boolean(companyId)

  useEffect(() => {
    if (open && companyId) {
      fetchCompany()
    } else if (open && !companyId) {
      setFormData({
        name: "",
        companyCode: "",
        vatCode: "",
        phoneNumber: "",
        email: "",
        website: "",
        address: "",
      })
      setErrors({})
    }
  }, [open, companyId])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await axios.get<CompanyResponse>(`${API_URL}/Company/${companyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setFormData({
        name: response.data.name,
        companyCode: response.data.companyCode,
        vatCode: response.data.vatCode || "",
        phoneNumber: response.data.phoneNumber || "",
        email: response.data.email || "",
        website: response.data.website || "",
        address: response.data.address || "",
      })
    } catch (error) {
      console.error("Error fetching company:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CompanyRequest> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Pavadinimas yra privalomas"
    }

    if (!formData.companyCode.trim()) {
      newErrors.companyCode = "Įmonės kodas yra privalomas"
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Neteisingas el. pašto formatas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      const payload = {
        ...formData,
        vatCode: formData.vatCode || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
      }

      if (isEditing) {
        await axios.put(`${API_URL}/Company/${companyId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
      } else {
        await axios.post(`${API_URL}/Company`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving company:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CompanyRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">{isEditing ? "Redaguoti įmonę" : "Sukurti naują įmonę"}</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Pavadinimas"
            value={formData.name}
            onChange={handleChange("name")}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Įmonės kodas"
            value={formData.companyCode}
            onChange={handleChange("companyCode")}
            error={Boolean(errors.companyCode)}
            helperText={errors.companyCode}
            fullWidth
            required
          />
          <TextField
            label="PVM kodas"
            value={formData.vatCode}
            onChange={handleChange("vatCode")}
            error={Boolean(errors.vatCode)}
            helperText={errors.vatCode}
            fullWidth
          />
          <TextField
            label="Telefono numeris"
            value={formData.phoneNumber}
            onChange={handleChange("phoneNumber")}
            error={Boolean(errors.phoneNumber)}
            helperText={errors.phoneNumber}
            fullWidth
          />
          <TextField
            label="El. paštas"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
          />
          <TextField
            label="Svetainė"
            value={formData.website}
            onChange={handleChange("website")}
            error={Boolean(errors.website)}
            helperText={errors.website}
            fullWidth
          />
          <TextField
            label="Adresas"
            value={formData.address}
            onChange={handleChange("address")}
            error={Boolean(errors.address)}
            helperText={errors.address}
            fullWidth
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Atšaukti
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {isEditing ? "Išsaugoti" : "Sukurti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompanyFormModal
