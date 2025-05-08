"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import dayjs from "dayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import {
  Stepper,
  Step as MuiStep,
  StepLabel,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from "@mui/material"
import { ArrowBack, CheckCircle, Save, ExitToApp } from "@mui/icons-material"
import { API_URL } from "../../Utils/Configuration"
import Step1OfferDetails from "./Step1OfferDetails"
import Step2ReviewConfirm from "./Step2ReviewConfirm"
import type { PublicOfferWizardData } from "./CreatePublicOfferWizardForm"
import CustomSnackbar from "../CustomSnackBar"
import type { PublicOfferDetails } from "../../types/PublicSpecialOffer"
import { toLocalIso } from "../../Utils/dateSerialize"
import { numberToStarRatingEnum, starRatingEnumToNumber } from "../../Utils/starRatingUtils"

const steps = ["Pasiūlymo informacija", "Peržiūra ir patvirtinimas"]

interface EditPublicOfferWizardFormProps {
  tripId: string
}

// Helper function to safely parse dates in the correct format
const parseDateCorrectly = (dateString: string | null | undefined): dayjs.Dayjs | null => {
  if (!dateString) return null

  // Try to parse with dayjs directly first
  let date = dayjs(dateString)

  // If the date is valid, return it
  if (date.isValid()) return date

  // If not valid, try to manually parse it
  // Split the date string by possible separators
  const parts = dateString.split(/[-T ]/)
  if (parts.length >= 3) {
    // Ensure we're using yyyy-mm-dd format
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]

    // Reconstruct the date string in the correct format
    const formattedDate = `${year}-${month}-${day}`
    date = dayjs(formattedDate)

    if (date.isValid()) return date
  }

  console.error("Failed to parse date:", dateString)
  return null
}

// Helper function to safely convert dayjs to ISO string or null
const safeToLocalIso = (date: dayjs.Dayjs | null): string | null => {
  if (!date || !date.isValid()) return null
  return toLocalIso(date)
}

// Validation function for offer data
const validateOfferData = (
  data: PublicOfferWizardData,
  isDraft: boolean,
): { isValid: boolean; errorMessage: string } => {
  // If it's a draft, no validation needed
  if (isDraft) {
    return {
      isValid: true,
      errorMessage: "",
    }
  }

  if (!data.validUntil) {
    return {
      isValid: false,
      errorMessage: "Galiojimo data yra privaloma",
    }
  }

  // Check if at least one image is provided
  if (!data.images || (data.images.length === 0 && (!data.existingImages || data.existingImages.length === 0))) {
    return {
      isValid: false,
      errorMessage: "Būtina įkelti bent vieną nuotrauką",
    }
  }

  // Check if either accommodation, transport, or cruise is provided
  const hasAccommodations = data.accommodations.length > 0
  const hasTransports = data.transports.length > 0
  const hasCruises = data.cruises.length > 0

  if (!hasAccommodations && !hasTransports && !hasCruises) {
    return {
      isValid: false,
      errorMessage: "Būtina pridėti bent vieną apgyvendinimą, transportą arba kruizą",
    }
  }

  return {
    isValid: true,
    errorMessage: "",
  }
}

