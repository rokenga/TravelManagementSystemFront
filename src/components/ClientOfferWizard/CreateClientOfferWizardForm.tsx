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
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import type { Dayjs } from "dayjs"
import axios from "axios"
import Step1TripInfo from "./Step1TripInfo"
import Step2Offers from "./Step2Offers"
import { API_URL } from "../../Utils/Configuration"
import { UserContext } from "../../contexts/UserContext"
import { TransportType, TripStatus } from "../../types/Enums"
import CustomSnackbar from "../CustomSnackBar"
import Step3Review from "./Step3ReviewConfirm"
import { ArrowBack, CheckCircle, Save, ExitToApp } from "@mui/icons-material"
import type { Country } from "../DestinationAutocomplete"
// Import the utility function
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

const steps = ["Pagrindinė informacija", "Pasiūlymo variantai", "Peržiūra ir patvirtinimas"]

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
 * Each step in the wizard (i.e. each "offer option" for the user).
 */
export interface OfferStep {
  name: string
  accommodations: Accommodation[]
  transports: Transport[]
  cruises: Cruise[]
  isExpanded: boolean
  stepImages?: File[]
  existingStepImages?: Array<{
    id: string
    url: string
    altText?: string
  }>
  destination?: Country | null // New field for step-specific destination
}

/**
 * Main state shape for the entire form.
 */
export interface OfferWizardData {
  tripName: string
  clientId: string
  clientName: string | null
  startDate: Dayjs | null
  endDate: Dayjs | null
  clientWishes: string
  adultCount: number
  childrenCount: number
  offerSteps: OfferStep[]
  category?: string
  price?: string | number
  description?: string
  insuranceTaken?: boolean
  destination?: Country | null // New field for trip-level destination
}

/**
 * --------------------------------------------------
 * MAIN WIZARD COMPONENT
 * --------------------------------------------------
 */
