"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Radio,
  RadioGroup,
  Divider,
  IconButton,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { SpecialOfferResponse } from "../types/OfferEvent"
import dayjs from "dayjs"
import CustomSnackbar from "./CustomSnackBar"
import CloseIcon from "@mui/icons-material/Close"
import CustomDateTimePicker from "./CustomDatePicker"

interface ConvertOfferToTripPopupProps {
  open: boolean
  onClose: () => void
  offer: SpecialOfferResponse | null
}

interface ConvertOfferToTripRequest {
  offerId: string
  selectedStepId: string
  newTripStartDate: string
  transferMainInfo: boolean
  transferImages: boolean
  dayByDayItineraryNeeded: boolean
}

const ConvertOfferToTripPopup: React.FC<ConvertOfferToTripPopupProps> = ({ open, onClose, offer }) => {
  // Stepper state
  const [activeStep, setActiveStep] = useState(0)
  const steps = ["Pasirinkite pasiūlymą", "Kelionės informacijos nustatymas"]

  // Form state
  const [selectedStepId, setSelectedStepId] = useState<string>("")
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().add(1, "day"))
  const [transferMainInfo, setTransferMainInfo] = useState(true)
  const [transferImages, setTransferImages] = useState(true)
  const [dayByDayItineraryNeeded, setDayByDayItineraryNeeded] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  // Reset state when the popup opens
  useEffect(() => {
    if (open) {
      setActiveStep(0)
      setSelectedStepId("")
      setStartDate(dayjs().add(1, "day"))
      setTransferMainInfo(true)
      setTransferImages(true)
      setDayByDayItineraryNeeded(false)
    }
  }, [open])

  // Handle step change
  const handleNext = () => {
    if (activeStep === 0 && !selectedStepId) {
      setSnackbarMessage("Prašome pasirinkti pasiūlymą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  // Handle step selection
  const handleStepSelection = (stepId: string) => {
    setSelectedStepId(stepId)
  }

  // Get step description by ID
  const getStepDescription = (stepId: string): string => {
    const step = offer?.itinerary?.itinerarySteps?.find((step) => step.id === stepId)
    return step?.description || "Pasiūlymas"
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!offer || !startDate) {
      setSnackbarMessage("Prašome pasirinkti kelionės pradžios datą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const token = localStorage.getItem("accessToken")
    const requestBody: ConvertOfferToTripRequest = {
      offerId: offer.id,
      selectedStepId,
      newTripStartDate: startDate.format("YYYY-MM-DD"),
      transferMainInfo,
      transferImages,
      dayByDayItineraryNeeded,
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/ClientTripOfferFacade/convert`, requestBody, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSnackbarMessage("Pasiūlymas sėkmingai paverstas į kelionę!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Get the new trip ID from the response
      const newTripId = response.data.id

      // Close after a short delay to show the success message, then redirect
      setTimeout(() => {
        onClose()
        // Redirect to the newly created trip page
        if (newTripId) {
          window.location.href = `/admin-trip-list/${newTripId}`
        }
      }, 1500)
    } catch (error: any) {
      console.error("Failed to convert offer to trip:", error)
      setSnackbarMessage(error.response?.data?.message || "Nepavyko paversti pasiūlymo į kelionę")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // If no offer is provided, don't render anything
  if (!offer) return null

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "column" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Typography variant="h6">Paversti pasiūlymą į kelionę</Typography>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
          <Stepper activeStep={activeStep} sx={{ mt: 2, width: "100%" }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        <DialogContent dividers>
          {activeStep === 0 ? (
            <Box sx={{ py: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Pasirinkite pasiūlymo variantą, kurį norite paversti į kelionę:
              </Typography>
              <RadioGroup value={selectedStepId} onChange={(e) => handleStepSelection(e.target.value)}>
                {offer.itinerary?.itinerarySteps?.map((step) => (
                  <Paper
                    key={step.id}
                    elevation={selectedStepId === step.id ? 3 : 1}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: selectedStepId === step.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                      cursor: "pointer",
                      "&:hover": {
                        borderColor: "#bbdefb",
                      },
                    }}
                    onClick={() => handleStepSelection(step.id)}
                  >
                    <FormControlLabel
                      value={step.id}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {step.description || `Pasiūlymas ${step.dayNumber}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Kaina: {step.price ? `€${step.price}` : "Nenurodyta"}
                          </Typography>
                          {step.destination && (
                            <Typography variant="body2" color="text.secondary">
                              Kryptis: {step.destination}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ width: "100%" }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Pasirinktas pasiūlymas:
              </Typography>
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
                <Typography variant="body1">{getStepDescription(selectedStepId)}</Typography>
              </Paper>

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Pasirinkite naujos kelionės pradžios datą
              </Typography>
              <CustomDateTimePicker
                label="Pradžios data"
                value={startDate}
                onChange={(date) => setStartDate(date)}
                showTime={false}
                disabled={loading}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Pasirinkite ką norite perkelti:
              </Typography>
              <Box sx={{ pl: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox checked={transferMainInfo} onChange={(e) => setTransferMainInfo(e.target.checked)} />
                  }
                  label="Perkelti pagrindinę informaciją"
                />
                <FormControlLabel
                  control={<Checkbox checked={transferImages} onChange={(e) => setTransferImages(e.target.checked)} />}
                  label="Perkelti pasiūlymo nuotraukas"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dayByDayItineraryNeeded}
                      onChange={(e) => setDayByDayItineraryNeeded(e.target.checked)}
                    />
                  }
                  label="Reikalingas kiekvienos dienos planas"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "center" }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading}>
              Atgal
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={!selectedStepId || loading}>
              Toliau
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !startDate}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? "Vykdoma..." : "Paversti"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  )
}

export default ConvertOfferToTripPopup
