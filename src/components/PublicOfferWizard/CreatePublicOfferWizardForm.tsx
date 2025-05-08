"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import {
  Stepper,
  Step as MuiStep,
  StepLabel,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import type { Dayjs } from "dayjs"
import axios from "axios"
import Step1OfferDetails from "./Step1OfferDetails"
import Step2ReviewConfirm from "./Step2ReviewConfirm"
import { API_URL } from "../../Utils/Configuration"
import { UserContext } from "../../contexts/UserContext"
import { TransportType, TripStatus, OfferStatus } from "../../types/Enums"
import CustomSnackbar from "../CustomSnackBar"
import { ArrowBack, CheckCircle, Save, ExitToApp } from "@mui/icons-material"
import { toLocalIso } from "../../Utils/dateSerialize"
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

const steps = ["Pasiūlymo informacija", "Peržiūra ir patvirtinimas"]

export interface Accommodation {
  hotelName: string
  checkIn: Dayjs | null
  checkOut: Dayjs | null
  hotelLink: string
  description: string
  boardBasis: string
  roomType: string
  price: number
  starRating?: number | null
}

export interface Transport {
  transportType: string
  departureTime: Dayjs | null
  arrivalTime: Dayjs | null
  departurePlace: string
  arrivalPlace: string
  description: string
  companyName: string
  transportName: string
  transportCode: string
  cabinType: string
  price: number
}

export interface Cruise {
  departureTime: Dayjs | null
  arrivalTime: Dayjs | null
  departurePlace: string
  arrivalPlace: string
  description: string
  companyName: string
  transportName: string
  transportCode: string
  cabinType: string
  price: number
}

/**
 * Main state shape for the entire form.
 */
export interface PublicOfferWizardData {
  tripName: string
  description: string
  destination: string
  startDate: Dayjs | null
  endDate: Dayjs | null
  validUntil: Dayjs | null
  adultCount: number
  childrenCount: number
  category?: string
  price?: number
  status?: TripStatus
  offerStatus?: OfferStatus
  accommodations: Accommodation[]
  transports: Transport[]
  cruises: Cruise[]
  images: File[]
  existingImages?: Array<{ id: string; url: string; fileName: string }>
}

interface ValidationResult {
  isValid: boolean
  errorMessage: string
}

const validateTransport = (transport: Transport): boolean => {
  return !!(
    transport.transportType &&
    transport.departureTime &&
    transport.arrivalTime &&
    transport.departurePlace &&
    transport.arrivalPlace
  )
}

const validateCruise = (cruise: Cruise): boolean => {
  return !!(
    cruise.departureTime &&
    cruise.arrivalTime &&
    cruise.departurePlace &&
    cruise.arrivalPlace &&
    cruise.companyName &&
    cruise.cabinType
  )
}

const validateAccommodation = (accommodation: Accommodation): boolean => {
  return !!(
    accommodation.hotelName &&
    accommodation.checkIn &&
    accommodation.checkOut &&
    accommodation.hotelLink &&
    accommodation.description &&
    accommodation.boardBasis &&
    accommodation.roomType &&
    accommodation.price
  )
}

const validateOfferData = (data: PublicOfferWizardData, isDraft: boolean): ValidationResult => {
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

  // Validate all accommodations if any exist
  if (hasAccommodations) {
    const invalidAccommodation = data.accommodations.find((acc) => !validateAccommodation(acc))
    if (invalidAccommodation) {
      return {
        isValid: false,
        errorMessage: "Visi apgyvendinimo duomenys turi būti užpildyti",
      }
    }
  }

  // Validate all transports if any exist
  if (hasTransports) {
    const invalidTransport = data.transports.find((trans) => !validateTransport(trans))
    if (invalidTransport) {
      return {
        isValid: false,
        errorMessage: "Visi transporto duomenys turi būti užpildyti",
      }
    }
  }

  // Validate all cruises if any exist
  if (hasCruises) {
    const invalidCruise = data.cruises.find((cruise) => !validateCruise(cruise))
    if (invalidCruise) {
      return {
        isValid: false,
        errorMessage: "Visi kruizo duomenys turi būti užpildyti",
      }
    }
  }

  return {
    isValid: true,
    errorMessage: "",
  }
}

/**
 * --------------------------------------------------
 * MAIN WIZARD COMPONENT
 * --------------------------------------------------
 */