const CreateClientOfferWizardForm: React.FC = () => {
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

  // Initialize form data with at least one empty offer step
  const [formData, setFormData] = useState<OfferWizardData>({
    tripName: "",
    clientId: "",
    clientName: null,
    startDate: null,
    endDate: null,
    clientWishes: "",
    adultCount: 2,
    childrenCount: 0,
    offerSteps: [
      {
        name: "Pasiūlymas 1",
        accommodations: [],
        transports: [],
        cruises: [],
        isExpanded: true,
        destination: null, // Initialize with null
      },
    ],
    category: "",
    price: "",
    description: "",
    insuranceTaken: false,
    destination: null, // Initialize with null
  })

  // Load localStorage data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("offerWizardData")
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
    localStorage.setItem("offerWizardData", JSON.stringify(formData))
  }, [formData])

  /**
   * STEPPER NAVIGATION
   */
  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    localStorage.setItem("offerWizardData", JSON.stringify(formData))
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
  const handleStep1Submit = (updatedData: Partial<OfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))

    // If there's a main trip destination but no destinations on individual offers,
    // add the main destination to all offers that don't have a specific destination
    if (updatedData.destination && formData.offerSteps) {
      const updatedSteps = formData.offerSteps.map((step) => {
        if (!step.destination) {
          return { ...step, destination: updatedData.destination }
        }
        return step
      })

      setFormData((prevData) => ({
        ...prevData,
        ...updatedData,
        offerSteps: updatedSteps,
      }))
    } else {
      setFormData((prevData) => ({ ...prevData, ...updatedData }))
    }

    handleNext()
  }

  /**
   * We call this after finishing Step 2
   */
  const handleStep2Submit = (offerSteps: OfferStep[], shouldNavigate = false) => {
    // Only update if changed
    if (JSON.stringify(formData.offerSteps) !== JSON.stringify(offerSteps)) {
      setFormData((prev) => ({
        ...prev,
        offerSteps,
      }))
    }
    if (shouldNavigate) {
      handleNext()
    }
  }

  /**
   * Calculate total price for all offers
   */
  const calculateTotalPrice = (steps: OfferStep[]): number => {
    return steps.reduce((total, step) => {
      const accommodationTotal = step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
      const transportTotal = step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
      const cruiseTotal = step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
      return total + accommodationTotal + transportTotal + cruiseTotal
    }, 0)
  }

  /**
   * ---------------------------------------------------
   * FINAL SUBMIT: Post to your backend
   * ---------------------------------------------------
   */
  const handleSubmit = async (isDraft = false) => {
    setIsSaving(true)

    // Map the steps to the format expected by the API
    const mappedSteps = formData.offerSteps.map((step, index) => {
      // Map accommodations with converted star ratings
      const mappedAccommodations = step.accommodations.map((acc) => ({
        ...acc,
        starRating: typeof acc.starRating === "number" ? numberToStarRatingEnum(acc.starRating) : acc.starRating,
      }))

      // Convert cruises to transport entries
      const cruiseTransports = step.cruises.map((cruise) => ({
        transportType: TransportType.Cruise,
        departureTime: cruise.departureTime,
        arrivalTime: cruise.arrivalTime,
        departurePlace: cruise.departurePlace,
        arrivalPlace: cruise.arrivalPlace,
        description: cruise.description,
        companyName: cruise.companyName,
        transportName: cruise.transportName,
        transportCode: cruise.transportCode,
        cabinType: cruise.cabinType,
        price: cruise.price,
      }))

      // Calculate total price for this step
      const stepTotal =
        step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0) +
        step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0) +
        (step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0)

      // Include hasImages flag to indicate if this step has images
      return {
        dayNumber: index + 1,
        description: step.name,
        transports: [...step.transports, ...cruiseTransports],
        accommodations: mappedAccommodations,
        price: stepTotal, // Save the accumulated price for this step
        hasImages: step.stepImages && step.stepImages.length > 0, // Add flag for images
        destination: step.destination?.name || null, // Only send the country name string
      }
    })

    // Set the trip status based on whether it's a draft or not
    const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

    // Build a final request object
    const requestPayload = {
      agentId: user?.id || "", // or however you store your agent/user ID
      clientId: formData.clientId || undefined,
      tripName: formData.tripName,
      description: formData.description,
      clientWishes: formData.clientWishes,
      tripType: 2, // 2 = ClientSpecialOffer
      category: formData.category || undefined,
      startDate: formData.startDate ? formData.startDate.toDate() : null,
      endDate: formData.endDate ? formData.endDate.toDate() : null,
      // Remove price from the main payload - we'll use the accumulated prices from each step
      status: tripStatus, // Set the status based on isDraft
      destination: formData.destination?.name || null, // Only send the country name string
      itinerary: {
        title: "Multi-Option Itinerary", // or formData.whatever
        description: "Choose your option",
        itinerarySteps: mappedSteps,
      },
      childrenCount: formData.childrenCount,
      adultsCount: formData.adultCount,
      // We are ignoring images / documents for now
      images: null,
      documents: null,
    }

    // For demonstration, we do a console log
    console.log("Sending this offer to the backend:", requestPayload)

    try {
      // Create a FormData object for multipart/form-data submission
      const formDataPayload = new FormData()

      // Append the core JSON data
      const itinerarySteps = mappedSteps.map((step, index) => ({
        dayNumber: step.dayNumber,
        description: step.description,
        transports: step.transports,
        accommodations: step.accommodations,
        price: step.price,
        hasImages: step.hasImages, // Include the hasImages flag
        destination: step.destination, // Include destination as string
      }))

      const fullPayload = {
        ...requestPayload,
        itinerary: {
          title: requestPayload.itinerary?.title,
          description: requestPayload.itinerary?.description,
          itinerarySteps: itinerarySteps,
        },
      }

      // FormData requires stringified JSON
      formDataPayload.append("data", JSON.stringify(fullPayload))

      // Append step images
      formData.offerSteps.forEach((step, i) => {
        // Only append images if the step has actual image files
        if (step.stepImages && step.stepImages.length > 0) {
          step.stepImages.forEach((file) => {
            formDataPayload.append(`StepImages_${i}`, file) // ⬅️ naming must match backend
          })
        }
      })

      // Now send it
      const response = await axios.post(`${API_URL}/ClientTripOfferFacade`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Successfully created the offer:", response.data)

      // Show success message
      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai sukurtas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Clear localStorage after success
      localStorage.removeItem("offerWizardData")

      // Reset form
      setFormData({
        tripName: "",
        clientId: "",
        clientName: null,
        startDate: null,
        endDate: null,
        clientWishes: "",
        adultCount: 2,
        childrenCount: 0,
        offerSteps: [
          {
            name: "Pasiūlymas 1",
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true,
            destination: null,
          },
        ],
        category: "",
        price: "",
        description: "",
        insuranceTaken: false,
        destination: null,
      })

      // Wait for 1 second after getting the response before redirecting
      setTimeout(() => {
        navigate(`/special-offers/${response.data.id}`)
      }, 1000)
    } catch (err: any) {
      console.error("Failed to create the offer:", err)

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

  // Format date for display (not crucial if you rely on the pickers)
  const formatDate = (date: Dayjs | null): string => {
    if (!date) return "Nenustatyta"
    return date.format("YYYY-MM-DD HH:mm")
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
          {activeStep === 0 && <Step1TripInfo initialData={formData} onSubmit={handleStep1Submit} />}

          {activeStep === 1 && (
            <Step2Offers
              tripData={formData}
              steps={formData.offerSteps}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              formatDate={formatDate}
            />
          )}

          {activeStep === 2 && (
            <>
              <Step3Review tripData={formData} />
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
                  Patvirtinti
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

export default CreateClientOfferWizardForm
