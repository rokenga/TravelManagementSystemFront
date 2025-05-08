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

// Add this to store the current step data globally
declare global {
  interface Window {
    __currentStepData?: OfferStep[]
  }
}

// Export a function to get the current step data
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

    // Track validation errors for each offer
    const [offerErrors, setOfferErrors] = useState<Record<number, boolean>>({})

    // Track images to delete for each step
    const [stepsImagesToDelete, setStepsImagesToDelete] = useState<Record<number, string[]>>({})

    // Track new images for each step
    const [stepNewImages, setStepNewImages] = useState<Record<number, File[]>>({})

    // Snackbar state for validation errors
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

    // Track date validation errors for each offer
    const [dateValidationErrors, setDateValidationErrors] = useState<Record<number, string[]>>({})

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      collectFormData: async () => {
        // Return the current steps data
        return localSteps
      },
      collectCurrentFormData: async () => {
        // This method is called when the user tries to leave the form
        // It should update the global state with the current step data
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

    // Store the current step data in a global variable for access from outside
    useEffect(() => {
      window.__currentStepData = localSteps

      // Clean up when component unmounts
      return () => {
        window.__currentStepData = null
      }
    }, [localSteps])

    // Notify parent of data changes
    useEffect(() => {
      if (onDataChange) {
        // Check if there's any meaningful data in the steps
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

    // Initialize with at least one step if none provided
    useEffect(() => {
      if (steps.length > 0) {
        // Make a deep copy of the steps to avoid modifying the original
        const updatedSteps = steps.map((step) => {
          // Only preserve existing image sections, don't create new ones
          return { ...step }
        })
        setLocalSteps(updatedSteps)
      } else {
        // Create a default step if none exists
        setLocalSteps([
          {
            name: "Pasiūlymas 1",
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true,
            destination: null,
            // Don't initialize stepImages at all
          },
        ])
      }
    }, [steps])

    // Set the first offer as selected when steps change
    useEffect(() => {
      if (localSteps.length > 0 && selectedOfferIndex >= localSteps.length) {
        setSelectedOfferIndex(0)
      }
    }, [localSteps, selectedOfferIndex])

    // Helper arrays for dropdowns
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

    // Helper function to remap indices when steps are reordered
    const reorderTrackingHandler = (draggedIndex: number, targetIndex: number) => {
      setStepNewImages((prev) => prev)
    }

    // Toggle dropdown menu
    const toggleDropdown = (stepIndex: number) => {
      setOpenDropdowns((prev) => ({
        ...prev,
        [stepIndex]: !prev[stepIndex],
      }))
    }

    // Toggle expand/collapse for an offer
    const toggleExpand = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].isExpanded = !updatedSteps[stepIndex].isExpanded
        return updatedSteps
      })
    }

    // Add a new step (offer option)
    const handleAddStep = () => {
      setLocalSteps((prev) => {
        const newSteps = [
          ...prev,
          {
            name: `Pasiūlymas ${prev.length + 1}`, // Default name
            accommodations: [],
            transports: [],
            cruises: [],
            isExpanded: true, // New steps are expanded by default
            destination: null,
            // Don't initialize stepImages
          },
        ]
        // Select the newly added offer
        setSelectedOfferIndex(newSteps.length - 1)
        return newSteps
      })
    }

    // Remove an entire step
    const handleRemoveStep = (stepIndex: number) => {
      setLocalSteps((prev) => {
        const newSteps = prev.filter((_: OfferStep, idx: number) => idx !== stepIndex)

        // Adjust selected index if needed
        if (selectedOfferIndex >= newSteps.length) {
          setSelectedOfferIndex(Math.max(0, newSteps.length - 1))
        } else if (stepIndex === selectedOfferIndex && newSteps.length > 0) {
          // Keep the same index if possible
          setSelectedOfferIndex(Math.min(selectedOfferIndex, newSteps.length - 1))
        }

        // Remove errors for this step
        setOfferErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[stepIndex]

          // Shift indices for steps after the removed one
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

        // Remove images to delete for this step
        setStepsImagesToDelete((prev) => {
          const newImagesToDelete = { ...prev }
          delete newImagesToDelete[stepIndex]

          // Shift indices for steps after the removed one
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

        // Remove new images for this step
        setStepNewImages((prev) => {
          const newStepImages = { ...prev }
          delete newStepImages[stepIndex]

          // Shift indices for steps after the removed one
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

    // Update step name
    const handleStepNameChange = (stepIndex: number, name: string) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].name = name
        return updatedSteps
      })
    }

    // Update step destination
    const handleStepDestinationChange = (stepIndex: number, destination: Country | null) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].destination = destination
        return updatedSteps
      })
    }

    // Add an accommodation to a step
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
          price: 0, // Default price
        })
        return updatedSteps
      })
    }

    // Remove an accommodation from a step
    const handleRemoveAccommodation = (stepIndex: number, accIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].accommodations = updatedSteps[stepIndex].accommodations.filter(
          (_: Accommodation, idx: number) => idx !== accIndex,
        )
        return updatedSteps
      })
    }

    // Update an accommodation field
    const handleAccommodationChange = (
      stepIndex: number,
      accIndex: number,
      field: keyof Accommodation,
      value: string | number | Dayjs | null,
    ) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (field === "price") {
          // Ensure price is stored as a number
          updatedSteps[stepIndex].accommodations[accIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].accommodations[accIndex][field as keyof Accommodation] = value as never
        }
        return updatedSteps
      })
    }

    // Add a transport to a step
    const handleAddTransport = (stepIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].transports.push({
          transportType: "Flight", // Set Flight as default
          departureTime: null,
          arrivalTime: null,
          departurePlace: "",
          arrivalPlace: "",
          description: "",
          companyName: "",
          transportName: "",
          transportCode: "",
          cabinType: "",
          price: 0, // Default price
        })
        return updatedSteps
      })
    }

    // Remove a transport from a step
    const handleRemoveTransport = (stepIndex: number, transIndex: number) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].transports = updatedSteps[stepIndex].transports.filter(
          (_: Transport, idx: number) => idx !== transIndex,
        )
        return updatedSteps
      })
    }

    // Update a transport field
    const handleTransportChange = (
      stepIndex: number,
      transIndex: number,
      field: keyof Transport,
      value: string | number | Dayjs | null,
    ) => {
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        if (field === "price") {
          // Ensure price is stored as a number
          updatedSteps[stepIndex].transports[transIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].transports[transIndex][field as keyof Transport] = value as never
        }
        return updatedSteps
      })
    }

    // Add a cruise to a step
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
          price: 0, // Default price
        })
        return updatedSteps
      })
    }

    // Remove a cruise from a step
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

    // Update a cruise field
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
          // Ensure price is stored as a number
          updatedSteps[stepIndex].cruises[cruiseIndex][field] =
            typeof value === "string" ? Number.parseFloat(value) || 0 : (value as number)
        } else {
          updatedSteps[stepIndex].cruises[cruiseIndex][field as keyof Cruise] = value as never
        }
        return updatedSteps
      })
    }

    // Handle image upload
    const handleAddImages = (stepIndex: number) => {
      // This function will be called when the user selects "Images" from the dropdown
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        // Initialize an empty array for stepImages to indicate the section exists
        updatedSteps[stepIndex].stepImages = []
        return updatedSteps
      })
    }

    // Handle image change
    const handleImageChange = (stepIndex: number, files: File[]) => {
      console.log(`Adding ${files.length} new images to step ${stepIndex}`)

      // Update the local steps state
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        updatedSteps[stepIndex].stepImages = files
        return updatedSteps
      })

      // Also update our separate tracking of new images
      setStepNewImages((prev) => ({
        ...prev,
        [stepIndex]: files,
      }))
    }

    // Remove image section
    const handleRemoveImageSection = (stepIndex: number) => {
      // First, collect all existing image IDs that need to be deleted
      const step = localSteps[stepIndex]
      if (step && step.existingStepImages && step.existingStepImages.length > 0) {
        console.log(
          `Removing entire image section for step ${stepIndex} with ${step.existingStepImages.length} existing images`,
        )

        // Add all existing images to the deletion list
        setStepsImagesToDelete((prev) => {
          const newState = { ...prev }
          if (!newState[stepIndex]) {
            newState[stepIndex] = []
          }

          // Add all image IDs from existingStepImages to the deletion list
          step.existingStepImages.forEach((img) => {
            if (!newState[stepIndex].includes(img.id)) {
              console.log(`Adding image ${img.id} to deletion list for step ${stepIndex}`)
              newState[stepIndex].push(img.id)
            }
          })

          return newState
        })

        // Also call the parent's onStepImageDelete for each image if it exists
        if (onStepImageDelete) {
          step.existingStepImages.forEach((img) => {
            console.log(`Calling parent onStepImageDelete for image ${img.id} in step ${stepIndex}`)
            onStepImageDelete(stepIndex, img.id)
          })
        }
      }

      // Then update the local steps state as before
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]
        // Set stepImages to null explicitly to mark it as removed
        updatedSteps[stepIndex].stepImages = null
        // Also clear existing images to ensure complete removal
        updatedSteps[stepIndex].existingStepImages = []
        return updatedSteps
      })

      // Also clear any new images for this step
      setStepNewImages((prev) => {
        const newState = { ...prev }
        delete newState[stepIndex]
        return newState
      })
    }

    // Handle existing image deletion - memoized to prevent unnecessary re-renders
    const handleExistingImageDelete = useCallback(
      (stepIndex: number, imageId: string) => {
        console.log(`Deleting image with ID: ${imageId} from step ${stepIndex}`)

        // Add to the list of images to delete for this step
        setStepsImagesToDelete((prev) => {
          const newState = { ...prev }
          if (!newState[stepIndex]) {
            newState[stepIndex] = []
          }
          newState[stepIndex] = [...newState[stepIndex], imageId]
          return newState
        })

        // Update the local steps state to remove the image from UI
        setLocalSteps((prevSteps) => {
          const updatedSteps = [...prevSteps]
          const step = updatedSteps[stepIndex]

          if (step && step.existingStepImages) {
            step.existingStepImages = step.existingStepImages.filter((img) => img.id !== imageId)
          }

          return updatedSteps
        })

        // Call the parent component's delete handler if provided
        if (onStepImageDelete) {
          onStepImageDelete(stepIndex, imageId)
        }
      },
      [onStepImageDelete],
    )

    // Drag and drop handlers for sidebar only
    const handleDragStart = (e: React.DragEvent, stepIndex: number) => {
      setDraggedStepIndex(stepIndex)
      e.dataTransfer.effectAllowed = "move"

      // Store the index as data to ensure we have it during drop
      e.dataTransfer.setData("text/plain", stepIndex.toString())

      // Make the ghost image semi-transparent
      if (e.target instanceof HTMLElement) {
        const ghostElement = e.target.cloneNode(true) as HTMLElement
        ghostElement.style.opacity = "0.7"
        document.body.appendChild(ghostElement)
        e.dataTransfer.setDragImage(ghostElement, 20, 20)

        // Remove the ghost element after a short delay
        setTimeout(() => {
          document.body.removeChild(ghostElement)
        }, 0)
      }
    }

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggedStepIndex === null || draggedStepIndex === targetIndex) return

      // Add a visual indicator for the drop target
      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = draggedStepIndex > targetIndex ? "2px solid #4caf50" : "none"
      targetElement.style.borderBottom = draggedStepIndex < targetIndex ? "2px solid #4caf50" : "none"
    }

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }

    const handleDragLeave = (e: React.DragEvent) => {
      // Remove the visual indicator when leaving the drop target
      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = "none"
      targetElement.style.borderBottom = "none"
    }

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      // Remove visual indicators
      const targetElement = e.currentTarget as HTMLElement
      targetElement.style.borderTop = "none"
      targetElement.style.borderBottom = "none"

      if (draggedStepIndex === null || draggedStepIndex === targetIndex) return

      // Reorder the steps
      setLocalSteps((prevSteps) => {
        const newSteps = [...prevSteps]
        const [draggedStep] = newSteps.splice(draggedStepIndex, 1)
        newSteps.splice(targetIndex, 0, draggedStep)
        return newSteps
      })

      // Update tracking state for images
      const updateTracking = (
        prevState: Record<number, any>,
        draggedIdx: number,
        targetIdx: number,
      ): Record<number, any> => {
        const newState = { ...prevState }

        // Handle the case where we're moving an item with data
        if (newState[draggedIdx] !== undefined) {
          const draggedData = newState[draggedIdx]

          // Shift items between source and target
          if (draggedIdx < targetIdx) {
            // Moving down: shift items up
            for (let i = draggedIdx; i < targetIdx; i++) {
              newState[i] = newState[i + 1]
            }
          } else {
            // Moving up: shift items down
            for (let i = draggedIdx; i > targetIdx; i--) {
              newState[i] = newState[i - 1]
            }
          }

          // Place dragged item at target position
          newState[targetIdx] = draggedData
        }

        return newState
      }

      // Update image tracking state
      setStepNewImages((prev) => updateTracking(prev, draggedStepIndex, targetIndex))
      setStepsImagesToDelete((prev) => updateTracking(prev, draggedStepIndex, targetIndex))

      // Update selected index if needed
      if (selectedOfferIndex === draggedStepIndex) {
        setSelectedOfferIndex(targetIndex)
      } else if (
        (draggedStepIndex < targetIndex &&
          selectedOfferIndex > draggedStepIndex &&
          selectedOfferIndex <= targetIndex) ||
        (draggedStepIndex > targetIndex && selectedOfferIndex >= targetIndex && selectedOfferIndex < draggedStepIndex)
      ) {
        // Adjust selected index based on drag direction
        if (draggedStepIndex < targetIndex) {
          setSelectedOfferIndex(selectedOfferIndex - 1)
        } else {
          setSelectedOfferIndex(selectedOfferIndex + 1)
        }
      }
    }

    const handleDragEnd = (e: React.DragEvent) => {
      e.preventDefault()

      // Clear any remaining visual indicators
      document.querySelectorAll('[data-tab-button="true"]').forEach((element) => {
        ;(element as HTMLElement).style.borderTop = "none"(element as HTMLElement).style.borderBottom = "none"
      })

      setDraggedStepIndex(null)
    }

    // Improve the reorderTracking function to handle image state properly
    const reorderTracking = (draggedIndex: number, targetIndex: number) => {
      // Update stepNewImages
      setStepNewImages((prev) => {
        const newState = { ...prev }

        // If we have images for the dragged step, we need to move them
        if (newState[draggedIndex]) {
          const draggedImages = newState[draggedIndex]

          // Remove the dragged step's images
          delete newState[draggedIndex]

          // Adjust indices for steps between source and target
          if (draggedIndex < targetIndex) {
            // Moving down: shift indices between source and target up by 1
            for (let i = draggedIndex + 1; i <= targetIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i - 1] = newState[i]
                delete newState[i]
              }
            }
          } else {
            // Moving up: shift indices between target and source down by 1
            for (let i = targetIndex; i < draggedIndex; i++) {
              if (newState[i] !== undefined) {
                newState[i + 1] = newState[i]
                delete newState[i]
              }
            }
          }

          // Place the dragged images at the target index
          newState[targetIndex] = draggedImages
        }

        return newState
      })

      // Update stepsImagesToDelete similarly
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

    // Handle validation errors from OfferOption
    const handleValidationError = (stepIndex: number, hasError: boolean, errorMessage?: string) => {
      // Only update if the error state actually changes
      setOfferErrors((prev) => {
        if (prev[stepIndex] === hasError) {
          return prev
        }
        return {
          ...prev,
          [stepIndex]: hasError,
        }
      })

      // Show error message in snackbar if provided and error state changed
      if (hasError && errorMessage) {
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
      }
    }

    // Validate that all dates in a step are within trip date range
    const validateStepDates = (step: OfferStep, stepIndex: number): string[] => {
      const errors: string[] = []

      // If no trip dates are set, no validation needed
      if (!tripData.startDate && !tripData.endDate) {
        return errors
      }

      const tripStart = tripData.startDate ? tripData.startDate.startOf("day") : null
      // Important change: Use end of day for the trip end date to include the full last day
      const tripEnd = tripData.endDate ? tripData.endDate.endOf("day") : null

      // Check accommodations
      step.accommodations.forEach((acc, accIndex) => {
        if (acc.checkIn && tripStart && acc.checkIn.isBefore(tripStart)) {
          errors.push(`Apgyvendinimas #${accIndex + 1}: Įsiregistravimo data yra prieš kelionės pradžią`)
        }
        if (acc.checkOut && tripEnd && acc.checkOut.isAfter(tripEnd)) {
          errors.push(`Apgyvendinimas #${accIndex + 1}: Išsiregistravimo data yra po kelionės pabaigos`)
        }
      })

      // Check transports
      step.transports.forEach((trans, transIndex) => {
        if (trans.departureTime && tripStart && trans.departureTime.isBefore(tripStart)) {
          errors.push(`Transportas #${transIndex + 1}: Išvykimo laikas yra prieš kelionės pradžią`)
        }
        if (trans.arrivalTime && tripEnd && trans.arrivalTime.isAfter(tripEnd)) {
          errors.push(`Transportas #${transIndex + 1}: Atvykimo laikas yra po kelionės pabaigos`)
        }
      })

      // Check cruises
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

    // Validate all steps when trip dates change or steps change
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

      // If there are errors, show a snackbar message
      if (hasErrors && (tripData.startDate || tripData.endDate)) {
        setSnackbarMessage("Kai kurie įvykiai yra už kelionės datų ribų. Prašome pataisyti prieš tęsiant.")
        setSnackbarSeverity("warning")
        setSnackbarOpen(true)
      }
    }, [tripData.startDate, tripData.endDate, localSteps])

    // Check if there are any validation errors in any offer
    const hasValidationErrors = () => {
      return Object.values(offerErrors).some((hasError) => hasError)
    }

    // Simplified validation for all steps before submission
    const validateAllSteps = (): { valid: boolean; message?: string } => {
      // First check for existing validation errors
      if (hasValidationErrors()) {
        return {
          valid: false,
          message: "Prašome ištaisyti klaidas prieš tęsiant.",
        }
      }

      // Check for date validation errors
      const hasDateErrors = Object.values(dateValidationErrors).some((errors) => errors.length > 0)
      if (hasDateErrors) {
        return {
          valid: false,
          message:
            "Kai kurie įvykiai yra už kelionės datų ribų. Prašome patikrinti, ar visi įvykiai yra kelionės datų ribose.",
        }
      }

      // Check for completely empty steps
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

    // Save changes before submitting to ensure persistence
    const handleSubmit = () => {
      // Validate all steps before proceeding
      const validation = validateAllSteps()
      if (!validation.valid) {
        setSnackbarMessage(validation.message || "Prašome ištaisyti klaidas prieš tęsiant.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return
      }

      // Synchronize the step images with our tracking state before submission
      synchronizeStepImages()

      onSubmit(localSteps, true)
    }

    // Synchronize step images with tracking state
    const synchronizeStepImages = () => {
      // Ensure stepImages in localSteps match our tracking state
      setLocalSteps((prevSteps) => {
        const updatedSteps = [...prevSteps]

        // Update each step's images based on stepNewImages
        Object.entries(stepNewImages).forEach(([indexStr, files]) => {
          const index = Number.parseInt(indexStr, 10)
          if (index >= 0 && index < updatedSteps.length) {
            updatedSteps[index].stepImages = files
          }
        })

        return updatedSteps
      })
    }

    // Fix for the back button - save changes before going back
    const handleBack = () => {
      // Validate all steps before proceeding
      const validation = validateAllSteps()
      if (!validation.valid) {
        setSnackbarMessage(validation.message || "Prašome ištaisyti klaidas prieš grįžimą.")
        setSnackbarSeverity("error")
        setSnackbarOpen(true)
        return
      }

      // Synchronize the step images with our tracking state before going back
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

    // Fix for mobile drawer
    useEffect(() => {
      // Reset drawer state when switching between mobile and desktop
      if (!isMobile) {
        setDrawerOpen(false)
      }
    }, [isMobile])

    return (
      <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
        {/* Sidebar for desktop */}
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

        {/* Mobile drawer */}
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
          {/* Mobile selector */}
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

          {/* Display only the selected offer */}
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

          {/* Navigation buttons - centered across the entire width */}
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

        {/* Snackbar for validation errors */}
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
