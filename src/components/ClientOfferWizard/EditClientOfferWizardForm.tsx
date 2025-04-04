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
}

const steps = ["Pagrindinė informacija", "Pasiūlymo variantai", "Peržiūra ir patvirtinimas"]

interface EditClientOfferWizardFormProps {
  tripId: string
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
      },
    ],
    category: "",
    price: "",
    description: "",
    insuranceTaken: false,
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

            // Create the offer step
            offerSteps.push({
              name: step.description || `Pasiūlymas ${index + 1}`,
              accommodations,
              transports,
              cruises,
              isExpanded: true,
              stepImages: [], // Initialize with empty array, we'll handle existing images differently
            })

            // If the step has images, store them in the stepImages state
            if (step.images && step.images.length > 0) {
              // Create a proper structure for existing images
              const existingImages = step.images.map((img) => ({
                id: img.id,
                url: img.url,
                fileName: img.fileName || "",
                altText: img.altText || "",
              }))

              // Update the offer step to include the existing images
              offerSteps[index].existingStepImages = existingImages

              // IMPORTANT: Initialize the stepImages array to trigger the image section display
              offerSteps[index].stepImages = []
            }
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
          })
        }

        // Set form data
        setFormData({
          tripName: offerData.tripName || "",
          clientId: offerData.clientId?.toString() || "",
          clientName: offerData.clientName || null,
          startDate: offerData.startDate ? dayjs(offerData.startDate) : null,
          endDate: offerData.endDate ? dayjs(offerData.endDate) : null,
          clientWishes: offerData.clientWishes || "",
          adultCount: offerData.adultsCount || 2,
          childrenCount: offerData.childrenCount || 0,
          offerSteps,
          category: offerData.category?.toString() || "",
          price: offerData.price?.toString() || "",
          description: offerData.description || "",
          insuranceTaken: false, // Default value as it's not in the response
        })

        setIsLoading(false)
      } catch (err: any) {
        console.error("Failed to fetch offer data:", err)
        setLoadError(err.response?.data?.message || "Nepavyko gauti pasiūlymo duomenų.")
        setIsLoading(false)
      }
    }

    fetchOfferData()
  }, [tripId, token])

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

  // Handle step images change
  const handleStepImagesChange = (stepIndex: number, files: File[]) => {
    setStepImages((prev) => ({
      ...prev,
      [stepIndex]: files,
    }))

    // Update the form data to reflect the change
    setFormData((prev) => {
      const updatedSteps = [...prev.offerSteps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        stepImages: files,
      }
      return {
        ...prev,
        offerSteps: updatedSteps,
      }
    })
  }

  // Handle step image delete
  const handleStepImageDelete = (stepIndex: number, imageId: string) => {
    // Add the image ID to the list of images to delete
    setStepImagesToDelete((prev) => {
      const current = prev[stepIndex] || []
      return {
        ...prev,
        [stepIndex]: [...current, imageId],
      }
    })

    // Also remove it from the existingStepImages array in the form data
    setFormData((prev) => {
      const updatedSteps = [...prev.offerSteps]
      if (updatedSteps[stepIndex].existingStepImages) {
        updatedSteps[stepIndex].existingStepImages = updatedSteps[stepIndex].existingStepImages?.filter(
          (img) => img.id !== imageId,
        )
      }
      return {
        ...prev,
        offerSteps: updatedSteps,
      }
    })
  }

  /**
   * ---------------------------------------------------
   * FINAL SUBMIT: Post to your backend
   * ---------------------------------------------------
   */
  // Let's try a completely different approach for the FormData construction
  // Replace the entire handleSubmit function

  const handleSubmit = async (isDraft = false) => {
    setIsSaving(true)

    try {
      // Create a FormData object for multipart/form-data submission
      const formDataPayload = new FormData()

      // Map the steps to the format expected by the API
      const itinerarySteps = formData.offerSteps.map((step, index) => {
        // Combine regular transports and cruises
        const allTransports = [
          ...step.transports.map((trans) => ({
            transportType: trans.transportType,
            departureTime: trans.departureTime,
            arrivalTime: trans.arrivalTime,
            departurePlace: trans.departurePlace,
            arrivalPlace: trans.arrivalPlace,
            description: trans.description,
            companyName: trans.companyName,
            transportName: trans.transportName,
            transportCode: trans.transportCode,
            cabinType: trans.cabinType,
            price: trans.price,
          })),
          ...step.cruises.map((cruise) => ({
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
          })),
        ]

        // Calculate total price for this step
        const stepTotal =
          step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0) +
          step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0) +
          (step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0)

        return {
          id: originalStepIds[index], // Include the original step ID if it exists
          dayNumber: index + 1,
          description: step.name,
          transports: allTransports,
          accommodations: step.accommodations,
          price: stepTotal,
          stepImagesToDelete: stepImagesToDelete[index] || [],
        }
      })

      // Set the trip status based on whether it's a draft or not
      const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

      // Build a final request object
      const requestPayload = {
        id: tripId,
        agentId: user?.id || "",
        clientId: formData.clientId || undefined,
        tripName: formData.tripName,
        description: formData.description,
        clientWishes: formData.clientWishes,
        tripType: 2, // 2 = ClientSpecialOffer
        category: formData.category || undefined,
        startDate: formData.startDate ? formData.startDate.toDate() : null,
        endDate: formData.endDate ? formData.endDate.toDate() : null,
        status: tripStatus,
        itinerary: {
          title: "Multi-Option Itinerary",
          description: "Choose your option",
          itinerarySteps: itinerarySteps,
        },
        childrenCount: formData.childrenCount,
        adultsCount: formData.adultCount,
      }

      // Add the JSON data
      formDataPayload.append("data", JSON.stringify(requestPayload))

      // Add files for each step - EXACTLY matching the backend code
      formData.offerSteps.forEach((step, index) => {
        if (step.stepImages && step.stepImages.length > 0) {
          step.stepImages.forEach((file) => {
            // Based on the backend code, it expects "NewStepImages_{index}" field
            formDataPayload.append(`NewStepImages_${index}`, file)

            formDataPayload.append(`NewStepImages_${index}`, file)
          })
        }
      })

      // Add images to delete
      Object.entries(stepImagesToDelete).forEach(([stepIndex, ids]) => {
        if (ids.length > 0) {
          formDataPayload.append(`StepImagesToDelete_${stepIndex}`, ids.join(","))
        }
      })

      console.log("Sending this updated offer to the backend:", requestPayload)
      console.log("FormData entries:")
      for (const pair of formDataPayload.entries()) {
        console.log(pair[0], pair[1])
      }

      // Now send it - use PUT for update with axios but without setting Content-Type
      const response = await axios.put(`${API_URL}/ClientTripOfferFacade/${tripId}`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          // Let the browser set the Content-Type with boundary
        },
      })

      console.log("Successfully updated the offer:", response.data)

      // Show success message
      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai atnaujintas kaip juodraštis!" : "Pasiūlymas sėkmingai atnaujintas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Clear localStorage after success
      localStorage.removeItem("offerWizardData")

      // Wait for 1 second after getting the response before redirecting
      setTimeout(() => {
        navigate(`/special-offers/${response.data.id || tripId}`)
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
      <Alert severity="error" sx={{ mt: 2 }}>
        {loadError}
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
          {activeStep === 0 && <Step1TripInfo initialData={formData} onSubmit={handleStep1Submit} />}

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

