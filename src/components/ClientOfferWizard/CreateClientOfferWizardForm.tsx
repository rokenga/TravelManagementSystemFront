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
import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"
import { toLocalIso } from "../../Utils/dateSerialize"
import { getCurrentStepData } from "./Step2Offers"
import dayjs from "dayjs"

declare global {
  interface Window {
    saveClientOfferAsDraft?: (destination?: string | null) => Promise<boolean>
    __currentFormData?: any
    __step1Ref?: any
    __step2Ref?: any
  }
}

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

export interface OfferStep {
  id?: string
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
  destination?: Country | null
}

interface CreateClientOfferWizardFormProps {
  onDataChange?: (hasData: boolean) => void
}

const CreateClientOfferWizardForm = forwardRef<any, CreateClientOfferWizardFormProps>(({ onDataChange }, ref) => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)
  const step1Ref = useRef<any>(null)
  const step2Ref = useRef<any>(null)

  useEffect(() => {
    window.__step1Ref = step1Ref.current
    window.__step2Ref = step2Ref.current

    return () => {
      window.__step1Ref = undefined
      window.__step2Ref = undefined
    }
  }, [step1Ref.current, step2Ref.current])

  useImperativeHandle(ref, () => ({
    collectCurrentFormData: async () => {
      if (activeStep === 0 && step1Ref.current && step1Ref.current.collectFormData) {
        const step1Data = await step1Ref.current.collectFormData()
        if (step1Data) {
          setFormData((prev) => ({
            ...prev,
            ...step1Data,
          }))
        }
      } else if (activeStep === 1 && step2Ref.current && step2Ref.current.collectFormData) {
        const step2Data = await step2Ref.current.collectFormData()
        if (step2Data) {
          setFormData((prev) => ({
            ...prev,
            offerSteps: step2Data,
          }))
        }
      }
    },
  }))

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  const user = useContext(UserContext)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

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

  useEffect(() => {
    const savedData = localStorage.getItem("offerWizardData")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData)
      } catch (error) {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("offerWizardData", JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    window.__currentFormData = formData

    return () => {
      window.__currentFormData = null
    }
  }, [formData])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdParam = urlParams.get("clientId")
    const clientNameParam = urlParams.get("clientName")

    if (clientIdParam && clientNameParam) {
      setFormData((prev) => ({
        ...prev,
        clientId: clientIdParam,
        clientName: clientNameParam,
      }))

      try {
        localStorage.setItem(
          "clientOfferFormData",
          JSON.stringify({
            ...formData,
            clientId: clientIdParam,
            clientName: clientNameParam,
          }),
        )
      } catch (error) {}
    }
  }, [])

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    localStorage.setItem("offerWizardData", JSON.stringify(formData))
    setActiveStep(activeStep - 1)
  }

  const handleStep1Submit = (updatedData: Partial<OfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))

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

    const hasExistingEvents = formData.offerSteps.some(
      (step) =>
        step.accommodations.length > 0 || step.transports.length > 0 || (step.cruises && step.cruises.length > 0),
    )

    const tripDatesChanged =
      (updatedData.startDate && (!formData.startDate || !updatedData.startDate.isSame(formData.startDate))) ||
      (updatedData.endDate && (!formData.endDate || !updatedData.endDate.isSame(formData.endDate)))

    if (hasExistingEvents && tripDatesChanged) {
      setSnackbarMessage("Kelionės datos buvo pakeistos. Prašome patikrinti, ar visi įvykiai yra kelionės datų ribose.")
      setSnackbarSeverity("warning")
      setSnackbarOpen(true)
    }

    handleNext()
  }

  const handleStep2Submit = (offerSteps: OfferStep[], shouldNavigate = false) => {
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

  const calculateTotalPrice = (steps: OfferStep[]): number => {
    return steps.reduce((total, step) => {
      const accommodationTotal = step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
      const transportTotal = step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
      const cruiseTotal = step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0
      return total + accommodationTotal + transportTotal + cruiseTotal
    }, 0)
  }

  const validateFormData = (isDraft: boolean): { isValid: boolean; message: string } => {
    if (isDraft) {
      return { isValid: true, message: "" }
    }

    if (!formData.offerSteps || formData.offerSteps.length === 0) {
      return { isValid: false, message: "Būtina pridėti bent vieną pasiūlymą" }
    }

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

  const handleSubmit = async (isDraft = false, destination?: string | null): Promise<boolean> => {
    if (!isDraft) {
      const validation = validateFormData(isDraft)
      if (!validation.isValid) {
        setSnackbarMessage(validation.message)
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return false
      }
    }

    if (isSavingRef.current) {
      return false
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      await ref.current?.collectCurrentFormData()

      const latestStepData = getCurrentStepData()
      if (latestStepData) {
        setFormData((prev) => ({
          ...prev,
          offerSteps: latestStepData,
        }))
      }

      const mappedSteps = formData.offerSteps.map((step, index) => {
        const mappedAccommodations = step.accommodations.map((acc) => ({
          ...acc,
          checkIn: toLocalIso(acc.checkIn),
          checkOut: toLocalIso(acc.checkOut),
          starRating: typeof acc.starRating === "number" ? numberToStarRatingEnum(acc.starRating) : acc.starRating,
        }))

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

        const mappedTransports = step.transports.map((trans) => ({
          ...trans,
          departureTime: toLocalIso(trans.departureTime),
          arrivalTime: toLocalIso(trans.arrivalTime),
        }))

        const stepTotal =
          step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0) +
          step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0) +
          (step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0)

        return {
          dayNumber: index + 1,
          description: step.name,
          transports: [...mappedTransports, ...cruiseTransports],
          accommodations: mappedAccommodations,
          price: stepTotal,
          hasImages: step.stepImages && step.stepImages.length > 0,
          destination: step.destination?.name || null,
        }
      })

      const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

      const requestPayload = {
        agentId: user?.id || "",
        clientId: formData.clientId || undefined,
        tripName: formData.tripName,
        description: formData.description,
        clientWishes: formData.clientWishes,
        tripType: 2,
        category: formData.category || undefined,
        startDate: toLocalIso(formData.startDate),
        endDate: toLocalIso(formData.endDate),
        status: tripStatus,
        destination: formData.destination?.name || null,
        itinerary: {
          title: "",
          description: "",
          itinerarySteps: mappedSteps,
        },
        childrenCount: formData.childrenCount,
        adultsCount: formData.adultCount,
        images: null,
        documents: null,
      }

      const formDataPayload = new FormData()

      const itinerarySteps = mappedSteps.map((step, index) => ({
        dayNumber: step.dayNumber,
        description: step.description,
        transports: step.transports,
        accommodations: step.accommodations,
        price: step.price,
        hasImages: step.hasImages,
        destination: step.destination,
      }))

      const fullPayload = {
        ...requestPayload,
        itinerary: {
          title: requestPayload.itinerary?.title,
          description: requestPayload.itinerary?.description,
          itinerarySteps: itinerarySteps,
        },
      }

      formDataPayload.append("data", JSON.stringify(fullPayload))

      formData.offerSteps.forEach((step, i) => {
        if (step.stepImages && step.stepImages.length > 0) {
          step.stepImages.forEach((file) => {
            formDataPayload.append(`StepImages_${i}`, file)
          })
        }
      })

      const response = await axios.post(`${API_URL}/ClientTripOfferFacade`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai sukurtas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      localStorage.removeItem("offerWizardData")

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

      if (destination) {
        setTimeout(() => navigate(destination), 1500)
      } else if (response.data.id) {
        setTimeout(() => {
          navigate(`/special-offers/${response.data.id}`)
        }, 1500)
      }

      isSavingRef.current = false
      setIsSaving(false)
      return true
    } catch (err: any) {
      setSnackbarMessage("Nepavyko sukurti pasiūlymo. Patikrinkite konsolę klaidos informacijai.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      isSavingRef.current = false
      setIsSaving(false)
      return false
    }
  }

  useEffect(() => {
    window.saveClientOfferAsDraft = async (destination?: string | null) => {
      return await handleSubmit(true, destination)
    }

    return () => {
      delete window.saveClientOfferAsDraft
    }
  }, [formData])

  const handleSaveAsDraft = () => {
    handleSubmit(true)
  }

  const formatDate = (date: Dayjs | null | string | undefined): string => {
    if (!date) return "Nenustatyta"

    if (typeof date === "string") {
      try {
        return dayjs(date).format("YYYY-MM-DD HH:mm")
      } catch (e) {
        return date || "Nenustatyta"
      }
    }

    if (date && typeof date.format === "function") {
      return date.format("YYYY-MM-DD HH:mm")
    }

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
