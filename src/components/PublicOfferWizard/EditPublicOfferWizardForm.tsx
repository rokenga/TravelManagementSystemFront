"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
  Typography,
} from "@mui/material"
import { ArrowBack, CheckCircle, Save } from "@mui/icons-material"
import { API_URL } from "../../Utils/Configuration"
import Step1OfferDetails from "./Step1OfferDetails"
import Step2ReviewConfirm from "./Step2ReviewConfirm"
import type { PublicOfferWizardData } from "./CreatePublicOfferWizardForm"
import CustomSnackbar from "../CustomSnackBar"
import type { PublicOfferDetails } from "../../types/PublicSpecialOffer"
import { toLocalIso } from "../../Utils/dateSerialize"
import { numberToStarRatingEnum, starRatingEnumToNumber } from "../../Utils/starRatingUtils"

declare global {
  interface Window {
    saveEditOfferAsDraft?: (destination?: string | null) => Promise<boolean>
  }
}

const steps = ["Pasiūlymo informacija", "Peržiūra ir patvirtinimas"]

interface EditPublicOfferWizardFormProps {
  tripId: string
  onDataChange?: (hasChanges: boolean) => void
}

const parseDateCorrectly = (dateString: string | null | undefined): dayjs.Dayjs | null => {
  if (!dateString) return null

  let date = dayjs(dateString)

  if (date.isValid()) return date

  const parts = dateString.split(/[-T ]/)
  if (parts.length >= 3) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]

    const formattedDate = `${year}-${month}-${day}`
    date = dayjs(formattedDate)

    if (date.isValid()) return date
  }

  return null
}

const safeToLocalIso = (date: dayjs.Dayjs | null): string | null => {
  if (!date || !date.isValid()) return null
  return toLocalIso(date)
}

const validateOfferData = (
  data: PublicOfferWizardData,
  isDraft: boolean,
): { isValid: boolean; errorMessage: string } => {
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

  return {
    isValid: true,
    errorMessage: "",
  }
}

const EditPublicOfferWizardForm: React.FC<EditPublicOfferWizardFormProps> = ({ tripId, onDataChange }) => {
  const navigate = useNavigate()
  const { id: urlParamId } = useParams<{ id: string }>() 
  const effectiveTripId = tripId || urlParamId

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasFormChanges, setHasFormChanges] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const isSavingRef = useRef(false)

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

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

  const [originalData, setOriginalData] = useState<string>("")

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
              checkIn: parseDateCorrectly(acc.checkIn), 
              checkOut: parseDateCorrectly(acc.checkOut), 
              hotelLink: acc.hotelLink || "",
              description: acc.description || "",
              boardBasis: acc.boardBasis || "",
              roomType: acc.roomType || "",
              price: acc.price || 0,
              starRating: starRatingEnumToNumber(acc.starRating), 
            })) || [],
          transports:
            step?.transports
              .filter((t) => t.transportType !== "Cruise")
              .map((trans) => ({
                transportType: trans.transportType || "Flight",
                departureTime: parseDateCorrectly(trans.departureTime), 
                arrivalTime: parseDateCorrectly(trans.arrivalTime), 
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
                departureTime: parseDateCorrectly(cruise.departureTime), 
                arrivalTime: parseDateCorrectly(cruise.arrivalTime), 
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
        setOriginalData(JSON.stringify(mappedFormData))
        setInitialDataLoaded(true)
        setError(null)
      } catch (err) {
        setError("Nepavyko gauti pasiūlymo duomenų. Bandykite vėliau.")
      } finally {
        setLoading(false)
      }
    }

    fetchOfferData()
  }, [effectiveTripId])

  useEffect(() => {
    window.saveEditOfferAsDraft = async (destination?: string | null) => {
      try {
        if (isSavingRef.current) {
          return false
        }

        isSavingRef.current = true
        setIsSaving(true)

        const result = await handleSubmit(true, destination)

        isSavingRef.current = false

        return result
      } catch (error) {
        setSnackbarMessage("Nepavyko išsaugoti juodraščio. Bandykite dar kartą.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        setIsSaving(false)
        isSavingRef.current = false
        return false
      }
    }

    return () => {
      delete window.saveEditOfferAsDraft
    }
  }, [formData])

  useEffect(() => {
    if (initialDataLoaded) {
      const currentDataString = JSON.stringify(formData)
      const hasChanges = currentDataString !== originalData || imagesToDelete.length > 0 || formData.images.length > 0

      setHasFormChanges(hasChanges)

      if (onDataChange) {
        onDataChange(hasChanges)
      }
    }
  }, [formData, originalData, imagesToDelete, initialDataLoaded, onDataChange])

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  const handleStep1Submit = (updatedData: Partial<PublicOfferWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updatedData }))
    handleNext()
  }

  const handleImageDelete = useCallback((imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages?.filter((img) => img.id !== imageId) || [],
    }))
  }, [])

  const handleSubmit = async (isDraft = false, destination?: string | null): Promise<boolean> => {
    const validationResult = validateOfferData(formData, isDraft)
    if (!validationResult.isValid) {
      setSnackbarMessage(validationResult.errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return false
    }

    setIsSaving(true)

    try {
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

      const mappedAccommodations = formData.accommodations.map((acc) => ({
        hotelName: acc.hotelName,
        checkIn: safeToLocalIso(acc.checkIn),
        checkOut: safeToLocalIso(acc.checkOut),
        hotelLink: acc.hotelLink,
        description: acc.description,
        boardBasis: acc.boardBasis,
        roomType: acc.roomType,
        price: acc.price,
        starRating: numberToStarRatingEnum(acc.starRating), 
      }))

      const accommodationTotal = formData.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
      const transportTotal = formData.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
      const cruiseTotal = formData.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0)
      const totalPrice = accommodationTotal + transportTotal + cruiseTotal

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


      const formDataPayload = new FormData()
      formDataPayload.append("data", JSON.stringify(requestPayload))

      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((file) => {
          formDataPayload.append("newImages", file)
        })
      }

      const response = await axios.put(`${API_URL}/PublicTripOfferFacade/agent/${effectiveTripId}`, formDataPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      })


      setSnackbarMessage("Pasiūlymas sėkmingai atnaujintas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      setHasFormChanges(false)
      if (onDataChange) {
        onDataChange(false)
      }

      setTimeout(() => {
        if (destination) {
          navigate(destination)
        } else {
          navigate(`/public-offers/${effectiveTripId}`)
        }
      }, 1000)

      return true
    } catch (err: any) {

      let errorMessage = "Nepavyko atnaujinti pasiūlymo. Patikrinkite įvestus duomenis."
      if (err.response?.data) {
        if (typeof err.response.data === "object" && err.response.data.Message) {
          errorMessage = err.response.data.Message
        }
        else if (typeof err.response.data === "object" && err.response.data.message) {
          errorMessage = err.response.data.message
        }
        else if (typeof err.response.data === "string") {
          errorMessage = err.response.data
        }
        else if (typeof err.response.data === "object") {
          try {
            errorMessage = JSON.stringify(err.response.data)
          } catch (e) {
          }
        }
      }
      setSnackbarMessage(errorMessage)
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
      <Box sx={{ width: "100%" }} data-wizard-form="true">
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
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : "Atnaujinti"}
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

export default EditPublicOfferWizardForm
