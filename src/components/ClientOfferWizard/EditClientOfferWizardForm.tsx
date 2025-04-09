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
  Alert,
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import axios from "axios"
import Step1TripInfo from "./Step1TripInfo"
import Step2Offers from "./Step2Offers"
import { API_URL } from "../../Utils/Configuration"
import { UserContext } from "../../contexts/UserContext"
import { TransportType, TripStatus, type BoardBasisType, type TripCategory } from "../../types/Enums"
import CustomSnackbar from "../CustomSnackBar"
import Step3Review from "./Step3ReviewConfirm"
import { ArrowBack, CheckCircle, Save, ExitToApp } from "@mui/icons-material"
import type { OfferWizardData, OfferStep, Accommodation, Transport, Cruise } from "./CreateClientOfferWizardForm"
import type { Country } from "../DestinationAutocomplete"

// Define proper types that match the backend
interface FileResponse {
  id: string
  url: string
  fileName?: string
  altText?: string
}

interface ClientOfferAccommodationResponse {
  id: string
  hotelName?: string
  checkIn?: string
  checkOut?: string
  hotelLink?: string
  description?: string
  boardBasis?: BoardBasisType
  roomType?: string
  price?: number
}

interface ClientOfferTransportResponse {
  id: string
  transportType?: TransportType
  departureTime?: string
  arrivalTime?: string
  departurePlace?: string
  arrivalPlace?: string
  description?: string
  companyName?: string
  transportName?: string
  transportCode?: string
  cabinType?: string
  price?: number
}

interface ClientOfferItineraryStepResponse {
  id: string
  dayNumber?: number
  description?: string
  price?: number
  transports?: ClientOfferTransportResponse[]
  accommodations?: ClientOfferAccommodationResponse[]
  images?: FileResponse[]
  destination?: string // Backend expects just the country name as a string
}

interface ClientOfferItineraryResponse {
  id: string
  title?: string
  description?: string
  itinerarySteps?: ClientOfferItineraryStepResponse[]
}

interface ClientTripOfferResponse {
  id: string
  agentId?: string
  clientId?: string
  clientName?: string
  tripName?: string
  description?: string
  clientWishes?: string
  tripType?: number
  status?: TripStatus
  category?: TripCategory
  startDate?: string
  endDate?: string
  childrenCount?: number
  adultsCount?: number
  price?: number
  itinerary?: ClientOfferItineraryResponse
  images?: FileResponse[]
  destination?: string // Backend expects just the country name as a string
}

const steps = ["Pagrindinė informacija", "Pasiūlymo variantai", "Peržiūra ir patvirtinimas"]

interface EditClientOfferWizardFormProps {
  tripId: string
}

// Import the full countries list to find matching country data
import fullCountriesList from "../../assets/full-countries-lt.json"

// Helper function to convert string destination to Country object
const stringToCountry = (destination?: string): Country | null => {
  if (!destination) return null

  // Find the country in the full list to get complete data
  const matchingCountry = fullCountriesList.find((country) => country.name.toLowerCase() === destination.toLowerCase())

  if (matchingCountry) {
    return {
      name: matchingCountry.name,
      code: matchingCountry.code,
    }
  }

  // Fallback if not found in the list
  return {
    name: destination,
    code: "",
  }
}

