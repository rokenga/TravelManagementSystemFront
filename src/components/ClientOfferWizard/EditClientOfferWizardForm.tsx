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

import { toLocalIso } from "../../Utils/dateSerialize"

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
  destination?: string
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
  destination?: string
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

const steps = ["Pagrindinė informacija", "Pasiūlymo variantai", "Peržiūra ir patvirtinimas"]

interface EditClientOfferWizardFormProps {
  tripId: string
  onDataChange?: (hasData: boolean) => void
  ref?: React.Ref<any>
}

import fullCountriesList from "../../assets/full-countries-lt.json"

import { starRatingEnumToNumber } from "../../Utils/starRatingUtils"

import { numberToStarRatingEnum } from "../../Utils/starRatingUtils"

const stringToCountry = (destination?: string): Country | null => {
  if (!destination) return null

  const matchingCountry = fullCountriesList.find((country) => country.name.toLowerCase() === destination.toLowerCase())

  if (matchingCountry) {
    return {
      name: matchingCountry.name,
      code: matchingCountry.code,
    }
  }

  return {
    name: destination,
    code: "",
  }
}

export const getImageUrl = (img: any): string => {
  if (img.urlInline) return img.urlInline
  if (img.url) return img.url
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
      return formData
    },
    saveAsDraft: async (destination?: string | null) => {
      await ref.current?.collectCurrentFormData()

      if (activeStep === 1) {
        const latestStepData = getCurrentStepData()
        if (latestStepData) {
          setFormData((prev) => ({
            ...prev,
            offerSteps: latestStepData,
          }))
        }
      }

      try {
        const result = await handleSubmit(true, destination)
        return result
      } catch (error) {
        return false
      }
    },
  }))

  const [stepImages, setStepImages] = useState<Record<number, File[]>>({})
  const [stepImagesToDelete, setStepImagesToDelete] = useState<Record<number, string[]>>({})

  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get<ClientTripOfferResponse>(`${API_URL}/ClientTripOfferFacade/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const offerData = response.data

        const possibleDestinationProps = Object.keys(offerData).filter(
          (key) =>
            key.toLowerCase().includes("destination") ||
            key.toLowerCase().includes("country") ||
            key.toLowerCase().includes("location"),
        )

        const offerSteps: OfferStep[] = []

        if (offerData.itinerary?.itinerarySteps && offerData.itinerary.itinerarySteps.length > 0) {
          const sortedSteps = [...offerData.itinerary.itinerarySteps].sort((a, b) => {
            return (a.dayNumber || 0) - (b.dayNumber || 0)
          })

          sortedSteps.forEach((step, index) => {
            const possibleStepDestinationProps = Object.keys(step).filter(
              (key) =>
                key.toLowerCase().includes("destination") ||
                key.toLowerCase().includes("country") ||
                key.toLowerCase().includes("location"),
            )
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

            const transports: Transport[] = []
            const cruises: Cruise[] = []

            step.transports?.forEach((trans) => {
              if (trans.transportType === TransportType.Cruise) {
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

            let stepDestination = step.destination
            if (!stepDestination) {
              for (const prop of possibleStepDestinationProps) {
                if ((step as any)[prop]) {
                  stepDestination = (step as any)[prop]
                  break
                }
              }
            }

            const offerStep: OfferStep = {
              id: step.id,
              name: step.description || `Pasiūlymas ${index + 1}`,
              accommodations,
              transports,
              cruises,
              isExpanded: true,
              destination: stringToCountry(stepDestination),
            }

            if (step.images && step.images.length > 0) {
              const existingImages = step.images.map((img) => ({
                id: img.id,
                url: img.url,
                urlInline: img.urlInline || img.url,
                fileName: img.fileName || "",
                altText: img.altText || "",
              }))

              offerStep.existingStepImages = existingImages

              offerStep.stepImages = []
            }

            offerSteps.push(offerStep)
          })
        }
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

        let mainDestination = offerData.destination
        if (!mainDestination) {
          for (const prop of possibleDestinationProps) {
            if ((offerData as any)[prop]) {
              mainDestination = (offerData as any)[prop]
              break
            }
          }
        }

        const mainDestinationObj = stringToCountry(mainDestination)

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
          insuranceTaken: false,
          destination: mainDestinationObj,
        })

        setIsLoading(false)
      } catch (error) {
        setLoadError("Nepavyko užkrauti pasiūlymo duomenų. Bandykite dar kartą vėliau.")
        setIsLoading(false)
      }
    }

    fetchOfferData()
  }, [tripId, token])

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

  useEffect(() => {
    if (onDataChange) {
      onDataChange(true)
    }
  }, [formData, onDataChange])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleStay = () => setShowNavigationDialog(false)
  const handleLeaveWithoutSaving = () => {
    setShouldBlockNavigation(false)
    setShowNavigationDialog(false)
    navigate(`/special-offers/${tripId}`)
  }
  const handleLeaveWithSave = async () => {
    setIsSaving(true)
    try {
      await handleSubmit(true)
      setShouldBlockNavigation(false)
      setShowNavigationDialog(false)
      navigate(`/special-offers/${tripId}`)
    } catch (error) {
      setSnackbarMessage("Nepavyko išsaugoti juodraščio. Bandykite dar kartą.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setIsSaving(false)
    }
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

  const handleStepImagesChange = (stepIndex: number, files: File[]) => {
    setStepImages((prev) => ({
      ...prev,
      [stepIndex]: files,
    }))

    setFormData((prev) => {
      const newFormData = { ...prev }
      const step = newFormData.offerSteps[stepIndex]
      if (step) {
        step.stepImages = files
      }
      return newFormData
    })
  }

  const handleStepImageDelete = (stepIndex: number, imageId: string) => {
    setStepImagesToDelete((prev) => {
      const newImagesToDelete = { ...prev }
      if (!newImagesToDelete[stepIndex]) {
        newImagesToDelete[stepIndex] = []
      }
      newImagesToDelete[stepIndex].push(imageId)
      return newImagesToDelete
    })

    setFormData((prev) => {
      const newFormData = { ...prev }
      const step = newFormData.offerSteps[stepIndex]
      if (step && step.existingStepImages) {
        step.existingStepImages = step.existingStepImages.filter((img) => img.id !== imageId)
      }
      return newFormData
    })
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
    if (isSavingRef.current) {
      return false
    }

    isSavingRef.current = true
    setIsSaving(true)

    try {
      let currentFormData = { ...formData }

      if (activeStep === 0 && window.__step1Ref && window.__step1Ref.collectFormData) {
        try {
          const step1Data = await window.__step1Ref.collectFormData()
          if (step1Data) {
            currentFormData = { ...currentFormData, ...step1Data }

            setFormData((prev) => ({
              ...prev,
              ...step1Data,
            }))
          }
        } catch (error) {}
      } else if (activeStep === 1) {
        try {
          const latestStepData = getCurrentStepData()
          if (latestStepData) {
            currentFormData = { ...currentFormData, offerSteps: latestStepData }

            setFormData((prev) => ({
              ...prev,
              offerSteps: latestStepData,
            }))
          }
        } catch (error) {}
      }

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

      const mappedSteps = currentFormData.offerSteps.map((step, index) => {
        const mappedAccommodations = step.accommodations.map((acc) => {
          let checkIn = acc.checkIn
          let checkOut = acc.checkOut

          if (checkIn && typeof checkIn === "string") {
            checkIn = dayjs(checkIn)
          }
          if (checkOut && typeof checkOut === "string") {
            checkOut = dayjs(checkOut)
          }

          return {
            ...acc,
            checkIn: toLocalIso(checkIn),
            checkOut: toLocalIso(checkOut),
            starRating: typeof acc.starRating === "number" ? numberToStarRatingEnum(acc.starRating) : acc.starRating,
          }
        })

        const mappedTransports = step.transports.map((trans) => {
          let departureTime = trans.departureTime
          let arrivalTime = trans.arrivalTime

          if (departureTime && typeof departureTime === "string") {
            departureTime = dayjs(departureTime)
          }
          if (arrivalTime && typeof arrivalTime === "string") {
            arrivalTime = dayjs(arrivalTime)
          }

          return {
            ...trans,
            departureTime: toLocalIso(departureTime),
            arrivalTime: toLocalIso(arrivalTime),
          }
        })

        const cruiseTransports = step.cruises.map((cruise) => {
          let departureTime = cruise.departureTime
          let arrivalTime = cruise.arrivalTime

          if (departureTime && typeof departureTime === "string") {
            departureTime = dayjs(departureTime)
          }
          if (arrivalTime && typeof arrivalTime === "string") {
            arrivalTime = dayjs(arrivalTime)
          }

          return {
            transportType: TransportType.Cruise,
            departureTime: toLocalIso(departureTime),
            arrivalTime: toLocalIso(arrivalTime),
            departurePlace: cruise.departurePlace,
            arrivalPlace: cruise.arrivalPlace,
            description: cruise.description,
            companyName: cruise.companyName,
            transportName: cruise.transportName,
            transportCode: cruise.transportCode,
            cabinType: cruise.cabinType,
            price: cruise.price,
          }
        })

        const stepTotal =
          step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0) +
          step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0) +
          (step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0)

        return {
          id: step.id,
          dayNumber: index + 1,
          description: step.name,
          transports: [...mappedTransports, ...cruiseTransports],
          accommodations: mappedAccommodations,
          price: stepTotal,
          hasImages: step.stepImages && step.stepImages.length > 0,
          destination: step.destination?.name || null,
        }
      })

      const startDate =
        currentFormData.startDate && typeof currentFormData.startDate === "string"
          ? dayjs(currentFormData.startDate)
          : currentFormData.startDate

      const endDate =
        currentFormData.endDate && typeof currentFormData.endDate === "string"
          ? dayjs(currentFormData.endDate)
          : currentFormData.endDate

      const tripStatus = isDraft ? TripStatus.Draft : TripStatus.Confirmed

      const totalPrice = calculateTotalPrice(currentFormData.offerSteps)

      const requestPayload = {
        id: tripId,
        agentId: user?.id || "",
        clientId: currentFormData.clientId || undefined,
        tripName: currentFormData.tripName,
        description: currentFormData.description,
        clientWishes: currentFormData.clientWishes,
        tripType: 2,
        category: currentFormData.category || undefined,
        startDate: toLocalIso(startDate),
        endDate: toLocalIso(endDate),
        price: totalPrice,
        status: tripStatus,
        destination: currentFormData.destination?.name || null,
        itinerary: {
          title: currentFormData.tripName || "Pasiūlymai",
          description: currentFormData.description || "Pasirinkite savo pasiūlymą",
          itinerarySteps: mappedSteps,
        },
        childrenCount: currentFormData.childrenCount,
        adultsCount: currentFormData.adultCount,
        images: null,
        documents: null,
      }

      const formDataPayload = new FormData()

      const itinerarySteps = mappedSteps.map((step, index) => ({
        id: step.id,
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

      currentFormData.offerSteps.forEach((step, index) => {
        if (step.stepImages && step.stepImages.length > 0) {
          step.stepImages.forEach((file) => {
            formDataPayload.append(`NewStepImages_${index}`, file)
          })
        }
      })

      const allImagesToDelete = { ...stepImagesToDelete }
      if (activeStep === 1 && step2Ref.current && step2Ref.current.getDeletedImages) {
        const step2DeletedImages = step2Ref.current.getDeletedImages()

        Object.entries(step2DeletedImages).forEach(([stepIdx, imageIds]) => {
          if (!allImagesToDelete[stepIdx]) {
            allImagesToDelete[stepIdx] = []
          }

          imageIds.forEach((id) => {
            if (!allImagesToDelete[stepIdx].includes(id)) {
              allImagesToDelete[stepIdx].push(id)
            }
          })
        })
      }

      Object.entries(allImagesToDelete).forEach(([stepIndex, imageIds]) => {
        imageIds.forEach((imageId) => {
          formDataPayload.append(`StepImagesToDelete_${stepIndex}`, imageId)
        })
      })

      const response = await axios.put(`${API_URL}/ClientTripOfferFacade/${tripId}`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setSnackbarMessage(
        isDraft ? "Pasiūlymas sėkmingai išsaugotas kaip juodraštis!" : "Pasiūlymas sėkmingai atnaujintas!",
      )
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

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

      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      isSavingRef.current = false
      setIsSaving(false)
      return false
    }
  }

  const handleSaveAsDraft = () => {
    handleSubmit(true)
  }

  const formatDate = (date: Dayjs | null): string => {
    if (!date) return "Nenustatyta"
    return date.format("YYYY-MM-DD HH:mm")
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

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
              <Step1TripInfo initialData={formData} onSubmit={handleStep1Submit} ref={step1Ref} />
            </>
          )}

          {activeStep === 1 && (
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
