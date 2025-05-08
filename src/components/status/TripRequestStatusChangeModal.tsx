"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { API_URL } from "../../Utils/Configuration"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  CircularProgress,
  Alert,
  FormHelperText,
} from "@mui/material"
import { TripRequestStatus } from "../../types/TripRequest"
import { translateTripRequestStatus } from "../../Utils/translateEnums"

interface TripRequestStatusChangeDialogProps {
  open: boolean
  requestId: string
  currentStatus: TripRequestStatus
  onClose: () => void
  onSuccess: () => void
}

const TripRequestStatusChangeDialog: React.FC<TripRequestStatusChangeDialogProps> = ({
  open,
  requestId,
  currentStatus,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TripRequestStatus | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStatus("")
      setError(null)
      setValidationMessage(null)
    }
  }, [open, currentStatus])

  // Validate status change
  useEffect(() => {
    setValidationMessage(null)

    if (!selectedStatus || selectedStatus === currentStatus) {
      return
    }

    // Check if the status transition is valid
    const isValid = isStatusChangeValid(currentStatus, selectedStatus)
    if (!isValid) {
      setValidationMessage(
        `Negalimas statuso pakeitimas iš ${translateTripRequestStatus(currentStatus)} į ${translateTripRequestStatus(selectedStatus)}.`,
      )
    }
  }, [selectedStatus, currentStatus])

  const isStatusChangeValid = (current: TripRequestStatus, next: TripRequestStatus): boolean => {
    return (
      (current === TripRequestStatus.New && next === TripRequestStatus.Confirmed) ||
      (current === TripRequestStatus.Confirmed &&
        (next === TripRequestStatus.Completed || next === TripRequestStatus.New))
    )
  }

  const handleStatusChange = (event: SelectChangeEvent) => {
    setSelectedStatus(event.target.value as TripRequestStatus)
  }

  const handleConfirm = async () => {
    if (!selectedStatus || selectedStatus === currentStatus || validationMessage) return

    try {
      setLoading(true)
      setError(null)

      await axios.post(
        `${API_URL}/TripRequest/${requestId}/status`,
        { newStatus: selectedStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      onSuccess()
      onClose()
    } catch (err: any) {
      // Handle specific error messages from the backend
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          setError(err.response.data.error)
        } else {
          setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
        }
      } else {
        setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
      }
      console.error("Failed to change status:", err)
    } finally {
      setLoading(false)
    }
  }

  // Get available next statuses based on current status
  const getAvailableStatuses = (currentStatus: TripRequestStatus): TripRequestStatus[] => {
    switch (currentStatus) {
      case TripRequestStatus.New:
        return [TripRequestStatus.Confirmed]
      case TripRequestStatus.Confirmed:
        return [TripRequestStatus.Completed, TripRequestStatus.New]
      case TripRequestStatus.Completed:
        return [] // No transitions from this state
      default:
        return []
    }
  }

  const availableStatuses = getAvailableStatuses(currentStatus)
  const canChangeStatus = availableStatuses.length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Keisti užklausos statusą</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mt: 1 }} error={!!validationMessage}>
          <InputLabel id="status-select-label">Statusas</InputLabel>
          <Select
            labelId="status-select-label"
            id="status-select"
            value={selectedStatus || currentStatus}
            label="Statusas"
            onChange={handleStatusChange}
            disabled={loading || !canChangeStatus}
          >
            {/* Show current status */}
            <MenuItem value={currentStatus}>{translateTripRequestStatus(currentStatus)} (dabartinis)</MenuItem>

            {/* Show available statuses */}
            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {translateTripRequestStatus(status)}
              </MenuItem>
            ))}
          </Select>
          {validationMessage && <FormHelperText>{validationMessage}</FormHelperText>}
        </FormControl>

        {!canChangeStatus && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Šios užklausos statuso keisti negalima.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Atšaukti
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || selectedStatus === currentStatus || !!validationMessage || !canChangeStatus}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Keičiama..." : "Patvirtinti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TripRequestStatusChangeDialog
