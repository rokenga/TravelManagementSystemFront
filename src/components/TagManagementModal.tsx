"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type ClientTagResponse, TagCategory } from "../types/ClientTag"
import { translateTagCategory } from "../Utils/translateEnums"
import CustomSnackbar from "./CustomSnackBar"

interface Props {
  open: boolean
  onClose: () => void
  clientId: string
  clientTags: ClientTagResponse[] 
  onTagsUpdated?: () => void 
}

const TagManagementModal: React.FC<Props> = ({ open, onClose, clientId, clientTags, onTagsUpdated }) => {
  const [tags, setTags] = useState<Record<string, ClientTagResponse[]>>({})
  const [selectedTags, setSelectedTags] = useState<string[]>(clientTags.map(tag => tag.id))
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open])

  const fetchTags = async () => {
    try {
      const [allTagsRes, clientTagsRes] = await Promise.all([
        axios.get<Record<string, ClientTagResponse[]>>(`${API_URL}/ClientTag`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }),
        axios.get<ClientTagResponse[]>(`${API_URL}/ClientTagAssignment/${clientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }),
      ])
  
      setTags(allTagsRes.data || {})
  
      if (!Array.isArray(clientTagsRes.data)) {
        showSnackbar("Nepavyko gauti kliento žymeklių. Bandykite dar kartą.", "error")
        return
      }
  
      const assignedTagIds = clientTagsRes.data.map(tag => tag.tagId)
      setSelectedTags(assignedTagIds)
    } catch (err) {
      showSnackbar("Nepavyko gauti žymeklių. Bandykite dar kartą.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSave = async () => {
    try {
      await axios.put(
        `${API_URL}/ClientTagAssignment/${clientId}`,
        { tagIds: selectedTags },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }
      )

      showSnackbar("Žymekliai sėkmingai atnaujinti!", "success")
      onTagsUpdated?.()
      onClose()
    } catch (error) {
      showSnackbar("Nepavyko atnaujinti žymeklių. Bandykite dar kartą.", "error")
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Priskirti žymeklius
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 10, top: 10 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
              <CircularProgress />
            </Box>
          ) : Object.keys(tags).length === 0 ? (
            <Typography textAlign="center" color="text.secondary">
              Nėra sukurtų žymeklių.
            </Typography>
          ) : (
            Object.entries(tags).map(([category, tagList]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  {translateTagCategory(category as TagCategory)}
                </Typography>
                {tagList.map(tag => (
                  <FormControlLabel
                    key={tag.id}
                    control={
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                      />
                    }
                    label={tag.name}
                  />
                ))}
              </Box>
            ))
          )}

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Atšaukti
            </Button>
            <Button onClick={handleSave} variant="contained">
              Išsaugoti
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  )
}

export default TagManagementModal
