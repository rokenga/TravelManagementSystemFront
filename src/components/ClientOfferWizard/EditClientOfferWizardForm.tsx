"use client"

import type React from "react"
import { useState, useEffect, useContext, useRef, forwardRef, useImperativeHandle } from "react"
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
import type { OfferWizardData, Accommodation, Transport, Cruise } from "./CreateClientOfferWizardForm"
import type { Country } from "../DestinationAutocomplete"
import { getCurrentStepData } from "./Step2Offers"

// Add this import at the top of the file, with the other imports
import { toLocalIso } from "../../Utils/dateSerialize"

// Define proper types that match the backend
interface FileResponse {
  id: string
  url: string
  urlInline?: string
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
  starRating?: number
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

// 1. Update the OfferStep interface (same as in CreateClientOfferWizardForm.tsx)
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

const steps = ["Pagrindinė informacija", "Pasiūlymo variantai", "Peržiūra ir patvirtinimas"]

interface EditClientOfferWizardFormProps {
  tripId: string
  onDataChange?: (hasData: boolean) => void
  ref?: React.Ref<any>
}

// Import the full countries list to find matching country data
import fullCountriesList from "../../assets/full-countries-lt.json"

// Import the utility function
import { starRatingEnumToNumber } from "../../Utils/starRatingUtils"

// Import the utility function
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

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

// Helper function to get the best URL for an image
export const getImageUrl = (img: any): string => {
  // Try urlInline first (which might be used in some API responses)
  if (img.urlInline) return img.urlInline
  // Then try url
  if (img.url) return img.url
  // Fallback to placeholder
  return "/placeholder.svg"
}

const EditClientOfferWizardForm = forwardRef<any, EditClientOfferWizardFormProps>(({ tripId, onDataChange }, ref) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true)

