"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type ClientTagResponse, TagCategory } from "../types/ClientTag"
import { translateTagCategory } from "../Utils/translateEnums"
import CustomSnackbar from "./CustomSnackBar"
import ConfirmationDialog from "./ConfirmationDialog"

interface Props {
  open: boolean
  onClose: () => void
  onTagsUpdated: () => void
}

const categoryColors: Record<TagCategory, string> = {
  [TagCategory.DestinationInterest]: "#FFA726",
  [TagCategory.Other]: "#66BB6A",
  [TagCategory.SpecialRequirements]: "#42A5F5",
  [TagCategory.TravelFrequency]: "#EC407A",
  [TagCategory.TravelPreference]: "#AB47BC",
}

const MIN_TAG_LENGTH = 2
const MAX_TAG_LENGTH = 40

const ClientTagManager: React.FC<Props> = ({ open, onClose, onTagsUpdated }) => {
  const [tags, setTags] = useState<Record<string, ClientTagResponse[]>>({})
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState<TagCategory | "">("")
  const [isSaving, setIsSaving] = useState(false)
  const [editingTag, setEditingTag] = useState<ClientTagResponse | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setNewTagName("")
    setNewTagCategory("")
    setEditingTag(null)
    setNameError(null)
  }

  const fetchTags = async () => {
    try {
      const response = await axios.get<Record<string, ClientTagResponse[]>>(`${API_URL}/ClientTag`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setTags(response.data || {})
    } catch (err: any) {
      showSnackbar("Nepavyko gauti žymeklių. Bandykite dar kartą.", "error")
    }
  }

  const validateTagName = (name: string): boolean => {
    if (name.length < MIN_TAG_LENGTH) {
      setNameError(`Žymeklio pavadinimas turi būti bent ${MIN_TAG_LENGTH} simbolių ilgio.`)
      showSnackbar(`Žymeklio pavadinimas turi būti bent ${MIN_TAG_LENGTH} simbolių ilgio.`, "error")
      return false
    }

    if (name.length > MAX_TAG_LENGTH) {
      setNameError(`Žymeklio pavadinimas negali viršyti ${MAX_TAG_LENGTH} simbolių.`)
      showSnackbar(`Žymeklio pavadinimas negali viršyti ${MAX_TAG_LENGTH} simbolių.`, "error")
      return false
    }

    setNameError(null)
    return true
  }

  const handleSaveTag = async () => {
    if (!newTagName || !newTagCategory) {
      showSnackbar("Užpildykite visus laukelius.", "error")
      return
    }

    if (!validateTagName(newTagName)) {
      return
    }

    setIsSaving(true)
    try {
      if (editingTag) {
        await axios.put(
          `${API_URL}/ClientTag/${editingTag.id}`,
          {
            id: editingTag.id,
            name: newTagName,
            category: newTagCategory,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          },
        )
        showSnackbar("Žymeklis sėkmingai atnaujintas!", "success")
      } else {
        await axios.post(
          `${API_URL}/ClientTag`,
          {
            name: newTagName,
            category: newTagCategory,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          },
        )
        showSnackbar("Naujas žymeklis sėkmingai pridėtas!", "success")
      }

      resetForm()
      fetchTags()

      onTagsUpdated()
    } catch (err) {
      showSnackbar("Nepavyko išsaugoti žymeklio. Bandykite dar kartą.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    try {
      await axios.delete(`${API_URL}/ClientTag/${tagToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      fetchTags()
      showSnackbar("Žymeklis sėkmingai ištrintas!", "success")
      onTagsUpdated()
    } catch (err) {
      showSnackbar("Nepavyko ištrinti žymeklio. Bandykite dar kartą.", "error")
    } finally {
      setDeleteConfirmOpen(false)
      setTagToDelete(null)
    }
  }

  const handleEditTag = (tag: ClientTagResponse) => {
    setNewTagName(tag.name)
    setNewTagCategory(tag.category)
    setEditingTag(tag)
    setNameError(null) 
  }

  const handleTagNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewTagName(value)

    if (nameError) {
      setNameError(null)
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Tvarkyti žymeklius
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 10, top: 10 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {Object.keys(tags).length === 0 ? (
            <Typography textAlign="center" color="text.secondary">
              Nėra sukurtų žymeklių.
            </Typography>
          ) : (
            Object.entries(tags).map(([category, tagList]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {translateTagCategory(category as TagCategory)}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {tagList.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      onDelete={() => {
                        setTagToDelete(tag.id)
                        setDeleteConfirmOpen(true)
                      }}
                      onClick={() => handleEditTag(tag)}
                      sx={{
                        backgroundColor: categoryColors[tag.category as TagCategory],
                        color: "white",
                        "& .MuiChip-deleteIcon": {
                          color: "white",
                        },
                      }}
                      deleteIcon={<Close />}
                    />
                  ))}
                </Box>
              </Box>
            ))
          )}

          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Žymeklio pavadinimas"
              value={newTagName}
              onChange={handleTagNameChange}
              fullWidth
              size="small"
              error={!!nameError}
              helperText={nameError}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                },
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">Kategorija</InputLabel>
              <Select
                labelId="category-select-label"
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}
                label="Kategorija"
                sx={{
                  borderRadius: "4px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.23)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(0, 0, 0, 0.87)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                }}
              >
                {Object.values(TagCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {translateTagCategory(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleSaveTag} disabled={isSaving} fullWidth sx={{ mt: 1 }}>
              {editingTag ? "Atnaujinti" : "Pridėti"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Patvirtinti ištrynimą"
        message="Ar tikrai norite ištrinti šį žymeklį?"
        onConfirm={handleDeleteTag}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  )
}

export default ClientTagManager

