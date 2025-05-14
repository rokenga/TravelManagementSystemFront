"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Box, Button, Divider, Typography } from "@mui/material"
import { ArrowForward } from "@mui/icons-material"
import CustomSnackbar from "../CustomSnackBar"
import type { PublicOfferWizardData, Accommodation, Transport, Cruise } from "./CreatePublicOfferWizardForm"
import { validateDateTimeConstraints } from "../../Utils/validationUtils"
import TripBasicInfoForm from "./details/TripBasicInfoForm"
import TripElementsSection from "./details/TripElementsSection"

interface Step1Props {
  initialData: PublicOfferWizardData
  onSubmit: (data: Partial<PublicOfferWizardData>) => void
  onExistingImageDelete?: (imageId: string) => void
  isEditing?: boolean
}

const Step1OfferDetails: React.FC<Step1Props> = ({
  initialData,
  onSubmit,
  onExistingImageDelete,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<PublicOfferWizardData & { showValidationErrors?: boolean }>({
    ...initialData,
    destination: initialData.destination || "",
    showValidationErrors: false,
  })

  const [dateError, setDateError] = useState<string | null>(null)
  const [validUntilError, setValidUntilError] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")
  const [timeErrors, setTimeErrors] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const validation = validateDateTimeConstraints(formData.startDate, formData.endDate)
      if (!validation.isValid) {
        setDateError(validation.errorMessage)
      } else {
        setDateError(null)
      }
    } else {
      setDateError(null)
    }

    if (formData.validUntil) {
      const now = new Date()
      now.setHours(0, 0, 0, 0) 

      if (formData.validUntil.toDate() < now) {
        setValidUntilError("Galiojimo data turi būti ateityje")
      } else if (formData.startDate && formData.validUntil.isAfter(formData.startDate)) {
        setValidUntilError("Galiojimo data negali būti vėlesnė nei kelionės pradžios data")
      } else {
        setValidUntilError(null)
      }
    } else {
      setValidUntilError(null)
    }
  }, [formData.startDate, formData.endDate, formData.validUntil])

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const handleDateChange = (field: "startDate" | "endDate" | "validUntil", newValue: any) => {
    handleInputChange(field, newValue)

    if (field === "startDate" && formData.endDate && newValue) {
      const validation = validateDateTimeConstraints(newValue, formData.endDate)
      if (!validation.isValid) {
        setSnackbarMessage(validation.errorMessage || "Pabaigos data negali būti ankstesnė už pradžios datą")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    if (field === "endDate" && formData.startDate && newValue) {
      const validation = validateDateTimeConstraints(formData.startDate, newValue)
      if (!validation.isValid) {
        setSnackbarMessage(validation.errorMessage || "Pabaigos data negali būti ankstesnė už pradžios datą")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    if (field === "validUntil" && newValue) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (newValue.toDate() < now) {
        setSnackbarMessage("Galiojimo data turi būti ateityje")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }
  }

  const validateTimeConstraint = (startTime: any, endTime: any, errorKey: string): boolean => {
    if (startTime && endTime && endTime.isBefore(startTime)) {
      const errorMessage = "Pabaigos laikas negali būti ankstesnis už pradžios laiką"
      setTimeErrors((prev) => {
        if (prev[errorKey] === errorMessage) {
          return prev
        }
        return {
          ...prev,
          [errorKey]: errorMessage,
        }
      })

      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)

      return false
    } else {
      setTimeErrors((prev) => {
        if (prev[errorKey] === null) {
          return prev
        }
        return {
          ...prev,
          [errorKey]: null,
        }
      })
      return true
    }
  }

  const handleAccommodationDateChange = (accIndex: number, field: "checkIn" | "checkOut", value: any) => {
    const acc = formData.accommodations[accIndex]
    const errorKey = `acc-${accIndex}`

    const startDate = field === "checkIn" ? value : acc.checkIn
    const endDate = field === "checkOut" ? value : acc.checkOut

    const updatedAccommodations = [...formData.accommodations]
    updatedAccommodations[accIndex] = {
      ...updatedAccommodations[accIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      accommodations: updatedAccommodations,
    }))

    if (startDate && endDate) {
      validateTimeConstraint(startDate, endDate, errorKey)
    }
  }

  const handleTransportTimeChange = (transIndex: number, field: "departureTime" | "arrivalTime", value: any) => {
    const trans = formData.transports[transIndex]
    const errorKey = `trans-${transIndex}`

    const startTime = field === "departureTime" ? value : trans.departureTime
    const endTime = field === "arrivalTime" ? value : trans.arrivalTime

    const updatedTransports = [...formData.transports]
    updatedTransports[transIndex] = {
      ...updatedTransports[transIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      transports: updatedTransports,
    }))

    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  const handleCruiseTimeChange = (cruiseIndex: number, field: "departureTime" | "arrivalTime", value: any) => {
    const cruise = formData.cruises[cruiseIndex]
    const errorKey = `cruise-${cruiseIndex}`

    const startTime = field === "departureTime" ? value : cruise.departureTime
    const endTime = field === "arrivalTime" ? value : cruise.arrivalTime

    const updatedCruises = [...formData.cruises]
    updatedCruises[cruiseIndex] = {
      ...updatedCruises[cruiseIndex],
      [field]: value,
    }
    setFormData((prev) => ({
      ...prev,
      cruises: updatedCruises,
    }))

    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  const handleAccommodationChange = (accIndex: number, field: keyof Accommodation, value: any) => {
    const updatedAccommodations = [...formData.accommodations]
    if (field === "price") {
      updatedAccommodations[accIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedAccommodations[accIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      accommodations: updatedAccommodations,
    }))
  }

  const handleTransportChange = (transIndex: number, field: keyof Transport, value: any) => {
    const updatedTransports = [...formData.transports]
    if (field === "price") {
      updatedTransports[transIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedTransports[transIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      transports: updatedTransports,
    }))
  }

  const handleCruiseChange = (cruiseIndex: number, field: keyof Cruise, value: any) => {
    const updatedCruises = [...formData.cruises]
    if (field === "price") {
      updatedCruises[cruiseIndex][field] = typeof value === "string" ? Number.parseFloat(value) || 0 : value
    } else {
      updatedCruises[cruiseIndex][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      cruises: updatedCruises,
    }))
  }

  const handleAddAccommodation = () => {
    setFormData((prev) => ({
      ...prev,
      accommodations: [
        ...prev.accommodations,
        {
          hotelName: "",
          checkIn: null,
          checkOut: null,
          hotelLink: "",
          description: "",
          boardBasis: "",
          roomType: "",
          price: 0,
          starRating: null,
        },
      ],
    }))
  }

  const handleRemoveAccommodation = (accIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      accommodations: prev.accommodations.filter((_, idx) => idx !== accIndex),
    }))
  }

  const handleAddTransport = () => {
    setFormData((prev) => ({
      ...prev,
      transports: [
        ...prev.transports,
        {
          transportType: "Flight",
          departureTime: null,
          arrivalTime: null,
          departurePlace: "",
          arrivalPlace: "",
          description: "",
          companyName: "",
          transportName: "",
          transportCode: "",
          cabinType: "",
          price: 0,
        },
      ],
    }))
  }

  const handleRemoveTransport = (transIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      transports: prev.transports.filter((_, idx) => idx !== transIndex),
    }))
  }

  const handleAddCruise = () => {
    setFormData((prev) => ({
      ...prev,
      cruises: [
        ...prev.cruises,
        {
          departureTime: null,
          arrivalTime: null,
          departurePlace: "",
          arrivalPlace: "",
          description: "",
          companyName: "",
          transportName: "",
          transportCode: "",
          cabinType: "",
          price: 0,
        },
      ],
    }))
  }

  const handleRemoveCruise = (cruiseIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      cruises: prev.cruises.filter((_, idx) => idx !== cruiseIndex),
    }))
  }

  const handleImageChange = (files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      images: files,
    }))
  }

  const handleExistingImageDelete = useCallback(
    (imageId: string) => {
      if (onExistingImageDelete) {
        onExistingImageDelete(imageId)
      }
    },
    [onExistingImageDelete],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (dateError || validUntilError) {
      setSnackbarMessage("Prašome ištaisyti klaidas prieš tęsiant.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const hasTimeErrors = Object.values(timeErrors).some((error) => error !== null)
    if (hasTimeErrors) {
      setSnackbarMessage("Prašome ištaisyti laiko klaidas prieš tęsiant.")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const validationErrors = validateEventRequiredFields()
    if (validationErrors.length > 0) {
      setFormData((prev) => ({ ...prev, showValidationErrors: true }))
      setSnackbarMessage(validationErrors[0])
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const dateRangeErrors = validateEventDateRanges()
    if (dateRangeErrors.length > 0) {
      setFormData((prev) => ({ ...prev, showValidationErrors: true }))
      setSnackbarMessage(dateRangeErrors[0])
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    onSubmit(formData)
  }

  const validateEventRequiredFields = (): string[] => {
    const errors: string[] = []

    formData.accommodations.forEach((acc, index) => {
      if (!acc.hotelName || acc.hotelName.trim() === "") {
        errors.push(`Apgyvendinimas #${index + 1}: Viešbučio pavadinimas yra privalomas`)
      }
      if (!acc.checkIn) {
        errors.push(`Apgyvendinimas #${index + 1}: Atvykimo data yra privaloma`)
      }
      if (!acc.checkOut) {
        errors.push(`Apgyvendinimas #${index + 1}: Išvykimo data yra privaloma`)
      }
    })

    formData.transports.forEach((trans, index) => {
      if (!trans.departurePlace || trans.departurePlace.trim() === "") {
        errors.push(`Transportas #${index + 1}: Išvykimo vieta yra privaloma`)
      }
      if (!trans.arrivalPlace || trans.arrivalPlace.trim() === "") {
        errors.push(`Transportas #${index + 1}: Atvykimo vieta yra privaloma`)
      }
      if (!trans.departureTime) {
        errors.push(`Transportas #${index + 1}: Išvykimo laikas yra privalomas`)
      }
      if (!trans.arrivalTime) {
        errors.push(`Transportas #${index + 1}: Atvykimo laikas yra privalomas`)
      }
    })

    formData.cruises.forEach((cruise, index) => {
      if (!cruise.departurePlace || cruise.departurePlace.trim() === "") {
        errors.push(`Kruizas #${index + 1}: Išvykimo uostas yra privalomas`)
      }
      if (!cruise.arrivalPlace || cruise.arrivalPlace.trim() === "") {
        errors.push(`Kruizas #${index + 1}: Atvykimo uostas yra privalomas`)
      }
      if (!cruise.departureTime) {
        errors.push(`Kruizas #${index + 1}: Išvykimo laikas yra privalomas`)
      }
      if (!cruise.arrivalTime) {
        errors.push(`Kruizas #${index + 1}: Atvykimo laikas yra privalomas`)
      }
    })

    return errors
  }

  const validateEventDateRanges = (): string[] => {
    const errors: string[] = []

    if (!formData.startDate || !formData.endDate) {
      return errors
    }

    const offerStartDate = formData.startDate.startOf("day")
    const offerEndDate = formData.endDate.endOf("day")

    formData.accommodations.forEach((acc, index) => {
      if (acc.checkIn && acc.checkIn.isBefore(offerStartDate)) {
        errors.push(`Apgyvendinimas #${index + 1}: Atvykimo data negali būti ankstesnė nei kelionės pradžios data`)
      }
      if (acc.checkOut && acc.checkOut.isAfter(offerEndDate)) {
        errors.push(`Apgyvendinimas #${index + 1}: Išvykimo data negali būti vėlesnė nei kelionės pabaigos data`)
      }
    })

    formData.transports.forEach((trans, index) => {
      if (trans.departureTime && trans.departureTime.isBefore(offerStartDate)) {
        errors.push(`Transportas #${index + 1}: Išvykimo laikas negali būti ankstesnis nei kelionės pradžios data`)
      }
      if (trans.arrivalTime && trans.arrivalTime.isAfter(offerEndDate)) {
        errors.push(`Transportas #${index + 1}: Atvykimo laikas negali būti vėlesnis nei kelionės pabaigos data`)
      }
    })

    formData.cruises.forEach((cruise, index) => {
      if (cruise.departureTime && cruise.departureTime.isBefore(offerStartDate)) {
        errors.push(`Kruizas #${index + 1}: Išvykimo laikas negali būti ankstesnis nei kelionės pradžios data`)
      }
      if (cruise.arrivalTime && cruise.arrivalTime.isAfter(offerEndDate)) {
        errors.push(`Kruizas #${index + 1}: Atvykimo laikas negali būti vėlesnis nei kelionės pabaigos data`)
      }
    })

    return errors
  }

  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TripBasicInfoForm
        formData={formData}
        handleInputChange={handleInputChange}
        handleDateChange={handleDateChange}
        handleImageChange={handleImageChange}
        handleExistingImageDelete={handleExistingImageDelete}
        dateError={dateError}
        validUntilError={validUntilError}
        isEditing={isEditing}
      />

      <Divider sx={{ my: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Pasiūlymo elementai
        </Typography>
      </Divider>

      <TripElementsSection
        formData={formData}
        handleAddAccommodation={handleAddAccommodation}
        handleAddTransport={handleAddTransport}
        handleAddCruise={handleAddCruise}
        handleAccommodationChange={handleAccommodationChange}
        handleAccommodationDateChange={handleAccommodationDateChange}
        handleRemoveAccommodation={handleRemoveAccommodation}
        handleTransportChange={handleTransportChange}
        handleTransportTimeChange={handleTransportTimeChange}
        handleRemoveTransport={handleRemoveTransport}
        handleCruiseChange={handleCruiseChange}
        handleCruiseTimeChange={handleCruiseTimeChange}
        handleRemoveCruise={handleRemoveCruise}
        timeErrors={timeErrors}
        validateEventRequiredFields={validateEventRequiredFields}
        validateEventDateRanges={validateEventDateRanges}
        setSnackbarMessage={setSnackbarMessage}
        setSnackbarSeverity={setSnackbarSeverity}
        setSnackbarOpen={setSnackbarOpen}
        isEditing={isEditing}
      />

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!!dateError || !!validUntilError}
          endIcon={<ArrowForward />}
          sx={{ minWidth: 120 }}
        >
          Toliau
        </Button>
      </Box>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  )
}

export default Step1OfferDetails
