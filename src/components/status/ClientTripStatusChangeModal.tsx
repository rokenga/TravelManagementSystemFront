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
  Grid,
  Divider,
} from "@mui/material"
import { TripStatus, PaymentStatus } from "../../types/ClientTrip"
import { translateTripStatus, translatePaymentStatus } from "../../Utils/translateEnums"

interface TripStatusChangeDialogProps {
  open: boolean
  tripId: string
  currentTripStatus?: TripStatus
  currentPaymentStatus?: PaymentStatus
  onClose: () => void
  onSuccess: () => void
}

const TripStatusChangeDialog: React.FC<TripStatusChangeDialogProps> = ({
  open,
  tripId,
  currentTripStatus,
  currentPaymentStatus,
  onClose,
  onSuccess,
}) => {
  const [selectedTripStatus, setSelectedTripStatus] = useState<TripStatus | "">("")
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tripStatusValidationMessage, setTripStatusValidationMessage] = useState<string | null>(null)
  const [paymentStatusValidationMessage, setPaymentStatusValidationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedTripStatus("")
      setSelectedPaymentStatus("")
      setError(null)
      setTripStatusValidationMessage(null)
      setPaymentStatusValidationMessage(null)

    }
  }, [open, currentTripStatus, currentPaymentStatus])

  useEffect(() => {
    setTripStatusValidationMessage(null)

    if (!selectedTripStatus || selectedTripStatus === currentTripStatus) {
      return
    }

    const isValid = isTripStatusChangeValid(currentTripStatus, selectedTripStatus)
    if (!isValid) {
      setTripStatusValidationMessage(
        `Negalimas statuso pakeitimas iš ${translateTripStatus(currentTripStatus as TripStatus)} į ${translateTripStatus(selectedTripStatus)}.`,
      )
    }
  }, [selectedTripStatus, currentTripStatus])

  useEffect(() => {
    setPaymentStatusValidationMessage(null)

    if (!selectedPaymentStatus || selectedPaymentStatus === currentPaymentStatus) {
      return
    }

    const isValid = isPaymentStatusChangeValid(currentPaymentStatus, selectedPaymentStatus)
    if (!isValid) {
      setPaymentStatusValidationMessage(
        `Negalimas mokėjimo statuso pakeitimas iš ${translatePaymentStatus(currentPaymentStatus as PaymentStatus)} į ${translatePaymentStatus(selectedPaymentStatus)}.`,
      )
    }
  }, [selectedPaymentStatus, currentPaymentStatus])

  const isTripStatusChangeValid = (current?: TripStatus, next?: TripStatus): boolean => {
    if (!current || !next) return false

    switch (current) {
      case TripStatus.Draft:
        return next === TripStatus.Confirmed || next === TripStatus.Cancelled
      case TripStatus.Confirmed:
        return next === TripStatus.Cancelled
      case TripStatus.Cancelled:
        return false 
      default:
        return false
    }
  }

  const isPaymentStatusChangeValid = (current?: PaymentStatus, next?: PaymentStatus): boolean => {
    if (!current || !next) return false

    switch (current) {
      case PaymentStatus.Unpaid:
        return next === PaymentStatus.PartiallyPaid || next === PaymentStatus.Paid
      case PaymentStatus.PartiallyPaid:
        return next === PaymentStatus.Paid
      case PaymentStatus.Paid:
        return false 
      default:
        return false
    }
  }

  const handleTripStatusChange = (event: SelectChangeEvent) => {
    setSelectedTripStatus(event.target.value as TripStatus)
  }

  const handlePaymentStatusChange = (event: SelectChangeEvent) => {
    setSelectedPaymentStatus(event.target.value as PaymentStatus)
  }

  const handleConfirm = async () => {
    if (
      (!selectedTripStatus && !selectedPaymentStatus) ||
      (selectedTripStatus && tripStatusValidationMessage) ||
      (selectedPaymentStatus && paymentStatusValidationMessage)
    ) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload: {
        tripStatus?: TripStatus
        paymentStatus?: PaymentStatus
      } = {}

      if (selectedTripStatus && selectedTripStatus !== currentTripStatus) {
        payload.tripStatus = selectedTripStatus
      }

      if (selectedPaymentStatus && selectedPaymentStatus !== currentPaymentStatus) {
        payload.paymentStatus = selectedPaymentStatus
      }

      await axios.post(`${API_URL}/client-trips/${tripId}/status`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          setError(err.response.data.error)
        } else {
          setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
        }
      } else {
        setError("Nepavyko pakeisti statuso. Bandykite dar kartą.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getAvailableTripStatuses = (currentStatus?: TripStatus): TripStatus[] => {
    if (!currentStatus) return []

    switch (currentStatus) {
      case TripStatus.Draft:
        return [TripStatus.Confirmed, TripStatus.Cancelled]
      case TripStatus.Confirmed:
        return [TripStatus.Cancelled]
      case TripStatus.Cancelled:
        return [] 
      default:
        return []
    }
  }

  const getAvailablePaymentStatuses = (currentStatus?: PaymentStatus): PaymentStatus[] => {
    if (!currentStatus) return []

    switch (currentStatus) {
      case PaymentStatus.Unpaid:
        return [PaymentStatus.PartiallyPaid, PaymentStatus.Paid]
      case PaymentStatus.PartiallyPaid:
        return [PaymentStatus.Paid]
      case PaymentStatus.Paid:
        return [] 
      default:
        return []
    }
  }

  const availableTripStatuses = currentTripStatus ? getAvailableTripStatuses(currentTripStatus) : []
  const availablePaymentStatuses = currentPaymentStatus ? getAvailablePaymentStatuses(currentPaymentStatus) : []

  const canChangeTripStatus = availableTripStatuses.length > 0
  const canChangePaymentStatus = availablePaymentStatuses.length > 0
  const canChangeAnyStatus = canChangeTripStatus || canChangePaymentStatus

  const isFormValid =
    (selectedTripStatus && selectedTripStatus !== currentTripStatus && !tripStatusValidationMessage) ||
    (selectedPaymentStatus && selectedPaymentStatus !== currentPaymentStatus && !paymentStatusValidationMessage)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Keisti kelionės statusą</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!tripStatusValidationMessage}>
              <InputLabel id="trip-status-select-label">Kelionės statusas</InputLabel>
              <Select
                labelId="trip-status-select-label"
                id="trip-status-select"
                value={selectedTripStatus || currentTripStatus || ""}
                label="Kelionės statusas"
                onChange={handleTripStatusChange}
                disabled={loading || !canChangeTripStatus}
              >
                {currentTripStatus && (
                  <MenuItem value={currentTripStatus}>{translateTripStatus(currentTripStatus)} (dabartinis)</MenuItem>
                )}

                {availableTripStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {translateTripStatus(status)}
                  </MenuItem>
                ))}
              </Select>
              {tripStatusValidationMessage && <FormHelperText>{tripStatusValidationMessage}</FormHelperText>}
            </FormControl>

            {!canChangeTripStatus && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Šios kelionės statuso keisti negalima.
              </Alert>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!paymentStatusValidationMessage}>
              <InputLabel id="payment-status-select-label">Mokėjimo statusas</InputLabel>
              <Select
                labelId="payment-status-select-label"
                id="payment-status-select"
                value={selectedPaymentStatus || currentPaymentStatus || ""}
                label="Mokėjimo statusas"
                onChange={handlePaymentStatusChange}
                disabled={loading || !canChangePaymentStatus}
              >
                {currentPaymentStatus && (
                  <MenuItem value={currentPaymentStatus}>
                    {translatePaymentStatus(currentPaymentStatus)} (dabartinis)
                  </MenuItem>
                )}

                {availablePaymentStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {translatePaymentStatus(status)}
                  </MenuItem>
                ))}
              </Select>
              {paymentStatusValidationMessage && <FormHelperText>{paymentStatusValidationMessage}</FormHelperText>}
            </FormControl>

            {!canChangePaymentStatus && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Šios kelionės mokėjimo statuso keisti negalima.
              </Alert>
            )}
          </Grid>
        </Grid>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Atšaukti
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || !isFormValid || !canChangeAnyStatus}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Keičiama..." : "Patvirtinti"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TripStatusChangeDialog