  // Refs for Step components
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
      return formData
    },
    saveAsDraft: async (destination?: string | null) => {
      // First collect current form data from the active step
      await ref.current?.collectCurrentFormData()

      // Get the latest data from Step2 if we're on that step
      if (activeStep === 1) {
        const latestStepData = getCurrentStepData()
        if (latestStepData) {
          setFormData((prev) => ({
            ...prev,
            offerSteps: latestStepData,
          }))
        }
      }

      // Then save as draft with the destination
      try {
        const result = await handleSubmit(true, destination)
        return result
      } catch (error) {
        console.error("Error saving draft:", error)
        return false
      }
    },
  }))

  // 3. Delete the originalStepIds state
  // const [originalStepIds, setOriginalStepIds] = useState<Record<number, string>>({})

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
        // const stepIds: Record<number, string> = {}
        // if (offerData.itinerary?.itinerarySteps) {
        //   offerData.itinerary.itinerarySteps.forEach((step) => {
        //     if (step.dayNumber !== undefined && step.id) {
        //       stepIds[step.dayNumber - 1] = step.id
        //     }
        //   })
        // }
        // setOriginalStepIds(stepIds)

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
                starRating:
                  typeof acc.starRating === "string" ? starRatingEnumToNumber(acc.starRating) : acc.starRating || null,
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

            // 2. Update the offerStep creation in the sortedSteps.forEach loop
            const offerStep: OfferStep = {
              id: step.id, // <–– NEW
              name: step.description || `Pasiūlymas ${index + 1}`,
              accommodations,
              transports,
              cruises,
              isExpanded: true,
              destination: stringToCountry(stepDestination), // Convert string to Country object
            }

            // If the step has images, add them to the step
            if (step.images && step.images.length > 0) {
              console.log(`Step ${index} has ${step.images.length} images:`, step.images)

              // Create a proper structure for existing images
              const existingImages = step.images.map((img) => ({
                id: img.id,
                url: img.url,
                urlInline: img.urlInline || img.url, // Ensure urlInline is available
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
          price: offerData.price?.toString() || "",
          description: offerData.description || "",
          insuranceTaken: false, // Default value
          destination: mainDestinationObj, // Use the converted destination
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

  // Add window beforeunload event listener to prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlockNavigation) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldBlockNavigation])

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(true)
    }
  }, [formData, onDataChange])

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
    navigate(`/special-offers/${tripId}`)
  }
  const handleLeaveWithSave = async () => {
    setIsSaving(true)
    try {
      // Save as draft
      await handleSubmit(true)
      setShouldBlockNavigation(false)
      setShowNavigationDialog(false)
      navigate(`/special-offers/${tripId}`)
    } catch (error) {
      console.error("Error saving draft:", error)
      setSnackbarMessage("Nepavyko išsaugoti juodraščio. Bandykite dar kartą.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setIsSaving(false)
    }
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
    console.log(`Adding ${files.length} new images to step ${stepIndex}`)
    setStepImages((prev) => ({
      ...prev,
      [stepIndex]: files,
    }))

    // Also update the form data
    setFormData((prev) => {
      const newFormData = { ...prev }
      const step = newFormData.offerSteps[stepIndex]
      if (step) {
        step.stepImages = files
      }
      return newFormData
    })
  }

  /**
   * Handle deleting an existing image
   */
  const handleStepImageDelete = (stepIndex: number, imageId: string) => {
    console.log(`Parent: Deleting image with ID: ${imageId} from step ${stepIndex}`)

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
    // Prevent multiple simultaneous save operations
    if (isSavingRef.current) {
      console.log("Save operation already in progress, skipping duplicate call")
      return false
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      // First try to collect the current form data based on the active step
      let currentFormData = { ...formData } // Start with a copy of the current state

      // Get the latest data from the steps based on active step
      if (activeStep === 0 && window.__step1Ref && window.__step1Ref.collectFormData) {
        try {
          const step1Data = await window.__step1Ref.collectFormData()
          if (step1Data) {
            // Update our local copy with the latest data
            currentFormData = { ...currentFormData, ...step1Data }

            // Also update the state for future reference
            setFormData((prev) => ({
              ...prev,
              ...step1Data,
            }))
          }
        } catch (error) {
          console.error("Error collecting Step 1 data:", error)
        }
      } else if (activeStep === 1) {
        try {
          const latestStepData = getCurrentStepData()
          if (latestStepData) {
            // Update our local copy with the latest data
            currentFormData = { ...currentFormData, offerSteps: latestStepData }

            // Also update the state for future reference
            setFormData((prev) => ({
              ...prev,
              offerSteps: latestStepData,
            }))
          }
        } catch (error) {
          console.error("Error collecting Step 2 data:", error)
        }
      }

      // Validate form data if not a draft
      if (!isDraft) {
        const validation = validateFormData(isDraft)
        if (!validation.isValid) {
          setSnackbarMessage(validation.message)
          setSnackbarSeverity("error")
          setSnackbarOpen(true)
          isSavingRef.current = false
          setIsSaving(false)
          return false
        }
      }

      // Map the steps to the format expected by the API - using currentFormData instead of formData
      const mappedSteps = currentFormData.offerSteps.map((step, index) => {
        // Map accommodations with converted star ratings and proper date formatting
        const mappedAccommodations = step.accommodations.map((acc) => ({
          ...acc,
          checkIn: toLocalIso(acc.checkIn),
          checkOut: toLocalIso(acc.checkOut),
          starRating: typeof acc.starRating === "number" ? numberToStarRatingEnum(acc.starRating) : acc.starRating,
        }))

        // Map transports with proper date formatting
        const mappedTransports = step.transports.map((trans) => ({
          ...trans,
          departureTime: toLocalIso(trans.departureTime),
          arrivalTime: toLocalIso(trans.arrivalTime),
        }))

        // Convert cruises to transport entries with proper date formatting
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

        // Calculate total price for this step
        const stepTotal =
          step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0) +
          step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0) +
          (step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0)

        // Include hasImages flag to indicate if this step has images
        // 5. Update the mappedSteps in handleSubmit to use step.id
        return {
          id: step.id, // was originalStepIds[index]
          dayNumber: index + 1,
          description: step.name,
          transports: [...mappedTransports, ...cruiseTransports],
          accommodations: mappedAccommodations,
          price: stepTotal,
          hasImages: step.stepImages && step.stepImages.length > 0,
          destination: step.destination?.name || null,
        }
      })

      // Set the trip status based on whether it's a draft or not
      const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

      // Calculate total price for the entire trip
      const totalPrice = calculateTotalPrice(currentFormData.offerSteps)

      // Build a final request object using currentFormData instead of formData
      const requestPayload = {
        id: tripId, // Include the trip ID for update
        agentId: user?.id || "", // or however you store your agent/user ID
        clientId: currentFormData.clientId || undefined,
        tripName: currentFormData.tripName,
        description: currentFormData.description,
        clientWishes: currentFormData.clientWishes,
        tripType: 2, // 2 = ClientSpecialOffer
        category: currentFormData.category || undefined,
        startDate: toLocalIso(currentFormData.startDate),
        endDate: toLocalIso(currentFormData.endDate),
        price: totalPrice, // Include the calculated total price
        status: tripStatus, // Set the status based on isDraft
        destination: currentFormData.destination?.name || null, // Just send the country name string
        itinerary: {
          title: currentFormData.tripName || "Multi-Option Itinerary",
          description: currentFormData.description || "Choose your option",
          itinerarySteps: mappedSteps,
        },
        childrenCount: currentFormData.childrenCount,
        adultsCount: currentFormData.adultCount,
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

      // Append step images from currentFormData.offerSteps directly
      currentFormData.offerSteps.forEach((step, index) => {
        if (step.stepImages && step.stepImages.length > 0) {
          step.stepImages.forEach((file) => {
            formDataPayload.append(`NewStepImages_${index}`, file)
          })
        }
      })

      // Log the images to delete before appending them
      console.log("Images to delete by step:", stepImagesToDelete)

      // Inside handleSubmit, before creating the FormData
      // Collect deleted images from Step2 if we're on that step
      const allImagesToDelete = { ...stepImagesToDelete }
      if (activeStep === 1 && step2Ref.current && step2Ref.current.getDeletedImages) {
        const step2DeletedImages = step2Ref.current.getDeletedImages()
        console.log("Deleted images from Step2:", step2DeletedImages)

        // Merge with the form-level tracking
        Object.entries(step2DeletedImages).forEach(([stepIdx, imageIds]) => {
          if (!allImagesToDelete[stepIdx]) {
            allImagesToDelete[stepIdx] = []
          }

          // Add any image IDs that aren't already in the list
          imageIds.forEach((id) => {
            if (!allImagesToDelete[stepIdx].includes(id)) {
              allImagesToDelete[stepIdx].push(id)
            }
          })
        })
      }

      console.log("All images to delete after merging:", allImagesToDelete)

      // Then use allImagesToDelete instead of stepImagesToDelete when appending to FormData
      Object.entries(allImagesToDelete).forEach(([stepIndex, imageIds]) => {
        console.log(`Processing deletion for step ${stepIndex}:`, imageIds)
        imageIds.forEach((imageId) => {
          console.log(`Appending image ID ${imageId} for deletion from step ${stepIndex}`)
          formDataPayload.append(`StepImagesToDelete_${stepIndex}`, imageId)
        })
      })

      // Log the final FormData contents for debugging
      console.log("FormData contents before submission:")
      for (const pair of formDataPayload.entries()) {
        console.log(pair[0], pair[1])
      }

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

      // If we have a specific destination, navigate there
      if (destination) {
        console.log("Navigating to destination:", destination)
        setTimeout(() => {
          navigate(destination)
        }, 1000)
      } else if (!isDraft) {
        // Otherwise, navigate to the offer detail page if not a draft
        setTimeout(() => {
          navigate(`/special-offers/${response.data.id}`)
        }, 1000)
      }

      isSavingRef.current = false
      setIsSaving(false)
      return true
    } catch (err: any) {
      console.error("Failed to update the offer:", err)

      // Extract error message from response if available
      let errorMessage = "Nepavyko atnaujinti pasiūlymo."
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        }
      }

      // Show error message
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      isSavingRef.current = false
      setIsSaving(false)
      return false
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

  // Handle navigation away from the form
  const handleNavigateAway = () => {
    if (shouldBlockNavigation) {
      setShowNavigationDialog(true)
    } else {
      navigate(`/special-offers/${tripId}`)
    }
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
              <Step1TripInfo initialData={formData} onSubmit={handleStep1Submit} ref={step1Ref} />
            </>
          )}

          {activeStep === 1 && (
            // 4. Remove originalStepIds from Step2Offers props
            <Step2Offers
              ref={step2Ref}
              tripData={formData}
              steps={formData.offerSteps}
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              formatDate={formatDate}
              onStepImagesChange={handleStepImagesChange}
              onStepImageDelete={handleStepImageDelete}
              onDataChange={onDataChange}
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
          <Button
            onClick={handleLeaveWithSave}
            color="primary"
            variant="contained"
            startIcon={<Save />}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : "Išsaugoti ir išeiti"}
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
})

export default EditClientOfferWizardForm
