"use client"

import React, { useRef, useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  DirectionsCar,
  Hotel,
  Sailing,
  Image,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import type { Dayjs } from "dayjs"
import CustomSnackbar from "../../CustomSnackBar"
import DestinationAutocomplete, { type Country } from "../../DestinationAutocomplete"
import AccommodationItem, { type Accommodation } from "./AccommodationItem"
import TransportItem, { type Transport } from "./TransportItem"
import CruiseItem, { type Cruise } from "./CruiseItem"
import ImageSection from "./ImageSection"
import type { Step, Option } from "@/types"

export interface OfferOptionProps {
  step: Step
  stepIndex: number
  boardBasisOptions: Option[]
  transportTypeOptions: { value: string; label: string; icon: React.ReactNode }[]
  openDropdowns: Record<number, boolean>
  draggedStepIndex: number | null
  onToggleExpand: (stepIndex: number) => void
  onStepNameChange: (stepIndex: number, name: string) => void
  onRemoveStep: (stepIndex: number) => void
  onAddAccommodation: (stepIndex: number) => void
  onRemoveAccommodation: (stepIndex: number, accIndex: number) => void
  onAccommodationChange: (
    stepIndex: number,
    accIndex: number,
    field: keyof Accommodation,
    value: string | number | Dayjs | null,
  ) => void
  onAddTransport: (stepIndex: number) => void
  onRemoveTransport: (stepIndex: number, transIndex: number) => void
  onTransportChange: (
    stepIndex: number,
    transIndex: number,
    field: keyof Transport,
    value: string | number | Dayjs | null,
  ) => void
  onAddCruise: (stepIndex: number) => void
  onRemoveCruise: (stepIndex: number, cruiseIndex: number) => void
  onCruiseChange: (
    stepIndex: number,
    cruiseIndex: number,
    field: keyof Cruise,
    value: string | number | Dayjs | null,
  ) => void
  onToggleDropdown: (stepIndex: number) => void
  formatDate: (date: Dayjs | null) => string
  onValidationError?: (stepIndex: number, hasError: boolean, errorMessage?: string) => void
  onAddImages: (stepIndex: number) => void
  onImageChange: (stepIndex: number, files: File[]) => void
  onRemoveImageSection: (stepIndex: number) => void
  onExistingImageDelete?: (stepIndex: number, imageId: string) => void
  onDestinationChange?: (stepIndex: number, destination: Country | null) => void
  tripDestination: Country | null
  dateValidationErrors?: string[]
  tripStartDate?: Dayjs | null
  tripEndDate?: Dayjs | null
}

const MAX_OFFER_NAME_LENGTH = 200

export function OfferOption({
  step,
  stepIndex,
  boardBasisOptions,
  transportTypeOptions,
  openDropdowns,
  draggedStepIndex,
  onToggleExpand,
  onStepNameChange,
  onRemoveStep,
  onAddAccommodation,
  onRemoveAccommodation,
  onAccommodationChange,
  onAddTransport,
  onRemoveTransport,
  onTransportChange,
  onAddCruise,
  onRemoveCruise,
  onCruiseChange,
  onToggleDropdown,
  formatDate,
  onValidationError,
  onAddImages,
  onImageChange,
  onRemoveImageSection,
  onExistingImageDelete,
  onDestinationChange,
  tripDestination,
  dateValidationErrors,
  tripStartDate,
  tripEndDate,
}: OfferOptionProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"))

  // State for the snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")

  // State for validation errors
  const [timeErrors, setTimeErrors] = useState<Record<string, string | null>>({})

  // Effect to notify parent component of validation errors
  useEffect(() => {
    const hasTimeErrors = Object.values(timeErrors).some((error) => error !== null)

    if (onValidationError) {
      // Debounce the validation error notification
      const timeoutId = setTimeout(() => {
        const errorMessage = Object.values(timeErrors).find((error) => error !== null) || undefined
        onValidationError(stepIndex, hasTimeErrors, errorMessage)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [timeErrors, stepIndex, onValidationError])

  // Calculate total price for a step
  const calculateStepTotal = (step: Step): number => {
    if (!step) return 0

    const accommodationTotal = step.accommodations?.reduce((sum, acc) => sum + (acc.price || 0), 0) || 0
    const transportTotal = step.transports?.reduce((sum, trans) => sum + (trans.price || 0), 0) || 0
    const cruiseTotal = step.cruises ? step.cruises.reduce((sum, cruise) => sum + (cruise.price || 0), 0) : 0

    return accommodationTotal + transportTotal + cruiseTotal
  }

  // Reference for the add button
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    onToggleDropdown(stepIndex)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    onToggleDropdown(stepIndex)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  // Handle destination change
  const handleDestinationChange = (destination: Country | null) => {
    if (onDestinationChange) {
      onDestinationChange(stepIndex, destination)
    }
  }

  // Handle step name change with character limit
  const handleStepNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (value.length > MAX_OFFER_NAME_LENGTH) {
      value = value.slice(0, MAX_OFFER_NAME_LENGTH)
    }
    onStepNameChange(stepIndex, value)
  }

  // Validate time constraints and show error if needed
  const validateTimeConstraint = (startTime: Dayjs | null, endTime: Dayjs | null, errorKey: string): boolean => {
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

      // Also show in snackbar
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

  const handleAddAccommodation = () => {
    onAddAccommodation(stepIndex)
    handleCloseMenu()
  }

  const handleAddTransport = () => {
    onAddTransport(stepIndex)
    handleCloseMenu()
  }

  const handleAddCruise = () => {
    onAddCruise(stepIndex)
    handleCloseMenu()
  }

  const handleAddImages = () => {
    onAddImages(stepIndex)
    handleCloseMenu()
  }

  // Handle accommodation date changes with validation
  const handleAccommodationDateChange = (
    stepIndex: number,
    accIndex: number,
    field: "checkIn" | "checkOut",
    value: Dayjs | null,
  ) => {
    const acc = step.accommodations[accIndex]
    const errorKey = `acc-${stepIndex}-${accIndex}`

    // Determine which dates to validate
    const startDate = field === "checkIn" ? value : acc.checkIn
    const endDate = field === "checkOut" ? value : acc.checkOut

    // Update the value first
    onAccommodationChange(stepIndex, accIndex, field, value)

    // Then validate if both dates exist
    if (startDate && endDate) {
      validateTimeConstraint(startDate, endDate, errorKey)
    }
  }

  // Handle transport time changes with validation
  const handleTransportTimeChange = (
    stepIndex: number,
    transIndex: number,
    field: "departureTime" | "arrivalTime",
    value: Dayjs | null,
  ) => {
    const trans = step.transports[transIndex]
    const errorKey = `trans-${stepIndex}-${transIndex}`

    // Determine which times to validate
    const startTime = field === "departureTime" ? value : trans.departureTime
    const endTime = field === "arrivalTime" ? value : trans.arrivalTime

    // Update the value first
    onTransportChange(stepIndex, transIndex, field, value)

    // Then validate if both times exist
    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  // Handle cruise time changes with validation
  const handleCruiseTimeChange = (
    stepIndex: number,
    cruiseIndex: number,
    field: "departureTime" | "arrivalTime",
    value: Dayjs | null,
  ) => {
    const cruise = step.cruises[cruiseIndex]
    const errorKey = `cruise-${stepIndex}-${cruiseIndex}`

    // Determine which times to validate
    const startTime = field === "departureTime" ? value : cruise.departureTime
    const endTime = field === "arrivalTime" ? value : cruise.arrivalTime

    // Update the value first
    onCruiseChange(stepIndex, cruiseIndex, field, value)

    // Then validate if both times exist
    if (startTime && endTime) {
      validateTimeConstraint(startTime, endTime, errorKey)
    }
  }

  // Check if this step already has an image section
  const hasImageSection =
    Array.isArray(step.stepImages) || (step.existingStepImages && step.existingStepImages.length > 0)

  return (
    <Paper
      sx={{
        mb: 3,
        border: draggedStepIndex === stepIndex ? "2px dashed #4caf50" : "1px solid #e0e0e0",
        borderRadius: 2,
        overflow: "visible", // Changed from "hidden" to "visible" to allow dropdown to overflow
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid #e0e0e0",
          flexDirection: isSmall ? "column" : "row",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            width: isSmall ? "100%" : "auto",
            mb: isSmall ? 1 : 0,
          }}
        >
          <TextField
            value={step.name}
            onChange={handleStepNameChange}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 600, mr: 2 }}
            placeholder="Pasiūlymo pavadinimas"
            onClick={(e) => e.stopPropagation()}
            inputProps={{ maxLength: MAX_OFFER_NAME_LENGTH }}
            helperText={`${step.name.length}/${MAX_OFFER_NAME_LENGTH}`}
            FormHelperTextProps={{ sx: { textAlign: "right", m: 0, mt: 0.5 } }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: isSmall ? "100%" : "auto",
            justifyContent: isSmall ? "space-between" : "flex-end",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mr: 2 }}>
            Viso: {calculateStepTotal(step).toFixed(2)} €
          </Typography>
          <IconButton
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveStep(stepIndex)
            }}
            aria-label="Ištrinti pasiūlymą"
            data-delete-offer-button="true"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {dateValidationErrors && dateValidationErrors.length > 0 && (
          <Box sx={{ mb: 3 }}>{/* No visible error box, but we still track errors for validation */}</Box>
        )}
        {/* Add Destination field for the offer */}
        <Box sx={{ mb: 3 }}>
          <DestinationAutocomplete
            value={step.destination}
            onChange={handleDestinationChange}
            label="Pasiūlymo tikslas"
            placeholder={
              tripDestination
                ? `Palikite tuščią kad naudotumėte: ${tripDestination.name}`
                : "Pasirinkite šalį arba kontinentą"
            }
            size="small"
          />
        </Box>

        {/* Dropdown button */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Button
            ref={addButtonRef}
            variant="contained"
            onClick={handleOpenMenu}
            endIcon={<ExpandMoreIcon />}
            sx={{ minWidth: 200 }}
          >
            Pridėti įvykį
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <MenuItem onClick={handleAddTransport}>
              <ListItemIcon>
                <DirectionsCar fontSize="small" color="primary" />
              </ListItemIcon>
              Transportas
            </MenuItem>
            <MenuItem onClick={handleAddAccommodation}>
              <ListItemIcon>
                <Hotel fontSize="small" color="primary" />
              </ListItemIcon>
              Apgyvendinimas
            </MenuItem>
            <MenuItem onClick={handleAddCruise}>
              <ListItemIcon>
                <Sailing fontSize="small" color="primary" />
              </ListItemIcon>
              Kruizas
            </MenuItem>
            <Tooltip title={hasImageSection ? "Nuotraukų sekcija jau pridėta" : ""} placement="right">
              <div>
                <MenuItem
                  onClick={handleAddImages}
                  disabled={hasImageSection}
                  sx={{
                    opacity: hasImageSection ? 0.5 : 1,
                    pointerEvents: hasImageSection ? "none" : "auto",
                  }}
                >
                  <ListItemIcon>
                    <Image fontSize="small" color="primary" />
                  </ListItemIcon>
                  Nuotraukos
                </MenuItem>
              </div>
            </Tooltip>
          </Menu>
        </Box>

        {/* Combined accommodations, transports, cruises, and images section */}
        {step.accommodations.length === 0 &&
          step.transports.length === 0 &&
          (!step.cruises || step.cruises.length === 0) &&
          (!step.stepImages || step.stepImages.length === 0) && (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary", mb: 2, textAlign: "center" }}
            >
              Nėra pridėtų pasiūlymo elementų.
            </Typography>
          )}

        {/* Accommodations */}
        {step.accommodations.map((acc, accIndex) => (
          <AccommodationItem
            key={`acc-${accIndex}`}
            accommodation={acc}
            accIndex={accIndex}
            stepIndex={stepIndex}
            formatDate={formatDate}
            onRemoveAccommodation={onRemoveAccommodation}
            onAccommodationChange={onAccommodationChange}
            boardBasisOptions={boardBasisOptions}
            timeError={timeErrors[`acc-${stepIndex}-${accIndex}`]}
            onTimeChange={handleAccommodationDateChange}
            isSmall={isSmall}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
          />
        ))}

        {/* Transports */}
        {step.transports.map((trans, transIndex) => (
          <TransportItem
            key={`trans-${transIndex}`}
            transport={trans}
            transIndex={transIndex}
            stepIndex={stepIndex}
            formatDate={formatDate}
            onRemoveTransport={onRemoveTransport}
            onTransportChange={onTransportChange}
            transportTypeOptions={transportTypeOptions}
            timeError={timeErrors[`trans-${stepIndex}-${transIndex}`]}
            onTimeChange={handleTransportTimeChange}
            isSmall={isSmall}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
          />
        ))}

        {/* Cruises */}
        {step.cruises &&
          step.cruises.map((cruise, cruiseIndex) => (
            <CruiseItem
              key={`cruise-${cruiseIndex}`}
              cruise={cruise}
              cruiseIndex={cruiseIndex}
              stepIndex={stepIndex}
              formatDate={formatDate}
              onRemoveCruise={onRemoveCruise}
              onCruiseChange={onCruiseChange}
              timeError={timeErrors[`cruise-${stepIndex}-${cruiseIndex}`]}
              onTimeChange={handleCruiseTimeChange}
              isSmall={isSmall}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
            />
          ))}

        {/* Images section */}
        {(Array.isArray(step.stepImages) || (step.existingStepImages && step.existingStepImages.length > 0)) && (
          <ImageSection
            stepIndex={stepIndex}
            stepImages={step.stepImages}
            existingStepImages={step.existingStepImages}
            onImageChange={onImageChange}
            onRemoveImageSection={onRemoveImageSection}
            onExistingImageDelete={onExistingImageDelete}
          />
        )}
      </Box>

      {/* Snackbar for validation errors */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleCloseSnackbar}
      />
    </Paper>
  )
}
