"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Stepper, Step as MuiStep, StepLabel, Paper, Box, Button, CircularProgress } from "@mui/material"
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
import { ArrowBack, CheckCircle, Save } from "@mui/icons-material"
import { toLocalIso } from "../../Utils/dateSerialize"
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

declare global {
  interface Window {
    saveCreateOfferAsDraft?: (destination?: string | null) => Promise<boolean>
  }
}

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

  if (!data.images || (data.images.length === 0 && (!data.existingImages || data.existingImages.length === 0))) {
    return {
      isValid: false,
      errorMessage: "Būtina įkelti bent vieną nuotrauką",
    }
  }

  const hasAccommodations = data.accommodations.length > 0
  const hasTransports = data.transports.length > 0
  const hasCruises = data.cruises.length > 0

  if (!hasAccommodations && !hasTransports && !hasCruises) {
    return {
      isValid: false,
      errorMessage: "Būtina pridėti bent vieną apgyvendinimą, transportą arba kruizą",
    }
  }

  if (hasAccommodations) {
    const invalidAccommodation = data.accommodations.find((acc) => !validateAccommodation(acc))
    if (invalidAccommodation) {
      return {
        isValid: false,
        errorMessage: "Visi apgyvendinimo duomenys turi būti užpildyti",
      }
    }
  }

  if (hasTransports) {
    const invalidTransport = data.transports.find((trans) => !validateTransport(trans))
    if (invalidTransport) {
      return {
        isValid: false,
        errorMessage: "Visi transporto duomenys turi būti užpildyti",
      }
    }
  }

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

interface CreatePublicOfferWizardFormProps {
  onDataChange?: (hasChanges: boolean) => void
}

const CreatePublicOfferWizardForm: React.FC<CreatePublicOfferWizardFormProps> = ({ onDataChange }) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true)
  const [hasFormChanges, setHasFormChanges] = useState(false)

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  const user = useContext(UserContext)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

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

  useEffect(() => {
    const savedData = localStorage.getItem("publicOfferWizardData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
        if (onDataChange) {
          onDataChange(true)
        }
        setHasFormChanges(true)
      } catch (error) {
      }
    }
  }, [onDataChange])

  useEffect(() => {
    localStorage.setItem("publicOfferWizardData", JSON.stringify(formData))

    if (onDataChange) {
      const hasData =
        formData.tripName.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.destination.trim() !== "" ||
        formData.startDate !== null ||
        formData.endDate !== null ||
        formData.validUntil !== null ||
        formData.accommodations.length > 0 ||
        formData.transports.length > 0 ||
        formData.cruises.length > 0 ||
        formData.images.length > 0

      onDataChange(hasData)
      setHasFormChanges(hasData)
    }
  }, [formData, onDataChange])

  useEffect(() => {
    window.saveCreateOfferAsDraft = async (destination?: string | null) => {
      try {
        if (isSaving) {
          return false
        }

        setIsSaving(true)

        const result = await handleSubmit(true, destination)

        setIsSaving(false)

        return result
      } catch (error) {
        setSnackbarMessage("Nepavyko išsaugoti juodraščio. Bandykite dar kartą.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        setIsSaving(false)
        return false
      }
    }

    return () => {
      delete window.saveCreateOfferAsDraft
    }
  }, [formData, isSaving])

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    localStorage.setItem("publicOfferWizardData", JSON.stringify(formData))
    setActiveStep(activeStep - 1)
  }

  const handleStep1Submit = (updatedData: Partial<PublicOfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))
    handleNext()
  }

  const calculateTotalPrice = (): number => {
    const accommodationTotal = formData.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = formData.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
    const cruiseTotal = formData.cruises ? formData.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
    return accommodationTotal + transportTotal + cruiseTotal
  }

  const handleSubmit = async (isDraft = false, destination?: string | null): Promise<boolean> => {
    const validationResult = validateOfferData(formData, isDraft)
    if (!validationResult.isValid) {
      setSnackbarMessage(validationResult.errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return false
    }

    setIsSaving(true)

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

    const mappedAccommodations = formData.accommodations.map((acc) => ({
      hotelName: acc.hotelName,
      checkIn: toLocalIso(acc.checkIn),
      checkOut: toLocalIso(acc.checkOut),
      hotelLink: acc.hotelLink,
      description: acc.description,
      boardBasis: acc.boardBasis,
      roomType: acc.roomType,
      price: acc.price,
      starRating: numberToStarRatingEnum(acc.starRating), 
    }))

    const totalPrice = calculateTotalPrice()

    const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed
    const offerStatus = isDraft ? OfferStatus.ManuallyDisabled : OfferStatus.Active

    const requestPayload = {
      agentId: user?.id || "", 
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


    try {
      const formDataPayload = new FormData()

      formDataPayload.append("data", JSON.stringify(requestPayload))

      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((file) => {
          formDataPayload.append("images", file)
        })
      }

      const response = await axios.post(`${API_URL}/PublicTripOfferFacade/agent`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })


      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai sukurtas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      localStorage.removeItem("publicOfferWizardData")

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

      if (onDataChange) {
        onDataChange(false)
      }
      setHasFormChanges(false)

      setTimeout(() => {
        if (destination) {
          navigate(destination)
        } else {
          navigate(`/public-offers/${response.data.id}`)
        }
      }, 1000)

      return true
    } catch (err: any) {

      setSnackbarMessage("Nepavyko sukurti pasiūlymo. Patikrinkite konsolę klaidos informacijai.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      setIsSaving(false)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAsDraft = () => {
    handleSubmit(true)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="lt">
      <Box sx={{ width: "100%" }} data-wizard-form="true">
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
                  data-wizard-navigation="true"
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
