"use client"
import { useState, useEffect, useContext, useRef, useImperativeHandle, forwardRef } from "react"
import { useNavigate } from "react-router-dom"
import { Stepper, Step as MuiStep, StepLabel, Paper, Box, Button } from "@mui/material"
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
import { ArrowBack, CheckCircle, Save } from "@mui/icons-material"
import type { Country } from "../DestinationAutocomplete"
// Import the utility function
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"
import { toLocalIso } from "../../Utils/dateSerialize"
//import { getCurrentStepData } from "./Step2Offers"
import { getCurrentStepData } from "./Step2Offers"
import dayjs from "dayjs"

// Add these lines at the top of your file, after the imports
declare global {
  interface Window {
    saveClientOfferAsDraft?: (destination?: string | null) => Promise<boolean>
    __currentFormData?: any
    __step1Ref?: any
    __step2Ref?: any
  }
}

// Add a function to get the current form data
export function getCurrentFormData() {
  return window.__currentFormData || null
}

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

// Update the OfferStep interface to include id
export interface OfferStep {
  id?: string // <–– NEW
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
  destination?: Country | null
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

interface CreateClientOfferWizardFormProps {
  onDataChange?: (hasData: boolean) => void
}

/**
 * --------------------------------------------------
 * MAIN WIZARD COMPONENT
 * --------------------------------------------------
 */
const CreateClientOfferWizardForm = forwardRef<any, CreateClientOfferWizardFormProps>(({ onDataChange }, ref) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const step1Ref = useRef<any>(null)
  const step2Ref = useRef<any>(null)

  // Store refs globally for access from outside
  useEffect(() => {
    window.__step1Ref = step1Ref.current
    window.__step2Ref = step2Ref.current

    return () => {
      window.__step1Ref = undefined
      window.__step2Ref = undefined
    }
  }, [step1Ref.current, step2Ref.current])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    collectCurrentFormData: async () => {
      // Based on the active step, collect data from the appropriate component
      if (activeStep === 0 && step1Ref.current && step1Ref.current.collectFormData) {
        const step1Data = await step1Ref.current.collectFormData()
        console.log("Collected Step 1 data:", step1Data)
        if (step1Data) {
          setFormData((prev) => ({
            ...prev,
            ...step1Data,
          }))
        }
      } else if (activeStep === 1 && step2Ref.current && step2Ref.current.collectFormData) {
        const step2Data = await step2Ref.current.collectFormData()
        console.log("Collected Step 2 data:", step2Data)
        if (step2Data) {
          setFormData((prev) => ({
            ...prev,
            offerSteps: step2Data,
          }))
        }
      }
    },
  }))

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

  // Inside the component, add this effect to store the current form data
  useEffect(() => {
    // Store the current form data in a global variable for access from outside
    window.__currentFormData = formData

    // Clean up when component unmounts
    return () => {
      window.__currentFormData = null
    }
  }, [formData])

  // Add URL parameter handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdParam = urlParams.get("clientId")
    const clientNameParam = urlParams.get("clientName")

    if (clientIdParam && clientNameParam) {
      console.log("Setting client from URL params in wizard:", clientIdParam, clientNameParam)
      setFormData((prev) => ({
        ...prev,
        clientId: clientIdParam,
        clientName: clientNameParam,
      }))

      // Update localStorage with the new data
      try {
        localStorage.setItem(
          "clientOfferFormData",
          JSON.stringify({
            ...formData,
            clientId: clientIdParam,
            clientName: clientNameParam,
          }),
        )
      } catch (error) {
        console.error("Error saving URL params to localStorage:", error)
      }
    }
  }, []) // Empty dependency array since we only want to run this once on mount

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

    // Check if trip dates have changed and there are existing events
    const hasExistingEvents = formData.offerSteps.some(
      (step) =>
        step.accommodations.length > 0 || step.transports.length > 0 || (step.cruises && step.cruises.length > 0),
    )

    const tripDatesChanged =
      (updatedData.startDate && (!formData.startDate || !updatedData.startDate.isSame(formData.startDate))) ||
      (updatedData.endDate && (!formData.endDate || !updatedData.endDate.isSame(formData.endDate)))

    if (hasExistingEvents && tripDatesChanged) {
      // Show a warning that dates might need adjustment in Step 2
      setSnackbarMessage("Kelionės datos buvo pakeistos. Prašome patikrinti, ar visi įvykiai yra kelionės datų ribose.")
      setSnackbarSeverity("warning")
      setSnackbarOpen(true)
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

  // Add this validation function before the handleSubmit function

  /**
   * Validate form data before submission
   */
  const validateFormData = (isDraft: boolean): { isValid: boolean; message: string } => {
    // If it's a draft, we don't need to validate
    if (isDraft) {
      return { isValid: true, message: "" }
    }

    // Check if there's at least one offer step
    if (!formData.offerSteps || formData.offerSteps.length === 0) {
      return { isValid: false, message: "Būtina pridėti bent vieną pasiūlymą" }
    }

    // Check if each offer step has at least one accommodation, transport, or cruise
    for (let i = 0; i < formData.offerSteps.length; i++) {
      const step = formData.offerSteps[i]
      const hasAccommodations = step.accommodations && step.accommodations.length > 0
      const hasTransports = step.transports && step.transports.length > 0
      const hasCruises = step.cruises && step.cruises.length > 0

      if (!hasAccommodations && !hasTransports && !hasCruises) {
        return {
          isValid: false,
          message: `Pasiūlyme "${step.name}" būtina pridėti bent vieną apgyvendinimą, transportą arba kruizą`,
        }
      }
    }

    return { isValid: true, message: "" }
  }

  /**
   * ---------------------------------------------------
   * FINAL SUBMIT: Post to your backend
   * ---------------------------------------------------
   */
  const handleSubmit = async (isDraft = false, destination?: string | null): Promise<boolean> => {
    // Validate form data if not a draft
    if (!isDraft) {
      const validation = validateFormData(isDraft)
      if (!validation.isValid) {
        setSnackbarMessage(validation.message)
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return false
      }
    }

    // Prevent multiple simultaneous save operations
    if (isSavingRef.current) {
      console.log("Save operation already in progress, skipping duplicate call")
      return false
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      // First, try to collect the current form data based on the active step
      await ref.current?.collectCurrentFormData()

      // Get the latest data from the steps
      const latestStepData = getCurrentStepData()
      if (latestStepData) {
        setFormData((prev) => ({
          ...prev,
          offerSteps: latestStepData,
        }))
      }

      // Map the steps to the format expected by the API
      const mappedSteps = formData.offerSteps.map((step, index) => {
        // Map accommodations with converted star ratings
        const mappedAccommodations = step.accommodations.map((acc) => ({
          ...acc,
          checkIn: toLocalIso(acc.checkIn),
          checkOut: toLocalIso(acc.checkOut),
          starRating: typeof acc.starRating === "number" ? numberToStarRatingEnum(acc.starRating) : acc.starRating,
        }))

        // Convert cruises to transport entries
        const cruiseTransports = step.cruises.map((cruise) => ({
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

        // Map transports with toLocalIso for dates
        const mappedTransports = step.transports.map((trans) => ({
          ...trans,
          departureTime: toLocalIso(trans.departureTime),
          arrivalTime: toLocalIso(trans.arrivalTime),
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
          transports: [...mappedTransports, ...cruiseTransports],
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
        startDate: toLocalIso(formData.startDate),
        endDate: toLocalIso(formData.endDate),
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

      // If we have a specific destination, navigate there
      if (destination) {
        setTimeout(() => navigate(destination), 1500)
      } else if (response.data.id) {
        // Otherwise, navigate to the offer detail page
        setTimeout(() => {
          navigate(`/special-offers/${response.data.id}`)
        }, 1500)
      }

      isSavingRef.current = false
      setIsSaving(false)
      return true
    } catch (err: any) {
      console.error("Failed to create the offer:", err)

      // Show error message
      setSnackbarMessage("Nepavyko sukurti pasiūlymo. Patikrinkite konsolę klaidos informacijai.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      isSavingRef.current = false
      setIsSaving(false)
      return false
    }
  }

  // Add this effect to track changes and expose the save function
  useEffect(() => {
    // Find the window.saveClientOfferAsDraft function and update it to accept a destination parameter
    window.saveClientOfferAsDraft = async (destination?: string | null) => {
      return await handleSubmit(true, destination)
    }

    // Clean up the global function when component unmounts
    return () => {
      delete window.saveClientOfferAsDraft
    }
  }, [formData])

  // Save as draft function
  const handleSaveAsDraft = () => {
    handleSubmit(true)
  }

  // Format date for display (not crucial if you rely on the pickers)
  const formatDate = (date: Dayjs | null | string | undefined): string => {
    if (!date) return "Nenustatyta"

    // If it's a string, try to convert it to a Dayjs object
    if (typeof date === "string") {
      try {
        return dayjs(date).format("YYYY-MM-DD HH:mm")
      } catch (e) {
        return date || "Nenustatyta"
      }
    }

    // If it's a Dayjs object, use format
    if (date && typeof date.format === "function") {
      return date.format("YYYY-MM-DD HH:mm")
    }

    // Fallback
    return String(date) || "Nenustatyta"
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
          {activeStep === 0 && (
            <Step1TripInfo
              initialData={formData}
              onSubmit={handleStep1Submit}
              onDataChange={onDataChange}
              ref={step1Ref}
            />
          )}

          {activeStep === 1 && (
            <Step2Offers
              tripData={formData}
              steps={formData.offerSteps}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              formatDate={formatDate}
              onDataChange={onDataChange}
              ref={step2Ref}
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
                  data-save-button="true"
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
                  data-save-button="true"
                >
                  Patvirtinti
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Custom Snackbar for notifications */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </LocalizationProvider>
  )
})

export default CreateClientOfferWizardForm
