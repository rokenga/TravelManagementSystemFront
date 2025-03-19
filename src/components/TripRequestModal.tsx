"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  ButtonGroup,
  IconButton,
  Alert,
  Grid,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import LockIcon from "@mui/icons-material/Lock"
import CancelIcon from "@mui/icons-material/Cancel"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import { translateTripRequestStatus } from "../Utils/translateEnums"

interface TripRequestModalProps {
  open: boolean
  onClose: () => void
  requestId: string | null
}

// Consistent typography styles
const typographyStyles = {
  fontSize: "1rem",
  fontWeight: 400,
}

const getStatusColor = (status: TripRequestStatus) => {
  switch (status) {
    case TripRequestStatus.New:
      return "#4caf50" // Green
    case TripRequestStatus.Locked:
      return "#ff9800" // Orange
    case TripRequestStatus.Confirmed:
      return "#2196f3" // Blue
    default:
      return "#757575" // Grey
  }
}

const TripRequestModal: React.FC<TripRequestModalProps> = ({ open, onClose, requestId }) => {
  const [request, setRequest] = useState<TripRequestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails(requestId)
    } else {
      setRequest(null)
    }
  }, [open, requestId])

  const fetchRequestDetails = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<TripRequestResponse>(`${API_URL}/TripRequest/${id}`)
      setRequest(response.data)
    } catch (err) {
      console.error("Klaida gaunant užklausos detales:", err)
      setError("Nepavyko gauti užklausos detalių.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!request) return

    setActionLoading(true)
    try {
      await axios.put(`${API_URL}/TripRequest/${request.id}`)
      // Refresh the request details
      fetchRequestDetails(request.id)
    } catch (err) {
      console.error("Klaida patvirtinant užklausą:", err)
      setError("Nepavyko patvirtinti užklausos.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleLock = async () => {
    if (!request) return

    setActionLoading(true)
    try {
      await axios.put(`${API_URL}/TripRequest/${request.id}/lock`)
      // Refresh the request details
      fetchRequestDetails(request.id)
    } catch (err) {
      console.error("Klaida užrakinant užklausą:", err)
      setError("Nepavyko užrakinti užklausos.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!request) return

    setActionLoading(true)
    try {
      await axios.put(`${API_URL}/TripRequest/${request.id}/cancel`)
      // Refresh the request details
      fetchRequestDetails(request.id)
    } catch (err) {
      console.error("Klaida atšaukiant užklausą:", err)
      setError("Nepavyko atšaukti užklausos.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button onClick={onClose} variant="outlined">
              Uždaryti
            </Button>
          </Box>
        </Box>
      ) : request ? (
        <>
          <DialogTitle
            sx={{
              bgcolor: getStatusColor(request.status),
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
            }}
          >
            <Typography sx={{ ...typographyStyles, fontSize: "1.25rem" }}>
              Kelionės užklausa - {translateTripRequestStatus(request.status)}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 1,
              bgcolor: "#f5f5f5",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <ButtonGroup variant="contained" disabled={actionLoading}>
              {request.status === TripRequestStatus.New && (
                <>
                  <Button startIcon={<CheckCircleIcon />} color="success" onClick={handleConfirm}>
                    Patvirtinti
                  </Button>
                  <Button startIcon={<LockIcon />} color="warning" onClick={handleLock}>
                    Užrakinti
                  </Button>
                </>
              )}
              {request.status === TripRequestStatus.Locked && (
                <>
                  <Button startIcon={<CheckCircleIcon />} color="success" onClick={handleConfirm}>
                    Patvirtinti
                  </Button>
                  <Button startIcon={<CancelIcon />} color="error" onClick={handleCancel}>
                    Atšaukti
                  </Button>
                </>
              )}
              {request.status === TripRequestStatus.Confirmed && (
                <Button startIcon={<CancelIcon />} color="error" onClick={handleCancel}>
                  Atšaukti
                </Button>
              )}
            </ButtonGroup>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            {actionLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  bgcolor: "rgba(255,255,255,0.7)",
                  zIndex: 10,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ ...typographyStyles, fontWeight: 500, mb: 1 }}>Kliento informacija</Typography>
                <Box sx={{ bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  <Typography sx={{ ...typographyStyles, mb: 1 }}>
                    <strong>Vardas ir pavardė:</strong> {request.fullName}
                  </Typography>
                  <Typography sx={{ ...typographyStyles, mb: 1 }}>
                    <strong>El. paštas:</strong> {request.email}
                  </Typography>
                  <Typography sx={{ ...typographyStyles }}>
                    <strong>Tel. numeris:</strong> {request.phoneNumber}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography sx={{ ...typographyStyles, fontWeight: 500, mb: 1 }}>Užklausos informacija</Typography>
                <Box sx={{ bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                  <Typography sx={{ ...typographyStyles, mb: 1 }}>
                    <strong>Sukurta:</strong> {format(new Date(request.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
                  </Typography>
                  <Typography sx={{ ...typographyStyles, mb: 1 }}>
                    <strong>Statusas:</strong> {translateTripRequestStatus(request.status)}
                  </Typography>
                  {request.agentId && (
                    <Typography sx={{ ...typographyStyles }}>
                      <strong>Agentas:</strong> {request.agentId}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {request.message && (
                <Grid item xs={12}>
                  <Typography sx={{ ...typographyStyles, fontWeight: 500, mb: 1 }}>Žinutė</Typography>
                  <Box sx={{ bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                    <Typography sx={{ ...typographyStyles }}>{request.message}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Button onClick={onClose} variant="outlined">
              Uždaryti
            </Button>
          </DialogActions>
        </>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 300 }}>
          <Typography>Nėra duomenų</Typography>
        </Box>
      )}
    </Dialog>
  )
}

export default TripRequestModal

