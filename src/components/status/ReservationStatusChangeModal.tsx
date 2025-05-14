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

export enum ReservationStatus {
  New = 0,
  Contacted = 1,
  InProgress = 2,
  Confirmed = 3,
  Cancelled = 4,
}

const mapStringStatusToEnum = (status: string): ReservationStatus => {
  switch (status) {
    case "New":
      return ReservationStatus.New
    case "Contacted":
      return ReservationStatus.Contacted
    case "InProgress":
      return ReservationStatus.InProgress
    case "Confirmed":
      return ReservationStatus.Confirmed
    case "Cancelled":
      return ReservationStatus.Cancelled
    default:
      return ReservationStatus.New 
  }
}

const mapEnumToStringStatus = (status: ReservationStatus): string => {
  switch (status) {
    case ReservationStatus.New:
      return "New"
    case ReservationStatus.Contacted:
      return "Contacted"
    case ReservationStatus.InProgress:
      return "InProgress"
    case ReservationStatus.Confirmed:
      return "Confirmed"
    case ReservationStatus.Cancelled:
      return "Cancelled"
    default:
      return "New"
  }
}

interface StatusChangeDialogProps {
  open: boolean
  reservationId: string
  currentStatus: string | number 
  onClose: () => void
  onSuccess: () => void
}

const ReservationStatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  reservationId,
  currentStatus,
  onClose,
  onSuccess,
}) => {
  const getNumericStatus = (status: string | number): ReservationStatus => {
    if (typeof status === "string") {
      return mapStringStatusToEnum(status)
    }
    return status as ReservationStatus
  }

  const numericCurrentStatus = getNumericStatus(currentStatus)
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus>(numericCurrentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const numStatus = getNumericStatus(currentStatus)
      setSelectedStatus(numStatus)
      setError(null)
      setValidationMessage(null)
    }
  }, [open, currentStatus])

  useEffect(() => {
    setValidationMessage(null)

    if (selectedStatus === numericCurrentStatus) {
      return
    }

    const isValid = isValidStatusTransition(numericCurrentStatus, selectedStatus)
    if (!isValid) {
      setValidationMessage("Negalimas statuso pakeitimas. Patikrinkite statuso keitimo taisykles.")
    }
  }, [selectedStatus, numericCurrentStatus])

  const isValidStatusTransition = (current: ReservationStatus, next: ReservationStatus): boolean => {
    return (
      (current === ReservationStatus.New && next === ReservationStatus.Contacted) ||
      (current === ReservationStatus.New && next === ReservationStatus.Cancelled) ||
      (current === ReservationStatus.Contacted && next === ReservationStatus.InProgress) ||
      (current === ReservationStatus.Contacted && next === ReservationStatus.Cancelled) ||
      (current === ReservationStatus.InProgress && next === ReservationStatus.Confirmed) ||
      (current === ReservationStatus.InProgress && next === ReservationStatus.Cancelled)
    )
  }

  const handleStatusChange = (event: SelectChangeEvent<number>) => {
    setSelectedStatus(Number(event.target.value) as ReservationStatus)
  }

  const handleConfirm = async () => {
    if (validationMessage || selectedStatus === numericCurrentStatus) return

    try {
      setLoading(true)
      setError(null)

      const statusForApi = typeof currentStatus === "string" ? mapEnumToStringStatus(selectedStatus) : selectedStatus

      await axios.post(
        `${API_URL}/Reservation/${reservationId}/status`,
        { newStatus: statusForApi },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      onSuccess()
      onClose()
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data || "Nepavyko pakeisti statuso. Bandykite dar kartą.")
      } else {
        setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: ReservationStatus): string => {
    switch (status) {
      case ReservationStatus.New:
        return "Nauja"
      case ReservationStatus.Contacted:
        return "Susisiekta"
      case ReservationStatus.InProgress:
        return "Vykdoma"
      case ReservationStatus.Confirmed:
        return "Patvirtinta"
      case ReservationStatus.Cancelled:
        return "Atšaukta"
      default:
        return "Nežinoma"
    }
  }

  const getAvailableStatuses = (currentStatus: ReservationStatus): ReservationStatus[] => {
    switch (currentStatus) {
      case ReservationStatus.New:
        return [ReservationStatus.Contacted, ReservationStatus.Cancelled]
      case ReservationStatus.Contacted:
        return [ReservationStatus.InProgress, ReservationStatus.Cancelled]
      case ReservationStatus.InProgress:
        return [ReservationStatus.Confirmed, ReservationStatus.Cancelled]
      case ReservationStatus.Confirmed:
      case ReservationStatus.Cancelled:
        return [] // No transitions from these states
      default:
        return []
    }
  }

  const availableStatuses = getAvailableStatuses(numericCurrentStatus)
  const canChangeStatus = availableStatuses.length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Keisti rezervacijos statusą</DialogTitle>
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
            value={selectedStatus}
            label="Statusas"
            onChange={handleStatusChange}
            disabled={loading || !canChangeStatus}
          >
            <MenuItem value={numericCurrentStatus} disabled>
              {getStatusLabel(numericCurrentStatus)} (dabartinis)
            </MenuItem>

            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
          {validationMessage && <FormHelperText>{validationMessage}</FormHelperText>}
        </FormControl>

        {!canChangeStatus && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Šios rezervacijos statuso keisti negalima.
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
          disabled={loading || selectedStatus === numericCurrentStatus || !!validationMessage || !canChangeStatus}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Keičiama..." : "Patvirtinti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReservationStatusChangeDialog
