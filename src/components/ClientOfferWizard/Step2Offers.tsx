"use client"

import type React from "react"
import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { Box, Button, useMediaQuery, useTheme } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import type { OfferWizardData, OfferStep } from "./CreateClientOfferWizardForm"
import { OfferOption } from "./offers/OfferOption"
import OfferSidebar from "./sideBar/OfferSidebar"
import MobileOfferDrawer from "./sideBar/MobileOfferDrawer"
import MobileOfferSelector from "./sideBar/MobileOfferSelector"
import type { Dayjs } from "dayjs"
import { Flight, Train, DirectionsBus, DirectionsCar, Sailing } from "@mui/icons-material"
import CustomSnackbar from "../CustomSnackBar"
import type { Country } from "../DestinationAutocomplete"

interface Accommodation {
  hotelName: string
  checkIn: Dayjs | null
  checkOut: Dayjs | null
  hotelLink: string
  description: string
  boardBasis: string
  roomType: string
  price: number
}

interface Transport {
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

interface Cruise {
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

interface Step2Props {
  tripData: OfferWizardData
  steps: OfferStep[]
  onSubmit: (steps: OfferStep[], saveChanges: boolean) => void
  onBack: () => void
  formatDate: (date: Dayjs | null) => string
  onStepImagesChange?: (stepIndex: number, files: File[]) => void
  onStepImageDelete?: (stepIndex: number, imageId: string) => void
  onDataChange?: (hasData: boolean) => void
}

declare global {
  interface Window {
    __currentStepData?: OfferStep[]
  }
}

export function getCurrentStepData() {
  return window.__currentStepData || null
}

const SIDEBAR_WIDTH = 240

const Step2Offers = forwardRef<any, Step2Props>(
  ({ tripData, steps, onSubmit, onBack, formatDate, onStepImagesChange, onStepImageDelete, onDataChange }, ref) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"))
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"))
    const [localSteps, setLocalSteps] = useState<OfferStep[]>([])
    const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({})
    const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
    const [selectedOfferIndex, setSelectedOfferIndex] = useState<number>(0)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

    const [offerErrors, setOfferErrors] = useState<Record<number, boolean>>({})

    const [stepsImagesToDelete, setStepsImagesToDelete] = useState<Record<number, string[]>>({})

    const [stepNewImages, setStepNewImages] = useState<Record<number, File[]>>({})

    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

    const [dateValidationErrors, setDateValidationErrors] = useState<Record<number, string[]>>({})

    useImperativeHandle(ref, () => ({
      collectFormData: async () => {
        return localSteps
      },
      collectCurrentFormData: async () => {
        window.__currentStepData = localSteps
        return localSteps
      },
      getDeletedImages: () => {
        return stepsImagesToDelete
      },
      getNewImages: () => {
        return stepNewImages
      },
    }))

    useEffect(() => {
      window.__currentStepData = localSteps

      return () => {
        window.__currentStepData = null
      }
    }, [localSteps])

    useEffect(() => {
      if (onDataChange) {
        const hasData = localSteps.some(
          (step) =>
            step.accommodations.length > 0 ||
            step.transports.length > 0 ||
            (step.cruises && step.cruises.length > 0) ||
            (step.stepImages && step.stepImages.length > 0),
        )

        onDataChange(hasData)
      }
    }, [localSteps, onDataChange])

    useEffect(() => {
      if (steps.length > 0) {
        const updatedSteps = steps.map((step) => {
          return { ...step }
        })
        setLocalSteps(updatedSteps)
      } else {
        setLocalSteps([
          {
            name: "Pasiūlymas 1",
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true,
            destination: null,
          },
        ])
      }
    }, [steps])

    useEffect(() => {
      if (localSteps.length > 0 && selectedOfferIndex >= localSteps.length) {
        setSelectedOfferIndex(0)
      }
    }, [localSteps, selectedOfferIndex])

    const boardBasisOptions = [
      { value: "BedAndBreakfast", label: "Nakvynė su pusryčiais" },
      { value: "HalfBoard", label: "Pusryčiai ir vakarienė" },
      { value: "FullBoard", label: "Pusryčiai, pietūs ir vakarienė" },
      { value: "AllInclusive", label: "Viskas įskaičiuota" },
      { value: "UltraAllInclusive", label: "Ultra viskas įskaičiuota" },
    ]

    const transportTypeOptions = [
      { value: "Flight", label: "Skrydis", icon: <Flight fontSize="small" /> },
      { value: "Train", label: "Traukinys", icon: <Train fontSize="small" /> },
      { value: "Bus", label: "Autobusas", icon: <DirectionsBus fontSize="small" /> },
      { value: "Car", label: "Automobilis", icon: <DirectionsCar fontSize="small" /> },
      { value: "Ferry", label: "Keltas", icon: <Sailing fontSize="small" /> },
    ]

    const reorderTrackingHandler = (draggedIndex: number, targetIndex: number) => {
      setStepNewImages((prev) => prev)
    }

    const toggleDropdown = (stepIndex: number) => {
      setOpenDropdowns((prev) => ({
        ...prev,
        [stepIndex]: !prev[stepIndex],
      }))
    }

    const toggleExpand = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].isExpanded = !updatedSteps[stepIndex].isExpanded
        return updatedSteps
      })
    }

    const handleAddStep = () => {
      setLocalSteps((prev) => {
        const newSteps = [
          ...prev,
          {
            name: `Pasiūlymas ${prev.length + 1}`, 
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true, 
            destination: null,
          },
        ]
        setSelectedOfferIndex(newSteps.length - 1)
        return newSteps
      })
    }

    const handleRemoveStep = (stepIndex: number) => {
      setLocalSteps((prev) => {
        const newSteps = prev.filter((_: OfferStep, idx: number) => idx !== stepIndex)

        if (selectedOfferIndex >= newSteps.length) {
          setSelectedOfferIndex(Math.max(0, newSteps.length - 1))
        } else if (stepIndex === selectedOfferIndex && newSteps.length > 0) {
          setSelectedOfferIndex(Math.min(selectedOfferIndex, newSteps.length - 1))
        }

        setOfferErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[stepIndex]

          const shiftedErrors: Record<number, boolean> = {}
          Object.entries(newErrors).forEach(([idx, hasError]) => {
            const index = Number.parseInt(idx, 10)
            if (index > stepIndex) {
              shiftedErrors[index - 1] = hasError
            } else {
              shiftedErrors[index] = hasError
            }
          })

          return shiftedErrors
        })

        setStepsImagesToDelete((prev) => {
          const newImagesToDelete = { ...prev }
          delete newImagesToDelete[stepIndex]

          const shiftedImagesToDelete: Record<number, string[]> = {}
          Object.entries(newImagesToDelete).forEach(([idx, imageIds]) => {
            const index = Number.parseInt(idx, 10)
            if (index > stepIndex) {
              shiftedImagesToDelete[index - 1] = imageIds
            } else {
              shiftedImagesToDelete[index] = imageIds
            }
          })

          return shiftedImagesToDelete
        })

        setStepNewImages((prev) => {
          const newStepImages = { ...prev }
          delete newStepImages[stepIndex]

          const shiftedStepImages: Record<number, File[]> = {}
          Object.entries(newStepImages).forEach(([idx, files]) => {
            const index = Number.parseInt(idx, 10)
            if (index > stepIndex) {
              shiftedStepImages[index - 1] = files
            } else {
              shiftedStepImages[index] = files
            }
          })

          return shiftedStepImages
        })

        return newSteps
      })
    }

    const handleStepNameChange = (stepIndex: number, name: string) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].name = name
        return updatedSteps
      })
    }

    const handleStepDestinationChange = (stepIndex: number, destination: Country | null) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].destination = destination
        return updatedSteps
      })
    }

    const handleAddAccommodation = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].accommodations.push({
          hotelName: "",
          checkIn: null,
          checkOut: null,
          hotelLink: "",
          description: "",
          boardBasis: "",
          roomType: "",
          price: 0, 
        })
        return updatedSteps
      })
    }

    const handleRemoveAccommodation = (stepIndex: number, accIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].accommodations = updatedSteps[stepIndex].accommodations.filter(
          (_: Accommodation, idx: number) => idx !== accIndex,
        )
        return updatedSteps
      })
    }

    const handleAccommodationChange = (
      stepIndex: number,
      accIndex: number,
      field: keyof Accommodation,
      value: string | number | Dayjs | null,
    ) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (field === "price") {
          updatedSteps[stepIndex].accommodations[accIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].accommodations[accIndex][field as keyof Accommodation] = value as never
        }
        return updatedSteps
      })
    }

    const handleAddTransport = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].transports.push({
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
        })
        return updatedSteps
      })
    }

    const handleRemoveTransport = (stepIndex: number, transIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].transports = updatedSteps[stepIndex].transports.filter(
          (_: Transport, idx: number) => idx !== transIndex,
        )
        return updatedSteps
      })
    }

    const handleTransportChange = (
      stepIndex: number,
      transIndex: number,
      field: keyof Transport,
      value: string | number | Dayjs | null,
    ) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (field === "price") {
          updatedSteps[stepIndex].transports[transIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].transports[transIndex][field as keyof Transport] = value as never
        }
        return updatedSteps
      })
    }

    const handleAddCruise = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (!updatedSteps[stepIndex].cruises) {
          updatedSteps[stepIndex].cruises = []
        }
        updatedSteps[stepIndex].cruises.push({
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
        })
        return updatedSteps
      })
    }

    const handleRemoveCruise = (stepIndex: number, cruiseIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (updatedSteps[stepIndex].cruises) {
          updatedSteps[stepIndex].cruises = updatedSteps[stepIndex].cruises.filter(
            (_: Cruise, idx: number) => idx !== cruiseIndex,
          )
        }
        return updatedSteps
      })
    }

    const handleCruiseChange = (
      stepIndex: number,
      cruiseIndex: number,
      field: keyof Cruise,
      value: string | number | Dayjs | null,
    ) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (!updatedSteps[stepIndex].cruises) {
          updatedSteps[stepIndex].cruises = []
        }
        if (field === "price") {
          updatedSteps[stepIndex].cruises[cruiseIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].cruises[cruiseIndex][field as keyof Cruise] = value as never
        }
        return updatedSteps
      })
    }

    const handleAddImages = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].stepImages = []
        return updatedSteps
      })
    }

    const handleImageChange = (stepIndex: number, files: File[]) => {

      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].stepImages = files
        return updatedSteps
      })

      setStepNewImages((prev) => ({
        ...prev,
        [stepIndex]: files,
      }))
    }

    const handleRemoveImageSection = (stepIndex: number) => {
      const step = localSteps[stepIndex]
      if (step && step.existingStepImages && step.existingStepImages.length > 0) {

        setStepsImagesToDelete((prev) => {
          const newState = { ...prev }
          if (!newState[stepIndex]) {
            newState[stepIndex] = []
          }

          step.existingStepImages.forEach((img) => {
            if (!newState[stepIndex].includes(img.id)) {
              newState[stepIndex].push(img.id)
            }
          })

          return newState
        })

        if (onStepImageDelete) {
          step.existingStepImages.forEach((img) => {
            onStepImageDelete(stepIndex, img.id)
          })
        }
      }

      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].stepImages = null
        updatedSteps[stepIndex].existingStepImages = []
        return updatedSteps
      })

      setStepNewImages((prev) => {
        const newState = { ...prev }
        delete newState[stepIndex]
        return newState
      })
    }

    const handleExistingImageDelete = useCallback(
      (stepIndex: number, imageId: string) => {

        setStepsImagesToDelete((prev) => {
          const newState = { ...prev }
          if (!newState[stepIndex]) {
            newState[stepIndex] = []
          }
          newState[stepIndex] = [...newState[stepIndex], imageId]
          return newState
        })

        setLocalSteps((prevSteps) => {
          const updatedSteps = [...prevSteps]
          const step = updatedSteps[stepIndex]

          if (step && step.existingStepImages) {
            step.existingStepImages = step.existingStepImages.filter((img) => img.id !== imageId)
          }

          return updatedSteps
        })

        if (onStepImageDelete) {
          onStepImageDelete(stepIndex, imageId)
        }
      },
      [onStepImageDelete],
    )

    const handleDragStart = (e: React.DragEvent, stepIndex: number) => {
      setDraggedStepIndex(stepIndex)
      e.dataTransfer.effectAllowed = "move"

      e.dataTransfer.setData("text/plain", stepIndex.toString())

      if (e.target instanceof HTMLElement) {
        const ghostElement = e.target.cloneNode(true) as HTMLElement
        ghostElement.style.opacity = "0.7"
        document.body.appendChild(ghostElement)
        e.dataTransfer.setDragImage(ghostElement, 20, 20)

        setTimeout(() => {
          document.body.removeChild(ghostElement)
        }, 0)
      }
    }

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggedStepIndex === null || draggedStepIndex === targetIndex) return

      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = draggedStepIndex > targetIndex ? "2px solid #4caf50" : "none"
      targetElement.style.borderBottom = draggedStepIndex < targetIndex ? "2px solid #4caf50" : "none"
    }

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }

    const handleDragLeave = (e: React.DragEvent) => {
      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = "none"
      targetElement.style.borderBottom = "none"
    }

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = "none"
      targetElement.style.borderBottom = "none"

      if (draggedStepIndex === null || draggedStepIndex === targetIndex) return

      setLocalSteps((prevSteps) => {
        const newSteps = [...prevSteps]
        const [draggedStep] = newSteps.splice(draggedStepIndex, 1)
        newSteps.splice(targetIndex, 0, draggedStep)
        return newSteps
      })

      const updateTracking = (
        prevState: Record<number, any>,
        draggedIdx: number,
        targetIdx: number,
      ): Record<number, any> => {
        const newState = { ...prevState }

        if (newState[draggedIdx] !== undefined) {
          const draggedData = newState[draggedIdx]

          if (draggedIdx < targetIdx) {
            for (let i = draggedIdx; i < targetIdx; i++) {
              newState[i] = newState[i + 1]
            }
          } else {
            for (let i = draggedIdx; i > targetIdx; i--) {
              newState[i] = newState[i - 1]
            }
          }

          newState[targetIdx] = draggedData
        }

        return newState
      }

      setStepNewImages((prev) => updateTracking(prev, draggedStepIndex, targetIndex))
      setStepsImagesToDelete((prev) => updateTracking(prev, draggedStepIndex, targetIndex))

      if (selectedOfferIndex === draggedStepIndex) {
        setSelectedOfferIndex(targetIndex)
      } else if (
        (draggedStepIndex < targetIndex &&
          selectedOfferIndex > draggedStepIndex &&
          selectedOfferIndex <= targetIndex) ||
        (draggedStepIndex > targetIndex && selectedOfferIndex >= targetIndex && selectedOfferIndex < draggedStepIndex)
      ) {
        if (draggedStepIndex < targetIndex) {
          setSelectedOfferIndex(selectedOfferIndex - 1)
        } else {
          setSelectedOfferIndex(selectedOfferIndex + 1)
        }
      }
    }

    const handleDragEnd = (e: React.DragEvent) => {
      e.preventDefault()

      document.querySelectorAll('[data-tab-button="true"]').forEach((element) => {
        ;(element as HTMLElement).style.borderTop = "none"(element as HTMLElement).style.borderBottom = "none"
      })

      setDraggedStepIndex(null)
    }

    const reorderTracking = (draggedIndex: number, targetIndex: number) => {
      setStepNewImages((prev) => {
        const newState = { ...prev }

        if (newState[draggedIndex]) {
          const draggedImages = newState[draggedIndex]

          delete newState[draggedIndex]

          if (draggedIndex < targetIndex) {
            for (let i = draggedIndex + 1; i <= targetIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i - 1] = newState[i]
                delete newState[i]
              }
            }
          } else {
            for (let i = targetIndex; i < draggedIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i + 1] = newState[i]
                delete newState[i]
              }
            }
          }

          newState[targetIndex] = draggedImages
        }

        return newState
      })

      setStepsImagesToDelete((prev) => {
        const newState = { ...prev }

        if (newState[draggedIndex]) {
          const draggedImagesToDelete = newState[draggedIndex]

          delete newState[draggedIndex]

          if (draggedIndex < targetIndex) {
            for (let i = draggedIndex + 1; i <= targetIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i - 1] = newState[i]
                delete newState[i]
              }
            }
          } else {
            for (let i = targetIndex; i < draggedIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i + 1] = newState[i]
                delete newState[i]
              }
            }
          }

          newState[targetIndex] = draggedImagesToDelete
        }

        return newState
      })
    }

    const handleValidationError = (stepIndex: number, hasError: boolean, errorMessage?: string) => {
      setOfferErrors((prev) => {
        if (prev[stepIndex] === hasError) {
          return prev
        }
        return {
          ...prev,
          [stepIndex]: hasError,
        }
      })

      if (hasError && errorMessage) {
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    const validateStepDates = (step: OfferStep, stepIndex: number): string[] => {
      const errors: string[] = []

      if (!tripData.startDate && !tripData.endDate) {
        return errors
      }

      const tripStart = tripData.startDate ? tripData.startDate.startOf("day") : null
      const tripEnd = tripData.endDate ? tripData.endDate.endOf("day") : null

      step.accommodations.forEach((acc, accIndex) => {
        if (acc.checkIn && tripStart && acc.checkIn.isBefore(tripStart)) {
          errors.push(`Apgyvendinimas #${accIndex + 1}: Įsiregistravimo data yra prieš kelionės pradžią`)
        }
        if (acc.checkOut && tripEnd && acc.checkOut.isAfter(tripEnd)) {
          errors.push(`Apgyvendinimas #${accIndex + 1}: Išsiregistravimo data yra po kelionės pabaigos`)
        }
      })

      step.transports.forEach((trans, transIndex) => {
        if (trans.departureTime && tripStart && trans.departureTime.isBefore(tripStart)) {
          errors.push(`Transportas #${transIndex + 1}: Išvykimo laikas yra prieš kelionės pradžią`)
        }
        if (trans.arrivalTime && tripEnd && trans.arrivalTime.isAfter(tripEnd)) {
          errors.push(`Transportas #${transIndex + 1}: Atvykimo laikas yra po kelionės pabaigos`)
        }
      })

      if (step.cruises) {
        step.cruises.forEach((cruise, cruiseIndex) => {
          if (cruise.departureTime && tripStart && cruise.departureTime.isBefore(tripStart)) {
            errors.push(`Kruizas #${cruiseIndex + 1}: Išvykimo laikas yra prieš kelionės pradžią`)
          }
          if (cruise.arrivalTime && tripEnd && cruise.arrivalTime.isAfter(tripEnd)) {
            errors.push(`Kruizas #${cruiseIndex + 1}: Atvykimo laikas yra po kelionės pabaigos`)
          }
        })
      }

      return errors
    }

    useEffect(() => {
      const newErrors: Record<number, string[]> = {}
      let hasErrors = false

      localSteps.forEach((step, index) => {
        const stepErrors = validateStepDates(step, index)
        if (stepErrors.length > 0) {
          newErrors[index] = stepErrors
          hasErrors = true
        }
      })

      setDateValidationErrors(newErrors)

      if (hasErrors && (tripData.startDate || tripData.endDate)) {
        setSnackbarMessage("Kai kurie įvykiai yra už kelionės datų ribų. Prašome pataisyti prieš tęsiant.")
        setSnackbarSeverity("warning")
        setSnackbarOpen(true)
      }
    }, [tripData.startDate, tripData.endDate, localSteps])

    const hasValidationErrors = () => {
      return Object.values(offerErrors).some((hasError) => hasError)
    }

    const validateAllSteps = (): { valid: boolean; message?: string } => {
      if (hasValidationErrors()) {
        return {
          valid: false,
          message: "Prašome ištaisyti klaidas prieš tęsiant.",
        }
      }

      const hasDateErrors = Object.values(dateValidationErrors).some((errors) => errors.length > 0)
      if (hasDateErrors) {
        return {
          valid: false,
          message:
            "Kai kurie įvykiai yra už kelionės datų ribų. Prašome patikrinti, ar visi įvykiai yra kelionės datų ribose.",
        }
      }

      for (let i = 0; i < localSteps.length; i++) {
        const step = localSteps[i]
        const isEmpty =
          step.accommodations.length === 0 &&
          step.transports.length === 0 &&
          (!step.cruises || step.cruises.length === 0)

        if (isEmpty) {
          setSelectedOfferIndex(i)
          return {
            valid: false,
            message: `Pasiūlymas "${step.name}" yra tuščias. Pridėkite bent vieną elementą arba pašalinkite pasiūlymą.`,
          }
        }
      }

      return { valid: true }
    }

    const handleSubmit = () => {
      const validation = validateAllSteps()
      if (!validation.valid) {
        setSnackbarMessage(validation.message || "Prašome ištaisyti klaidas prieš tęsiant.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return
      }

      synchronizeStepImages()

      onSubmit(localSteps, true)
    }

    const synchronizeStepImages = () => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]

        Object.entries(stepNewImages).forEach(([indexStr, files]) => {
          const index = Number.parseInt(indexStr, 10)
          if (index >= 0 && index < updatedSteps.length) {
            updatedSteps[index].stepImages = files
          }
        })

        return updatedSteps
      })
    }

    const handleBack = () => {
      const validation = validateAllSteps()
      if (!validation.valid) {
        setSnackbarMessage(validation.message || "Prašome ištaisyti klaidas prieš grįžimą.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return
      }

      synchronizeStepImages()

      onSubmit(localSteps, false)
      onBack()
    }

    const handlePreviousOffer = () => {
      if (selectedOfferIndex > 0) {
        setSelectedOfferIndex(selectedOfferIndex - 1)
      }
    }

    const handleNextOffer = () => {
      if (selectedOfferIndex < localSteps.length - 1) {
        setSelectedOfferIndex(selectedOfferIndex + 1)
      }
    }

    const handleCloseSnackbar = () => {
      setSnackbarOpen(false)
    }

    useEffect(() => {
      if (!isMobile) {
        setDrawerOpen(false)
      }
    }, [isMobile])

    return (
      <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
        {!isMobile && (
          <OfferSidebar
            offers={localSteps}
            selectedOfferIndex={selectedOfferIndex}
            onSelectOffer={setSelectedOfferIndex}
            sidebarWidth={SIDEBAR_WIDTH}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            draggedStepIndex={draggedStepIndex}
            onAddOffer={handleAddStep}
          />
        )}

        <MobileOfferDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          offers={localSteps}
          selectedOfferIndex={selectedOfferIndex}
          onSelectOffer={(index) => {
            setSelectedOfferIndex(index)
            setDrawerOpen(false)
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          draggedStepIndex={draggedStepIndex}
          onAddOffer={handleAddStep}
        />

        <Box sx={{ flexGrow: 1, width: "100%" }}>
          {isMobile && localSteps.length > 0 && (
            <MobileOfferSelector
              selectedOfferIndex={selectedOfferIndex}
              totalOffers={localSteps.length}
              currentOffer={localSteps[selectedOfferIndex]}
              onOpenDrawer={() => setDrawerOpen(true)}
              onPreviousOffer={handlePreviousOffer}
              onNextOffer={handleNextOffer}
            />
          )}

          {localSteps.length > 0 && (
            <OfferOption
              key={selectedOfferIndex}
              step={localSteps[selectedOfferIndex]}
              stepIndex={selectedOfferIndex}
              boardBasisOptions={boardBasisOptions}
              transportTypeOptions={transportTypeOptions}
              openDropdowns={openDropdowns}
              draggedStepIndex={draggedStepIndex}
              onToggleExpand={toggleExpand}
              onStepNameChange={handleStepNameChange}
              onRemoveStep={handleRemoveStep}
              onAddAccommodation={handleAddAccommodation}
              onRemoveAccommodation={handleRemoveAccommodation}
              onAccommodationChange={handleAccommodationChange}
              onAddTransport={handleAddTransport}
              onRemoveTransport={handleRemoveTransport}
              onTransportChange={handleTransportChange}
              onAddCruise={handleAddCruise}
              onRemoveCruise={handleRemoveCruise}
              onCruiseChange={handleCruiseChange}
              onToggleDropdown={toggleDropdown}
              formatDate={formatDate}
              onValidationError={handleValidationError}
              onAddImages={handleAddImages}
              onImageChange={(stepIndex, files) => {
                handleImageChange(stepIndex, files)
                if (onStepImagesChange) {
                  onStepImagesChange(stepIndex, files)
                }
              }}
              onRemoveImageSection={handleRemoveImageSection}
              onExistingImageDelete={handleExistingImageDelete}
              onDestinationChange={handleStepDestinationChange}
              tripDestination={tripData.destination}
              dateValidationErrors={dateValidationErrors[selectedOfferIndex] || []}
              tripStartDate={tripData.startDate}
              tripEndDate={tripData.endDate}
            />
          )}

          <Box
            sx={{
              position: "relative",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mt: 4,
              gap: 2,
              left: isMobile ? 0 : `-${SIDEBAR_WIDTH / 2}px`,
              pl: isMobile ? 0 : `${SIDEBAR_WIDTH / 2}px`,
              pr: isMobile ? 0 : `${SIDEBAR_WIDTH / 2}px`,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              type="button"
              disabled={localSteps.length === 0 || hasValidationErrors()}
              sx={{ minWidth: 120 }}
            >
              Atgal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              endIcon={<ArrowForward />}
              disabled={localSteps.length === 0 || hasValidationErrors()}
              type="button"
              sx={{ minWidth: 120 }}
            >
              Toliau
            </Button>
          </Box>
        </Box>

        <CustomSnackbar
          open={snackbarOpen}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onClose={handleCloseSnackbar}
        />
      </Box>
    )
  },
)

Step2Offers.displayName = "Step2Offers"

export default Step2Offers