const CreatePublicOfferWizardForm: React.FC = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true)

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  // If you have a user context that has e.g. userId or agentId:
  const user = useContext(UserContext)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  // Initialize form data
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
    status: TripStatus.Confirmed,
    offerStatus: OfferStatus.Active,
    accommodations: [],
    transports: [],
    cruises: [],
    images: [],
  })

  // Load localStorage data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("publicOfferWizardData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
      } catch (error) {
        console.error("Failed to parse saved form data:", error)
      }
    }
  }, [])

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("publicOfferWizardData", JSON.stringify(formData))
  }, [formData])

  /**
   * STEPPER NAVIGATION
   */
  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    localStorage.setItem("publicOfferWizardData", JSON.stringify(formData))
    setActiveStep(activeStep - 1)
  }

  /**
   * DIALOG HANDLERS (If you want to intercept navigation away)
   */
  const handleStay = () => setShowNavigationDialog(false)
  const handleLeaveWithoutSaving = () => {
    setShouldBlockNavigation(false)
    setShowNavigationDialog(false)
    // You might do a route change here
  }
  const handleLeaveWithSave = async () => {
    setIsSaving(true)
    // Save logic
    setShouldBlockNavigation(false)
    setShowNavigationDialog(false)
    setIsSaving(false)
  }

  /**
   * STEPS SUBMISSION
   */
  const handleStep1Submit = (updatedData: Partial<PublicOfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))
    handleNext()
  }

  /**
   * Calculate total price for the offer
   */
  const calculateTotalPrice = (): number => {
    const accommodationTotal = formData.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = formData.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = formData.cruises ? formData.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  /**
   * ---------------------------------------------------
   * FINAL SUBMIT: Post to your backend
   * ---------------------------------------------------
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

    // Convert cruises to transport entries for the API
    const cruiseTransports = formData.cruises.map((cruise) => ({
      transportType: TransportType.Cruise,
      departureTime: toLocalIso(cruise.departureTime),
      arrivalTime: toLocalIso(cruise.arrivalTime),
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
      departureTime: toLocalIso(transport.departureTime),
      arrivalTime: toLocalIso(transport.arrivalTime),
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
      checkIn: toLocalIso(acc.checkIn),
      checkOut: toLocalIso(acc.checkOut),
      hotelLink: acc.hotelLink,
      description: acc.description,
      boardBasis: acc.boardBasis,
      roomType: acc.roomType,
      price: acc.price,
      starRating: numberToStarRatingEnum(acc.starRating), // Convert number to enum string
    }))

    // Calculate total price
    const totalPrice = calculateTotalPrice()

    // Set the trip status based on whether it's a draft or not
    const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed
    const offerStatus = isDraft ? OfferStatus.ManuallyDisabled : OfferStatus.Active

    // Build a final request object
    const requestPayload = {
      agentId: user?.id || "", // or however you store your agent/user ID
      tripName: formData.tripName,
      description: formData.description,
      destination: formData.destination,
      category: formData.category || undefined,
      startDate: toLocalIso(formData.startDate),
      endDate: toLocalIso(formData.endDate),
      validUntil: toLocalIso(formData.validUntil),
      price: totalPrice,
      status: tripStatus,
      offerStatus: offerStatus,
      childrenCount: formData.childrenCount,
      adultsCount: formData.adultCount,
      itinerary: {
        title: formData.tripName,
        description: formData.description,
        itinerarySteps: [
          {
            description: "Pasiūlymas",
            price: totalPrice,
            transports: [...mappedTransports, ...cruiseTransports],
            accommodations: mappedAccommodations,
          },
        ],
      },
    }

    console.log("Sending this public offer to the backend:", requestPayload)

    try {
      // Create a FormData object for multipart/form-data submission
      const formDataPayload = new FormData()

      // FormData requires stringified JSON
      formDataPayload.append("data", JSON.stringify(requestPayload))

      // Append images
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((file) => {
          formDataPayload.append("images", file)
        })
      }

      // Now send it
      const response = await axios.post(`${API_URL}/PublicTripOfferFacade/agent`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      console.log("Successfully created the public offer:", response.data)

      // Show success message
      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai sukurtas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Clear localStorage after success
      localStorage.removeItem("publicOfferWizardData")

      // Reset form
      setFormData({
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
        status: TripStatus.Confirmed,
        offerStatus: OfferStatus.Active,
        accommodations: [],
        transports: [],
        cruises: [],
        images: [],
      })

      // Wait for 1 second after getting the response before redirecting
      setTimeout(() => {
        navigate(`/public-offers/${response.data.id}`)
      }, 1000)
    } catch (err: any) {
      console.error("Failed to create the public offer:", err)

      // Show error message
      setSnackbarMessage("Nepavyko sukurti pasiūlymo. Patikrinkite konsolę klaidos informacijai.")
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
          {activeStep === 0 && <Step1OfferDetails initialData={formData} onSubmit={handleStep1Submit} />}

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
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : "Patvirtinti"}
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
        <DialogTitle id="leave-dialog-title">Išsaugoti kaip juodraštį?</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Ar norite išsaugoti šį pasiūlymą kaip juodraštį prieš išeidami? Jei ne, pakeitimai bus prarasti.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStay} color="primary">
            Likti
          </Button>
          <Button onClick={handleLeaveWithoutSaving} color="error" startIcon={<ExitToApp />}>
            Išeiti be išsaugojimo
          </Button>
          <Button onClick={handleLeaveWithSave} color="primary" variant="contained" startIcon={<Save />}>
            Išsaugoti ir išeiti
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Snackbar for notifications */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </LocalizationProvider>
  )
}

export default CreatePublicOfferWizardForm
