"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
}

const SIDEBAR_WIDTH = 240

const Step2Offers: React.FC<Step2Props> = ({
  tripData,
  steps,
  onSubmit,
  onBack,
  formatDate,
  onStepImagesChange,
  onStepImageDelete,
}) => {
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

  // Snackbar state for validation errors
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

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
        return newErrors
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

    // Show a helpful message to the user
    setSnackbarMessage("Nuotraukų sekcija pridėta. Prašome įkelti nuotraukas arba pašalinti sekciją.")
    setSnackbarSeverity("info")
    setSnackbarOpen(true)
  }

  // Handle image change
  const handleImageChange = (stepIndex: number, files: File[]) => {
    setLocalSteps((prevSteps) => {
      const updatedSteps = [...prevSteps]
      updatedSteps[stepIndex].stepImages = files
      return updatedSteps
    })
  }

  // Remove image section
  const handleRemoveImageSection = (stepIndex: number) => {
    setLocalSteps((prevSteps) => {
      const updatedSteps = [...prevSteps]
      // Completely remove both stepImages and existingStepImages
      delete updatedSteps[stepIndex].stepImages
      delete updatedSteps[stepIndex].existingStepImages
      return updatedSteps
    })
  }

  // Drag and drop handlers for sidebar only
  const handleDragStart = (e: React.DragEvent, stepIndex: number) => {
    setDraggedStepIndex(stepIndex)
    e.dataTransfer.effectAllowed = "move"
    // Make the ghost image semi-transparent
    if (e.target instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.target, 20, 20)
    }
  }

  const handleDragOver = (e: React.DragEvent, stepIndex: number) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === stepIndex) return

    // Reorder the steps
    setLocalSteps((prevSteps) => {
      const newSteps = [...prevSteps]
      const draggedStep = newSteps[draggedStepIndex]
      newSteps.splice(draggedStepIndex, 1)
      newSteps.splice(stepIndex, 0, draggedStep)
      setDraggedStepIndex(stepIndex)

      // Update selected index if needed
      if (selectedOfferIndex === draggedStepIndex) {
        setSelectedOfferIndex(stepIndex)
      } else if (
        (selectedOfferIndex > draggedStepIndex && selectedOfferIndex <= stepIndex) ||
        (selectedOfferIndex < draggedStepIndex && selectedOfferIndex >= stepIndex)
      ) {
        // Adjust selected index based on drag direction
        setSelectedOfferIndex(selectedOfferIndex > draggedStepIndex ? selectedOfferIndex - 1 : selectedOfferIndex + 1)
      }

      return newSteps
    })
  }

  const handleDragEnd = () => {
    setDraggedStepIndex(null)
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

  // Check if there are any validation errors in any offer
  const hasValidationErrors = () => {
    return Object.values(offerErrors).some((hasError) => hasError)
  }

  // Validate all steps before submission
  const validateAllSteps = (): { valid: boolean; message?: string } => {
    // First check for existing validation errors
    if (hasValidationErrors()) {
      return {
        valid: false,
        message: "Prašome ištaisyti klaidas prieš tęsiant.",
      }
    }

    // Debug: Log all steps to see their structure
    console.log("Validating steps:", JSON.stringify(localSteps, null, 2))

    // Then check for empty image sections
    for (let i = 0; i < localSteps.length; i++) {
      const step = localSteps[i]

      // Check if this step has an image section that was explicitly added
      // An image section exists if stepImages is an array (even if empty)
      const hasImageSection = Array.isArray(step.stepImages)

      // Check if the image section is empty (no files and no existing images)
      const isImageSectionEmpty =
        hasImageSection &&
        (!step.stepImages || step.stepImages.length === 0) &&
        (!step.existingStepImages || step.existingStepImages.length === 0)

      // Only show error if there's an image section AND it's empty
      if (isImageSectionEmpty) {
        console.log(`Empty image section found in step ${i}:`, step.name)
        setSelectedOfferIndex(i) // Switch to the problematic offer
        return {
          valid: false,
          message: `Pasiūlyme "${step.name}" yra tuščia nuotraukų sekcija. Įkelkite nuotraukas arba pašalinkite sekciją.`,
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

    onSubmit(localSteps, true)
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
            onExistingImageDelete={(stepIndex, imageId) => {
              if (onStepImageDelete) {
                onStepImageDelete(stepIndex, imageId)
              }
            }}
            onDestinationChange={handleStepDestinationChange}
            tripDestination={tripData.destination}
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
}

export default Step2Offers
