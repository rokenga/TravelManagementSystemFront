"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Alert,
  Chip,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import EmailIcon from "@mui/icons-material/Email"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import { translateTripRequestStatus } from "../Utils/translateEnums"
import CustomSnackbar from "./CustomSnackBar"
import ConfirmationDialog from "./ConfirmationDialog"

interface TripRequestModalProps {
  open: boolean
  onClose: () => void
  requestId: string | null
}

const getStatusColor = (status: TripRequestStatus) => {
  switch (status) {
    case TripRequestStatus.New:
      return "#4caf50" // Green
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

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
      const response = await axios.get<TripRequestResponse>(`${API_URL}/TripRequest/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      setRequest(response.data)
    } catch (err) {
      console.error("Klaida gaunant užklausos detales:", err)
      setError("Nepavyko gauti užklausos detalių.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false)
  }

  const handleConfirm = async () => {
    if (!request) return
    setConfirmDialogOpen(false)
    setActionLoading(true)

    try {
      await axios.put(`${API_URL}/TripRequest/${request.id}/confirm`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      fetchRequestDetails(request.id)
      setSnackbar({ open: true, message: "Užklausa sėkmingai patvirtinta!", severity: "success" })
    } catch (err: any) {
      console.error("Klaida patvirtinant užklausą:", err)

      // Check for specific error response
      if (err.response && err.response.status === 404) {
        setSnackbar({
          open: true,
          message: "Užklausa jau buvo patvirtinta kito agento.",
          severity: "error",
        })
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko patvirtinti užklausos.",
          severity: "error",
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendEmail = () => {
    if (!request) return

    // Create email subject with client name
    const subject = `Kelionės užklausa - ${request.fullName}`

    // Create email body with some basic information
    const body = `Sveiki ${request.fullName},\n\nDėkojame už jūsų kelionės užklausą.\n\n`

    // Create mailto link with recipient, subject and body
    const mailtoLink = `mailto:${request.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Open default email client
    window.location.href = mailtoLink
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 5,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5">Kelionės užklausa</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Action buttons at the top */}
        {request && !loading && !error && (
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              justifyContent: "flex-start",
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            {request.status === TripRequestStatus.New && (
              <Button
                startIcon={<CheckCircleIcon />}
                variant="contained"
                color="primary"
                onClick={handleConfirmClick}
                disabled={actionLoading}
                sx={{ textTransform: "none" }}
              >
                Patvirtinti
              </Button>
            )}
            {request.status === TripRequestStatus.Confirmed && (
              <Button
                startIcon={<EmailIcon />}
                variant="contained"
                color="primary"
                onClick={handleSendEmail}
                sx={{ textTransform: "none" }}
              >
                Siųsti el. laišką
              </Button>
            )}
          </Box>
        )}

        <DialogContent sx={{ p: 3, minHeight: "400px" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : request ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Status and Created date */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Chip
                  label={translateTripRequestStatus(request.status)}
                  sx={{
                    bgcolor: getStatusColor(request.status),
                    color: "white",
                    fontWeight: 500,
                    px: 1,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Sukurta: {format(new Date(request.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
                </Typography>
              </Box>

              {/* Client information */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mb: 2 }}>
                  Kliento informacija
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body1">
                    <strong>Vardas ir pavardė:</strong> {request.fullName}
                  </Typography>

                  {request.status === TripRequestStatus.Confirmed && (
                    <>
                      <Typography variant="body1">
                        <strong>El. paštas:</strong> {request.email}
                      </Typography>

                      {request.phoneNumber && (
                        <Typography variant="body1">
                          <strong>Tel. numeris:</strong> {request.phoneNumber}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* Message */}
              {request.message && (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Žinutė
                  </Typography>
                  <Typography variant="body1">{request.message}</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography textAlign="center" color="text.secondary">
              Nėra duomenų
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Patvirtinti užklausą"
        message="Ar tikrai norite patvirtinti užklausą? Kiti agentai jos nebematys ir užklausa atiteks jums."
        onConfirm={handleConfirm}
        onCancel={handleConfirmDialogClose}
      />

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  )
}

export default TripRequestModal