const EditPublicOfferWizardForm: React.FC<EditPublicOfferWizardFormProps> = ({ tripId }) => {
  const navigate = useNavigate()
  const { id: urlParamId } = useParams<{ id: string }>() // Also try to get ID from URL params as fallback
  const effectiveTripId = tripId || urlParamId

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  // Initialize form data with empty values
  const [formData, setFormData] = useState<PublicOfferWizardData>({
    tripName: "",
    description: "",
    destination: "",
    startDate: null,
    endDate: null,
    validUntil: null,
    adultCount: 2,
    childrenCount: 0,
    category: "",
    price: 0,
    status: undefined,
    offerStatus: undefined,
    accommodations: [],
    transports: [],
    cruises: [],
    images: [],
    existingImages: [],
  })

  // Fetch the offer data when component mounts
  useEffect(() => {
    const fetchOfferData = async () => {
      if (!effectiveTripId) {
        setError("Nepavyko gauti pasiūlymo ID")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await axios.get<PublicOfferDetails>(
          `${API_URL}/PublicTripOfferFacade/agent/${effectiveTripId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        )

        const offerData = response.data
        const step = offerData.itinerary.steps[0]

        // Convert API data to form data format
        const mappedFormData: PublicOfferWizardData = {
          tripName: offerData.tripName || "",
          description: offerData.description || "",
          destination: offerData.destination || "",
          startDate: offerData.startDate ? dayjs(offerData.startDate) : null,
          endDate: offerData.endDate ? dayjs(offerData.endDate) : null,
          validUntil: offerData.validUntil ? dayjs(offerData.validUntil) : null,
          adultCount: offerData.adultsCount || 2,
          childrenCount: offerData.childrenCount || 0,
          category: offerData.category || "",
          price: offerData.price || 0,
          status: offerData.status,
          offerStatus: offerData.offerStatus,
          accommodations:
            step?.accommodations.map((acc) => ({
              hotelName: acc.hotelName || "",
              checkIn: parseDateCorrectly(acc.checkIn), // Use our helper function
              checkOut: parseDateCorrectly(acc.checkOut), // Use our helper function
              hotelLink: acc.hotelLink || "",
              description: acc.description || "",
              boardBasis: acc.boardBasis || "",
              roomType: acc.roomType || "",
              price: acc.price || 0,
              starRating: starRatingEnumToNumber(acc.starRating), // Convert enum string to number
            })) || [],
          transports:
            step?.transports
              .filter((t) => t.transportType !== "Cruise")
              .map((trans) => ({
                transportType: trans.transportType || "Flight",
                departureTime: parseDateCorrectly(trans.departureTime), // Use our helper function
                arrivalTime: parseDateCorrectly(trans.arrivalTime), // Use our helper function
                departurePlace: trans.departurePlace || "",
                arrivalPlace: trans.arrivalPlace || "",
                description: trans.description || "",
                companyName: trans.companyName || "",
                transportName: trans.transportName || "",
                transportCode: trans.transportCode || "",
                cabinType: trans.cabinType || "",
                price: trans.price || 0,
              })) || [],
          cruises:
            step?.transports
              .filter((t) => t.transportType === "Cruise")
              .map((cruise) => ({
                departureTime: parseDateCorrectly(cruise.departureTime), // Use our helper function
                arrivalTime: parseDateCorrectly(cruise.arrivalTime), // Use our helper function
                departurePlace: cruise.departurePlace || "",
                arrivalPlace: cruise.arrivalPlace || "",
                description: cruise.description || "",
                companyName: cruise.companyName || "",
                transportName: cruise.transportName || "",
                transportCode: cruise.transportCode || "",
                cabinType: cruise.cabinType || "",
                price: cruise.price || 0,
              })) || [],
          images: [],
          existingImages: offerData.files.map((file) => ({
            id: file.id,
            url: file.urlInline,
            fileName: file.fileName,
          })),
        }

        setFormData(mappedFormData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch offer data:", err)
        setError("Nepavyko gauti pasiūlymo duomenų. Bandykite vėliau.")
      } finally {
        setLoading(false)
      }
    }

    fetchOfferData()
  }, [effectiveTripId])

  /**
   * STEPPER NAVIGATION
   */
  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  /**
   * DIALOG HANDLERS
   */
  const handleStay = () => setShowNavigationDialog(false)
  const handleLeaveWithoutSaving = () => {
    setShouldBlockNavigation(false)
    setShowNavigationDialog(false)
    navigate(`/public-offers/${effectiveTripId}`)
  }

  /**
   * STEPS SUBMISSION
   */
  const handleStep1Submit = (updatedData: Partial<PublicOfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))
    handleNext()
  }

  /**
   * Handle image deletion - memoized to prevent unnecessary re-renders
   */
  const handleImageDelete = useCallback((imageId: string) => {
    console.log("Deleting image with ID:", imageId)
    setImagesToDelete((prev) => [...prev, imageId])
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages?.filter((img) => img.id !== imageId) || [],
    }))
  }, [])

  /**
   * FINAL SUBMIT: Update the offer
   */
  const handleSubmit = async (isDraft = false) => {
    // Validate the data based on whether it's a draft or not
    const validationResult = validateOfferData(formData, isDraft)
    if (!validationResult.isValid) {
      setSnackbarMessage(validationResult.errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    setIsSaving(true)

    try {
      // Convert cruises to transport entries for the API
      const cruiseTransports = formData.cruises.map((cruise) => ({
        transportType: "Cruise",
        departureTime: safeToLocalIso(cruise.departureTime),
        arrivalTime: safeToLocalIso(cruise.arrivalTime),
        departurePlace: cruise.departurePlace,
        arrivalPlace: cruise.arrivalPlace,
        description: cruise.description,
        companyName: cruise.companyName,
        transportName: cruise.transportName,
        transportCode: cruise.transportCode,
        cabinType: cruise.cabinType,
        price: cruise.price,
      }))

      // Map transports to the format expected by the API
      const mappedTransports = formData.transports.map((transport) => ({
        transportType: transport.transportType,
        departureTime: safeToLocalIso(transport.departureTime),
        arrivalTime: safeToLocalIso(transport.arrivalTime),
        departurePlace: transport.departurePlace,
        arrivalPlace: transport.arrivalPlace,
        description: transport.description,
        companyName: transport.companyName,
        transportName: transport.transportName,
        transportCode: transport.transportCode,
        cabinType: transport.cabinType,
        price: transport.price,
      }))

      // Map accommodations to the format expected by the API
      const mappedAccommodations = formData.accommodations.map((acc) => ({
        hotelName: acc.hotelName,
        checkIn: safeToLocalIso(acc.checkIn),
        checkOut: safeToLocalIso(acc.checkOut),
        hotelLink: acc.hotelLink,
        description: acc.description,
        boardBasis: acc.boardBasis,
        roomType: acc.roomType,
        price: acc.price,
        starRating: numberToStarRatingEnum(acc.starRating), // Convert number to enum string
      }))

      // Calculate total price
      const accommodationTotal = formData.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
      const transportTotal = formData.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
      const cruiseTotal = formData.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0)
      const totalPrice = accommodationTotal + transportTotal + cruiseTotal

      // Build the request payload
      const requestPayload = {
        tripName: formData.tripName,
        description: formData.description,
        destination: formData.destination,
        category: formData.category,
        status: isDraft ? "Draft" : formData.status,
        offerStatus: isDraft ? "ManuallyDisabled" : formData.offerStatus || "Active",
        startDate: safeToLocalIso(formData.startDate),
        endDate: safeToLocalIso(formData.endDate),
        validUntil: safeToLocalIso(formData.validUntil),
        price: totalPrice,
        childrenCount: formData.childrenCount,
        adultsCount: formData.adultCount,
        itinerary: {
          title: formData.tripName,
          description: formData.description,
          step: {
            description: "Pasiūlymas",
            price: totalPrice,
            transports: [...mappedTransports, ...cruiseTransports],
            accommodations: mappedAccommodations,
          },
        },
        imagesToDelete: imagesToDelete,
      }

      console.log("Sending update request:", requestPayload)

      // Create FormData for multipart/form-data submission
      const formDataPayload = new FormData()
      formDataPayload.append("data", JSON.stringify(requestPayload))

      // Append new images
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((file) => {
          formDataPayload.append("newImages", file)
        })
      }

      // Send the update request
      const response = await axios.put(`${API_URL}/PublicTripOfferFacade/agent/${effectiveTripId}`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Successfully updated the offer:", response.data)

      // Show success message
      setSnackbarMessage("Pasiūlymas sėkmingai atnaujintas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Wait for 1 second before redirecting
      setTimeout(() => {
        navigate(`/public-offers/${effectiveTripId}`)
      }, 1000)
    } catch (err: any) {
      console.error("Failed to update the offer:", err)

      // Show error message
      let errorMessage = "Nepavyko atnaujinti pasiūlymo. Patikrinkite įvestus duomenis."
      if (err.response?.data) {
        // Check if the error data is an object with Message property
        if (typeof err.response.data === "object" && err.response.data.Message) {
          errorMessage = err.response.data.Message
        }
        // Check if it's an object with message property
        else if (typeof err.response.data === "object" && err.response.data.message) {
          errorMessage = err.response.data.message
        }
        // Check if it's a string
        else if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        }
        // If it's an object but we don't know its structure, stringify it
        else if (typeof err.response.data === "object") {
          try {
            errorMessage = JSON.stringify(err.response.data)
          } catch (e) {
            console.error("Could not stringify error data:", e)
          }
        }
      }
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

  // Save as draft function
  const handleSaveAsDraft = () => {
    handleSubmit(true)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Kraunami duomenys...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="lt">
      <Box sx={{ width: "100%" }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <MuiStep key={label}>
              <StepLabel>{label}</StepLabel>
            </MuiStep>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 4 }}>
          {activeStep === 0 && (
            <Step1OfferDetails
              initialData={formData}
              onSubmit={handleStep1Submit}
              onExistingImageDelete={handleImageDelete}
              isEditing={true}
            />
          )}

          {activeStep === 1 && (
            <>
              <Step2ReviewConfirm offerData={formData} />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={isSaving}
                  type="button"
                  startIcon={<ArrowBack />}
                  sx={{ minWidth: 120 }}
                >
                  Atgal
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  type="button"
                  startIcon={<Save />}
                  sx={{ minWidth: 160 }}
                >
                  Išsaugoti juodraštį
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit(false)}
                  disabled={isSaving}
                  type="button"
                  endIcon={<CheckCircle />}
                  sx={{ minWidth: 120 }}
                >
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : "Atnaujinti"}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      <Dialog
        open={showNavigationDialog}
        onClose={handleStay}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
      >
        <DialogTitle id="leave-dialog-title">Išsaugoti pakeitimus?</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Ar norite išsaugoti pakeitimus prieš išeidami? Jei ne, pakeitimai bus prarasti.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStay} color="primary">
            Likti
          </Button>
          <Button onClick={handleLeaveWithoutSaving} color="error" startIcon={<ExitToApp />}>
            Išeiti be išsaugojimo
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            color="primary"
            variant="contained"
            startIcon={<Save />}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : "Išsaugoti ir išeiti"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </LocalizationProvider>
  )
}

export default EditPublicOfferWizardForm
