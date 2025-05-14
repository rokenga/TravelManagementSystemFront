"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

export enum OfferStatus {
  Active = "Active",
  Expired = "Expired",
  ManuallyDisabled = "ManuallyDisabled",
}

interface StatusChangeDialogProps {
  open: boolean
  currentStatus?: OfferStatus
  validUntil?: string
  tripStatus?: string
  onClose: () => void
  onConfirm: (status: OfferStatus) => Promise<void>
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  currentStatus,
  validUntil,
  tripStatus,
  onClose,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OfferStatus>(OfferStatus.Active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [availableStatuses, setAvailableStatuses] = useState<OfferStatus[]>([])

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus || OfferStatus.Active)
      setError(null)
      setValidationMessage(null)
    }
  }, [open, currentStatus, tripStatus])

  const isExpired = validUntil ? new Date(validUntil) < new Date() : false

  useEffect(() => {
    if (!currentStatus) return

    const statuses: OfferStatus[] = []

    if (currentStatus === OfferStatus.Expired || isExpired) {
      setValidationMessage("Pasibaigusio pasiūlymo statuso keisti negalima.")
      setAvailableStatuses([])
      return
    }

    if (tripStatus?.toLowerCase() === "draft") {
      if (currentStatus !== OfferStatus.ManuallyDisabled) {
        statuses.push(OfferStatus.ManuallyDisabled)
      }
      setValidationMessage(
        currentStatus === OfferStatus.ManuallyDisabled
          ? null
          : "Kai kelionė yra juodraštis, pasiūlymo statusas gali būti tik 'Išjungtas rankiniu būdu'.",
      )
    } else {
      if (currentStatus === OfferStatus.Active) {
        statuses.push(OfferStatus.ManuallyDisabled)
      } else if (currentStatus === OfferStatus.ManuallyDisabled) {
        statuses.push(OfferStatus.Active)
      }
    }

    setAvailableStatuses(statuses)
  }, [currentStatus, tripStatus, isExpired])

  useEffect(() => {
    if (validationMessage) return

    if (!currentStatus) return

    if (selectedStatus === OfferStatus.Active && isExpired) {
      setValidationMessage("Negalima nustatyti aktyvaus statuso, nes galiojimo data pasibaigė.")
      return
    }

    if (selectedStatus === OfferStatus.ManuallyDisabled && currentStatus !== OfferStatus.Active) {
      setValidationMessage("Pasiūlymą galima išjungti tik kai jis yra aktyvus.")
      return
    }
  }, [selectedStatus, currentStatus, isExpired, validationMessage])

  const handleStatusChange = (event: SelectChangeEvent) => {
    setSelectedStatus(event.target.value as OfferStatus)
  }

  const handleConfirm = async () => {
    if (validationMessage) return

    try {
      setLoading(true)
      setError(null)
      await onConfirm(selectedStatus)
      onClose()
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Nepavyko pakeisti statuso. Bandykite dar kartą.")
      } else {
        setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: OfferStatus): string => {
    switch (status) {
      case OfferStatus.Active:
        return "Aktyvus"
      case OfferStatus.Expired:
        return "Pasibaigęs"
      case OfferStatus.ManuallyDisabled:
        return "Išjungtas rankiniu būdu"
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Keisti pasiūlymo statusą</DialogTitle>
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
            disabled={loading || currentStatus === OfferStatus.Expired || isExpired || availableStatuses.length === 0}
          >
            <MenuItem value={currentStatus || ""} disabled>
              {currentStatus ? `${getStatusLabel(currentStatus)} (dabartinis)` : "Nežinomas statusas"}
            </MenuItem>

            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
          {validationMessage && <FormHelperText>{validationMessage}</FormHelperText>}
        </FormControl>

        {(currentStatus === OfferStatus.Expired || isExpired) && !validationMessage && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Šio pasiūlymo galiojimo laikas yra pasibaigęs.
          </Alert>
        )}

        {tripStatus?.toLowerCase() === "draft" &&
          !validationMessage &&
          currentStatus !== OfferStatus.ManuallyDisabled && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Kai kelionė yra juodraštis, pasiūlymo statusas gali būti tik "Išjungtas rankiniu būdu".
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
          disabled={
            loading || selectedStatus === currentStatus || !!validationMessage || availableStatuses.length === 0
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Keičiama..." : "Patvirtinti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StatusChangeDialog