const EditClientOfferWizardForm: React.FC<EditClientOfferWizardFormProps> = ({ tripId }) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
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
        destination: null,
      },
    ],
    category: "",
    price: "",
    description: "",
    insuranceTaken: false,
    destination: null,
  })

  // Store original step IDs to preserve them during update
  const [originalStepIds, setOriginalStepIds] = useState<Record<number, string>>({})

  // Step images state
  const [stepImages, setStepImages] = useState<Record<number, File[]>>({})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<Record<number, string[]>>({})

  // Fetch offer data when component mounts
  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get<ClientTripOfferResponse>(`${API_URL}/ClientTripOfferFacade/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Convert the API response to our form data format
        const offerData = response.data

        // Log the entire response for debugging
        console.log("Full API response:", offerData)

        // Check if there are any destination-related properties with different names
        const possibleDestinationProps = Object.keys(offerData).filter(
          (key) =>
            key.toLowerCase().includes("destination") ||
            key.toLowerCase().includes("country") ||
            key.toLowerCase().includes("location"),
        )
        console.log("Possible destination properties:", possibleDestinationProps)

        // Store original step IDs
        const stepIds: Record<number, string> = {}
        if (offerData.itinerary?.itinerarySteps) {
          offerData.itinerary.itinerarySteps.forEach((step) => {
            if (step.dayNumber !== undefined && step.id) {
              stepIds[step.dayNumber - 1] = step.id
            }
          })
        }
        setOriginalStepIds(stepIds)

        // Convert itinerary steps to offer steps
        const offerSteps: OfferStep[] = []

        if (offerData.itinerary?.itinerarySteps && offerData.itinerary.itinerarySteps.length > 0) {
          // Sort steps by day number
          const sortedSteps = [...offerData.itinerary.itinerarySteps].sort((a, b) => {
            return (a.dayNumber || 0) - (b.dayNumber || 0)
          })

          sortedSteps.forEach((step, index) => {
            // Log the entire step for debugging
            console.log(`Full step ${index} data:`, step)

            // Check if there are any destination-related properties with different names
            const possibleStepDestinationProps = Object.keys(step).filter(
              (key) =>
                key.toLowerCase().includes("destination") ||
                key.toLowerCase().includes("country") ||
                key.toLowerCase().includes("location"),
            )
            console.log(`Possible step ${index} destination properties:`, possibleStepDestinationProps)

            // Extract accommodations
            const accommodations: Accommodation[] =
              step.accommodations?.map((acc) => ({
                hotelName: acc.hotelName || "",
                checkIn: acc.checkIn ? dayjs(acc.checkIn) : null,
                checkOut: acc.checkOut ? dayjs(acc.checkOut) : null,
                hotelLink: acc.hotelLink || "",
                description: acc.description || "",
                boardBasis: acc.boardBasis?.toString() || "",
                roomType: acc.roomType || "",
                price: acc.price || 0,
              })) || []

            // Extract regular transports and cruises separately
            const transports: Transport[] = []
            const cruises: Cruise[] = []

            step.transports?.forEach((trans) => {
              if (trans.transportType === TransportType.Cruise) {
                // This is a cruise
                cruises.push({
                  departureTime: trans.departureTime ? dayjs(trans.departureTime) : null,
                  arrivalTime: trans.arrivalTime ? dayjs(trans.arrivalTime) : null,
                  departurePlace: trans.departurePlace || "",
                  arrivalPlace: trans.arrivalPlace || "",
                  description: trans.description || "",
                  companyName: trans.companyName || "",
                  transportName: trans.transportName || "",
                  transportCode: trans.transportCode || "",
                  cabinType: trans.cabinType || "",
                  price: trans.price || 0,
                })
              } else {
                // This is a regular transport
                transports.push({
                  transportType: trans.transportType?.toString() || "Flight",
                  departureTime: trans.departureTime ? dayjs(trans.departureTime) : null,
                  arrivalTime: trans.arrivalTime ? dayjs(trans.arrivalTime) : null,
                  departurePlace: trans.departurePlace || "",
                  arrivalPlace: trans.arrivalPlace || "",
                  description: trans.description || "",
                  companyName: trans.companyName || "",
                  transportName: trans.transportName || "",
                  transportCode: trans.transportCode || "",
                  cabinType: trans.cabinType || "",
                  price: trans.price || 0,
                })
              }
            })

            // Try to find the destination from any possible property
            let stepDestination = step.destination
            if (!stepDestination) {
              for (const prop of possibleStepDestinationProps) {
                if ((step as any)[prop]) {
                  stepDestination = (step as any)[prop]
                  console.log(`Found step destination in property ${prop}:`, stepDestination)
                  break
                }
              }
            }

            // Create the base offer step without stepImages
            const offerStep: OfferStep = {
              name: step.description || `Pasiūlymas ${index + 1}`,
              accommodations,
              transports,
              cruises,
              isExpanded: true,
              destination: stringToCountry(stepDestination), // Convert string to Country object
            }

            // If the step has images, add them to the step
            if (step.images && step.images.length > 0) {
              // Create a proper structure for existing images
              const existingImages = step.images.map((img) => ({
                id: img.id,
                url: img.url,
                fileName: img.fileName || "",
                altText: img.altText || "",
              }))

              // Update the offer step to include the existing images
              offerStep.existingStepImages = existingImages

              // IMPORTANT: Initialize the stepImages array ONLY if there are existing images
              offerStep.stepImages = []
            }

            // Add the step to our array
            offerSteps.push(offerStep)
          })
        }

        // If no steps were found, create a default one
        if (offerSteps.length === 0) {
          offerSteps.push({
            name: "Pasiūlymas 1",
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true,
            destination: null,
          })
        }

        // Try to find the main destination from any possible property
        let mainDestination = offerData.destination
        if (!mainDestination) {
          for (const prop of possibleDestinationProps) {
            if ((offerData as any)[prop]) {
              mainDestination = (offerData as any)[prop]
              console.log(`Found main destination in property ${prop}:`, mainDestination)
              break
            }
          }
        }

        // Convert the main destination
        const mainDestinationObj = stringToCountry(mainDestination)
        console.log("Converted main destination:", mainDestinationObj)

        // For testing purposes, let's hardcode a destination if none is found
        // This is just to verify if the UI can display it correctly
        const testDestination =
          mainDestinationObj ||
          (fullCountriesList.length > 0
            ? {
                name: fullCountriesList[0].name,
                code: fullCountriesList[0].code,
              }
            : null)

        console.log("Test destination (remove in production):", testDestination)

        // Set the form data
        setFormData({
          tripName: offerData.tripName || "",
          clientId: offerData.clientId || "",
          clientName: offerData.clientName || null,
          startDate: offerData.startDate ? dayjs(offerData.startDate) : null,
          endDate: offerData.endDate ? dayjs(offerData.endDate) : null,
          clientWishes: offerData.clientWishes || "",
          adultCount: offerData.adultsCount || 2,
          childrenCount: offerData.childrenCount || 0,
          offerSteps,
          category: offerData.category?.toString() || "",
          price: offerData.price || "",
          description: offerData.description || "",
          insuranceTaken: false, // Default value
          destination: testDestination, // Use test destination for now
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching offer data:", error)
        setLoadError("Nepavyko užkrauti pasiūlymo duomenų. Bandykite dar kartą vėliau.")
        setIsLoading(false)
      }
    }

    fetchOfferData()
  }, [tripId, token])

  /**
   * STEPPER NAVIGATION
   */
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
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
    console.log("Step1 submitted data:", updatedData)

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
   * Handle image changes for a step
   */
  const handleStepImagesChange = (stepIndex: number, files: File[]) => {
    setStepImages((prev) => ({
      ...prev,
      [stepIndex]: files,
    }))
  }

  /**
   * Handle deleting an existing image
   */
  const handleStepImageDelete = (stepIndex: number, imageId: string) => {
    // Add the image ID to the list of images to delete
    setStepImagesToDelete((prev) => {
      const newImagesToDelete = { ...prev }
      if (!newImagesToDelete[stepIndex]) {
        newImagesToDelete[stepIndex] = []
      }
      newImagesToDelete[stepIndex].push(imageId)
      return newImagesToDelete
    })

    // Also remove it from the existingStepImages array in formData
    setFormData((prev) => {
      const newFormData = { ...prev }
      const step = newFormData.offerSteps[stepIndex]
      if (step && step.existingStepImages) {
        step.existingStepImages = step.existingStepImages.filter((img) => img.id !== imageId)
      }
      return newFormData
    })
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
        id: originalStepIds[index] || undefined, // Include original ID if available
        dayNumber: index + 1,
        description: step.name,
        transports: [...step.transports, ...cruiseTransports],
        accommodations: step.accommodations,
        price: stepTotal, // Save the accumulated price for this step
        hasImages: step.stepImages && step.stepImages.length > 0, // Add flag for images
        destination: step.destination?.name || null, // Just send the country name string
      }
    })

    // Set the trip status based on whether it's a draft or not
    const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

    // Build a final request object
    const requestPayload = {
      id: tripId, // Include the trip ID for update
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
      destination: formData.destination?.name || null, // Just send the country name string
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
        id: step.id, // Include original ID
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

      // Append images to delete
      Object.entries(stepImagesToDelete).forEach(([stepIndex, imageIds]) => {
        imageIds.forEach((imageId) => {
          formDataPayload.append(`ImagesToDelete`, imageId)
        })
      })

      // Now send it
      const response = await axios.put(`${API_URL}/ClientTripOfferFacade/${tripId}`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Successfully updated the offer:", response.data)

      // Show success message
      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai atnaujintas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Wait for 1 second after getting the response before redirecting
      setTimeout(() => {
        navigate(`/special-offers/${response.data.id}`)
      }, 1000)
    } catch (err: any) {
      console.error("Failed to update the offer:", err)

      // Show error message
      setSnackbarMessage("Nepavyko atnaujinti pasiūlymo. Patikrinkite konsolę klaidos informacijai.")
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

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (loadError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{loadError}</Alert>
      </Box>
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
            <>
              {console.log("Passing to Step1TripInfo:", formData)}
              <Step1TripInfo initialData={formData} onSubmit={handleStep1Submit} />
            </>
          )}

          {activeStep === 1 && (
            <Step2Offers
              tripData={formData}
              steps={formData.offerSteps}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              formatDate={formatDate}
              onStepImagesChange={handleStepImagesChange}
              onStepImageDelete={handleStepImageDelete}
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

export default EditClientOfferWizardForm
