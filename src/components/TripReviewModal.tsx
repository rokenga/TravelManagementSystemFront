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
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Paper,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import EditIcon from "@mui/icons-material/Edit"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { CreateTripReviewRequest, TripReviewResponse } from "../types/TripReview"

interface TripReviewModalProps {
  open: boolean
  onClose: () => void
  tripId?: string
  onSuccess?: () => void
}

const TripReviewModal: React.FC<TripReviewModalProps> = ({ open, onClose, tripId, onSuccess }) => {
  const [rating, setRating] = useState<number>(0)
  const [text, setText] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<TripReviewResponse | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const token = localStorage.getItem("accessToken")

  // Fetch existing review when modal opens
  useEffect(() => {
    if (open && tripId) {
      fetchReview()
    }
  }, [open, tripId])

  const fetchReview = async () => {
    if (!tripId) return

    setLoading(true)
    try {
      const response = await axios.get<TripReviewResponse>(`${API_URL}/TripReview/trip/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReview(response.data)
      setRating(response.data.rating)
      setText(response.data.text)
      setIsEditing(false)
    } catch (err: any) {
      // If 404, there's no review yet - that's okay
      if (err.response?.status !== 404) {
        console.error("Failed to fetch review:", err)
        setError("Nepavyko gauti atsiliepimo")
      } else {
        // No review exists yet, set to editing mode
        setReview(null)
        setRating(0)
        setText("")
        setIsEditing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!tripId) {
      setError("Kelionės ID nerastas")
      return
    }

    if (rating < 1 || rating > 10) {
      setError("Prašome pateikti įvertinimą nuo 1 iki 10")
      return
    }

    if (!text.trim()) {
      setError("Prašome pateikti atsiliepimo tekstą")
      return
    }

    setLoading(true)
    setError(null)

    const reviewData: CreateTripReviewRequest = {
      tripId,
      text,
      rating,
    }

    try {
      if (review) {
        // Update existing review
        await axios.put(`${API_URL}/TripReview/${review.id}`, reviewData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      } else {
        // Create new review
        await axios.post(`${API_URL}/TripReview`, reviewData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      }

      // Refresh the review data
      await fetchReview()

      if (onSuccess) {
        onSuccess()
      }

      setIsEditing(false)
    } catch (err: any) {
      console.error("Failed to submit review:", err)
      setError(err.response?.data?.message || "Nepavyko pateikti atsiliepimo")
    } finally {
      setLoading(false)
    }
  }

  const renderRatingButtons = () => {
    const buttons = []
    for (let i = 1; i <= 10; i++) {
      buttons.push(
        <Paper
          key={i}
          elevation={rating === i ? 3 : 1}
          sx={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isEditing ? "pointer" : "default",
            borderRadius: "50%",
            border: rating === i ? "2px solid #1976d2" : "1px solid #e0e0e0",
            backgroundColor: rating === i ? "#bbdefb" : "white",
            "&:hover": {
              backgroundColor: isEditing ? "#f5f5f5" : rating === i ? "#bbdefb" : "white",
            },
            mr: 1,
            mb: 1,
          }}
          onClick={() => isEditing && setRating(i)}
        >
          <Typography variant="body1" fontWeight={rating === i ? "bold" : "normal"}>
            {i}
          </Typography>
        </Paper>,
      )
    }
    return buttons
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {review ? "Kelionės atsiliepimas" : "Sukurti kelionės atsiliepimą"}
        <Box>
          {review && !isEditing && (
            <IconButton color="primary" onClick={() => setIsEditing(true)} sx={{ mr: 1 }} disabled={loading}>
              <EditIcon />
            </IconButton>
          )}
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading && !isEditing ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Įvertinimas
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2 }}>{renderRatingButtons()}</Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {rating ? `${rating} iš 10` : "Įvertinimas nepateiktas"}
              </Typography>
            </Box>
            <TextField
              label="Atsiliepimo tekstas"
              multiline
              rows={4}
              fullWidth
              value={text}
              onChange={(e) => isEditing && setText(e.target.value)}
              placeholder="Prašome pateikti atsiliepimą apie kelionę..."
              InputProps={{
                readOnly: !isEditing,
              }}
              sx={{ mt: 2 }}
            />
            {review && !isEditing && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Sukurta: {new Date(review.createdAt).toLocaleDateString("lt-LT")}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        {isEditing ? (
          <>
            <Button
              onClick={handleSubmit}
              color="primary"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? "Siunčiama..." : review ? "Atnaujinti" : "Pateikti"}
            </Button>
            <Button onClick={review ? () => setIsEditing(false) : onClose} color="primary" disabled={loading}>
              Atšaukti
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  )
}

export default TripReviewModal
