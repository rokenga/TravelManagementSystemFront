"use client"

import React from "react"

import { useRef, useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  IconButton,
  Grid,
  Menu,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Alert,
  Tooltip,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import DirectionsCar from "@mui/icons-material/DirectionsCar"
import Hotel from "@mui/icons-material/Hotel"
import Sailing from "@mui/icons-material/Sailing"
import AnchorIcon from "@mui/icons-material/Anchor"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import { Flight, Train, DirectionsBus, FlightTakeoff, FlightLand, Image, Upload } from "@mui/icons-material"
import type { Dayjs } from "dayjs"
import CustomDateTimePicker from "../CustomDatePicker"
import CustomSnackbar from "../CustomSnackBar"

// Define TypeScript interfaces for our data structures
export interface Accommodation {
  hotelName: string
  checkIn: Dayjs | null
  checkOut: Dayjs | null
  hotelLink: string
  description: string
  boardBasis: string
  roomType: string
  price: number
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

export interface Step {
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
}

export interface Option {
  value: string
  label: string
}

// Constants for file upload restrictions
const MAX_FILE_SIZE_MB = 3 // 3MB per offer step
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

interface OfferOptionProps {
  step: Step
  stepIndex: number
  boardBasisOptions: Option[]
  transportTypeOptions: Option[]
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
}

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
    const accommodationTotal = step.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0)
    const transportTotal = step.transports.reduce((sum, trans) => sum + (trans.price || 0), 0)
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

  // Handle file selection for images
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Convert FileList to array
    const fileArray = Array.from(files)

    // Validate files
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Calculate new total size
    const currentImages = step.stepImages || []
    const newTotalSize =
      currentImages.reduce((total, file) => total + file.size, 0) +
      fileArray.reduce((total, file) => total + file.size, 0)

    // Check if adding these files would exceed the limit
    if (newTotalSize > MAX_FILE_SIZE_BYTES) {
      setSnackbarMessage(`Viršytas maksimalus dydis (${MAX_FILE_SIZE_MB}MB). Pasirinkite mažesnius failus.`)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      event.target.value = ""
      return
    }

    fileArray.forEach((file) => {
      // Check file extension
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        invalidFiles.push(`${file.name} (netinkamas formatas)`)
        return
      }

      // Check individual file size (optional additional check)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        invalidFiles.push(`${file.name} (per didelis failas, max ${MAX_FILE_SIZE_MB}MB)`)
        return
      }

      validFiles.push(file)
    })

    // Show error if there are invalid files
    if (invalidFiles.length > 0) {
      setSnackbarMessage(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    }

    // Add valid files to state
    if (validFiles.length > 0) {
      onImageChange(stepIndex, [...(step.stepImages || []), ...validFiles])
    }

    // Reset the input
    event.target.value = ""
  }

  // Get transport type label
  const getTransportTypeLabel = (type: string): string => {
    const option = transportTypeOptions.find((opt) => opt.value === type)
    return option ? option.label : type
  }

  // Get board basis label
  const getBoardBasisLabel = (basis: string): string => {
    const option = boardBasisOptions.find((opt) => opt.value === basis)
    return option ? option.label : basis
  }

  // Get transport type icon
  const getTransportTypeIcon = (type: string) => {
    switch (type) {
      case "Flight":
        return <Flight fontSize="small" color="primary" />
      case "Train":
        return <Train fontSize="small" color="primary" />
      case "Bus":
        return <DirectionsBus fontSize="small" color="primary" />
      case "Car":
        return <DirectionsCar fontSize="small" color="primary" />
      case "Ferry":
        return <Sailing fontSize="small" color="primary" />
      default:
        return null
    }
  }

  // Get departure/arrival icons based on transport type
  const getDepartureIcon = (type: string, isArrival = false) => {
    switch (type) {
      case "Flight":
        return isArrival ? (
          <FlightLand fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
        ) : (
          <FlightTakeoff fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
        )
      case "Cruise":
        return <AnchorIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
      default:
        return <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
    }
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

  // Render a responsive header for accordion items
  const renderAccordionHeader = (
    icon: React.ReactNode,
    title: string,
    dates: string,
    price: number,
    onRemove: (e: React.MouseEvent) => void,
  ) => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
          flexDirection: isSmall ? "column" : "row",
          alignItems: isSmall ? "flex-start" : "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: isSmall ? 1 : 0 }}>
          {icon}
          <Typography variant="subtitle1" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            ml: isSmall ? 0 : 2,
            width: isSmall ? "100%" : "auto",
            justifyContent: isSmall ? "space-between" : "flex-end",
          }}
        >
          <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
            {dates}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {price.toFixed(2)} €
          </Typography>
          <IconButton size="small" color="error" onClick={onRemove} sx={{ ml: 1 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    )
  }

  // Calculate total size of current images
  const totalImageSizeMB = (step.stepImages || []).reduce((total, file) => total + file.size, 0) / (1024 * 1024)
  const isOverSizeLimit = totalImageSizeMB > MAX_FILE_SIZE_MB

  // Check if this step already has an image section
  const hasImageSection =
    step.stepImages !== undefined || (step.existingStepImages && step.existingStepImages.length > 0)

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
            onChange={(e) => onStepNameChange(stepIndex, e.target.value)}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 600, mr: 2 }}
            placeholder="Pasiūlymo pavadinimas"
            onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => {
              e.stopPropagation()
              onRemoveStep(stepIndex)
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
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

        {/* Accommodations as collapsible tabs */}
        {step.accommodations.map((acc, accIndex) => (
          <Accordion key={`acc-${accIndex}`} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`acc-content-${accIndex}`}
              id={`acc-header-${accIndex}`}
              sx={{
                bgcolor: "background.paper",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            >
              {renderAccordionHeader(
                <Hotel sx={{ mr: 1, color: "primary.main" }} />,
                acc.hotelName ? `Apgyvendinimas - ${acc.hotelName}` : "Apgyvendinimas",
                `${formatDate(acc.checkIn)} - ${formatDate(acc.checkOut)}`,
                acc.price,
                (e) => {
                  e.stopPropagation()
                  onRemoveAccommodation(stepIndex, accIndex)
                },
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
              {/* First row: Hotel name and link */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Viešbučio pavadinimas"
                    value={acc.hotelName}
                    onChange={(e) => onAccommodationChange(stepIndex, accIndex, "hotelName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Viešbučio nuoroda"
                    placeholder="https://..."
                    value={acc.hotelLink}
                    onChange={(e) => onAccommodationChange(stepIndex, accIndex, "hotelLink", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Second row: Check-in/Check-out times, Meal type, Room type */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDateTimePicker
                    label="Atvykimo data"
                    value={acc.checkIn}
                    onChange={(newDate) => handleAccommodationDateChange(stepIndex, accIndex, "checkIn", newDate)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDateTimePicker
                    label="Išvykimo data"
                    value={acc.checkOut}
                    onChange={(newDate) => handleAccommodationDateChange(stepIndex, accIndex, "checkOut", newDate)}
                    minDate={acc.checkIn}
                  />
                  {timeErrors[`acc-${stepIndex}-${accIndex}`] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                      {timeErrors[`acc-${stepIndex}-${accIndex}`]}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Maitinimo tipas</InputLabel>
                    <Select
                      value={acc.boardBasis}
                      onChange={(e) => onAccommodationChange(stepIndex, accIndex, "boardBasis", e.target.value)}
                      label="Maitinimo tipas"
                    >
                      <MenuItem value="">-- Pasirinkite --</MenuItem>
                      {boardBasisOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kambario tipas"
                    value={acc.roomType}
                    onChange={(e) => onAccommodationChange(stepIndex, accIndex, "roomType", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Third row: Description */}
              <TextField
                label="Papildomas aprašymas"
                value={acc.description}
                onChange={(e) => onAccommodationChange(stepIndex, accIndex, "description", e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Fourth row: Price */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={9}></Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Kaina (€)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    value={acc.price}
                    onChange={(e) => onAccommodationChange(stepIndex, accIndex, "price", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Transports as collapsible tabs */}
        {step.transports.map((trans, transIndex) => (
          <Accordion key={`trans-${transIndex}`} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`trans-content-${transIndex}`}
              id={`trans-header-${transIndex}`}
              sx={{
                bgcolor: "background.paper",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            >
              {renderAccordionHeader(
                getTransportTypeIcon(trans.transportType),
                trans.transportName
                  ? `${getTransportTypeLabel(trans.transportType)} - ${trans.transportName}`
                  : getTransportTypeLabel(trans.transportType),
                `${trans.departurePlace || "Išvykimas"} (${formatDate(trans.departureTime)}) - ${trans.arrivalPlace || "Atvykimas"} (${formatDate(trans.arrivalTime)})`,
                trans.price,
                (e) => {
                  e.stopPropagation()
                  onRemoveTransport(stepIndex, transIndex)
                },
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
              {/* First row: Type, Company, Name, Code */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Transporto tipas</InputLabel>
                    <Select
                      value={trans.transportType}
                      onChange={(e) => onTransportChange(stepIndex, transIndex, "transportType", e.target.value)}
                      label="Transporto tipas"
                    >
                      <MenuItem value="">-- Pasirinkite --</MenuItem>
                      {transportTypeOptions
                        .filter((opt) => opt.value !== "Cruise")
                        .map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {React.cloneElement(getTransportTypeIcon(opt.value) as React.ReactElement, {
                                color: "primary",
                              })}
                              <Box sx={{ ml: 1 }}>{opt.label}</Box>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Kompanijos pavadinimas"
                    value={trans.companyName}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "companyName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Transporto pavadinimas"
                    value={trans.transportName}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "transportName", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Transporto kodas"
                    value={trans.transportCode}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "transportCode", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Transport fields in one row */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Išvykimo vieta"
                    value={trans.departurePlace}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "departurePlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDateTimePicker
                    label="Išvykimo laikas"
                    value={trans.departureTime}
                    onChange={(newDate) => handleTransportTimeChange(stepIndex, transIndex, "departureTime", newDate)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Atvykimo vieta"
                    value={trans.arrivalPlace}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "arrivalPlace", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <CustomDateTimePicker
                    label="Atvykimo laikas"
                    value={trans.arrivalTime}
                    onChange={(newDate) => handleTransportTimeChange(stepIndex, transIndex, "arrivalTime", newDate)}
                    minDate={trans.departureTime}
                  />
                  {timeErrors[`trans-${stepIndex}-${transIndex}`] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                      {timeErrors[`trans-${stepIndex}-${transIndex}`]}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Fifth row: Description */}
              <TextField
                label="Aprašymas"
                value={trans.description}
                onChange={(e) => onTransportChange(stepIndex, transIndex, "description", e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{ mb: 2 }}
              />

              {/* Sixth row: Price */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={9}></Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Kaina (€)"
                    type="number"
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    value={trans.price}
                    onChange={(e) => onTransportChange(stepIndex, transIndex, "price", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Cruises as collapsible tabs */}
        {step.cruises &&
          step.cruises.map((cruise, cruiseIndex) => (
            <Accordion key={`cruise-${cruiseIndex}`} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`cruise-content-${cruiseIndex}`}
                id={`cruise-header-${cruiseIndex}`}
                sx={{
                  bgcolor: "background.paper",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                }}
              >
                {renderAccordionHeader(
                  <Sailing sx={{ mr: 1, color: "primary.main" }} />,
                  cruise.transportName ? `Kruizas - ${cruise.transportName}` : "Kruizas",
                  `${cruise.departurePlace || "Išvykimas"} (${formatDate(cruise.departureTime)}) - ${cruise.arrivalPlace || "Atvykimas"} (${formatDate(cruise.arrivalTime)})`,
                  cruise.price,
                  (e) => {
                    e.stopPropagation()
                    onRemoveCruise(stepIndex, cruiseIndex)
                  },
                )}
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
                {/* First row: Company, Ship name, Code, Cabin type */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Kruizo kompanija"
                      value={cruise.companyName}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "companyName", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Laivo pavadinimas"
                      value={cruise.transportName}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "transportName", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Kruizo kodas"
                      value={cruise.transportCode}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "transportCode", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Kajutės tipas"
                      value={cruise.cabinType}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "cabinType", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>

                {/* Second row: Departure and arrival ports and times */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Išvykimo uostas"
                      value={cruise.departurePlace}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "departurePlace", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomDateTimePicker
                      label="Išvykimo laikas"
                      value={cruise.departureTime}
                      onChange={(newDate) => handleCruiseTimeChange(stepIndex, cruiseIndex, "departureTime", newDate)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Atvykimo uostas"
                      value={cruise.arrivalPlace}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "arrivalPlace", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomDateTimePicker
                      label="Atvykimo laikas"
                      value={cruise.arrivalTime}
                      onChange={(newDate) => handleCruiseTimeChange(stepIndex, cruiseIndex, "arrivalTime", newDate)}
                      minDate={cruise.departureTime}
                    />
                    {timeErrors[`cruise-${stepIndex}-${cruiseIndex}`] && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                        {timeErrors[`cruise-${stepIndex}-${cruiseIndex}`]}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                {/* Third row: Description */}
                <TextField
                  label="Papildomas aprašymas"
                  value={cruise.description}
                  onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "description", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  sx={{ mb: 2 }}
                />

                {/* Fourth row: Price */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={9}></Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Kaina (€)"
                      type="number"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      value={cruise.price}
                      onChange={(e) => onCruiseChange(stepIndex, cruiseIndex, "price", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

        {/* Images section - show if stepImages is defined OR there are existing images */}
        {(step.stepImages !== undefined || (step.existingStepImages && step.existingStepImages.length > 0)) && (
          <Accordion key="images-section" sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="images-content"
              id="images-header"
              sx={{
                bgcolor: "background.paper",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Image sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    Nuotraukos
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
                    {step.stepImages.length + (step.existingStepImages?.length || 0)} nuotraukos
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Call the parent component's method to remove the image section
                      onRemoveImageSection(stepIndex)
                    }}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Leistini formatai: {ALLOWED_EXTENSIONS.join(", ").replace(/\./g, "").toUpperCase()}
                    (max {MAX_FILE_SIZE_MB}MB vienam pasiūlymui)
                  </Typography>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={isOverSizeLimit}
                  >
                    Įkelti nuotraukas
                    <input
                      hidden
                      accept={ALLOWED_EXTENSIONS.join(",")}
                      multiple
                      type="file"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Box>

                {isOverSizeLimit && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Viršytas maksimalus dydis ({MAX_FILE_SIZE_MB}MB). Ištrinkite kai kurias nuotraukas.
                  </Alert>
                )}

                {/* Display existing images from the server */}
                {step.existingStepImages && step.existingStepImages.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Esamos nuotraukos:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      {step.existingStepImages.map((img, idx) => (
                        <Grid item key={`existing-${idx}`}>
                          <Box
                            sx={{
                              width: 120,
                              height: 120,
                              border: "1px solid #ccc",
                              borderRadius: 2,
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <img
                              src={img.url || "/placeholder.svg"}
                              alt={img.altText || `Nuotrauka ${idx + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                backgroundColor: "rgba(255,255,255,0.7)",
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                              }}
                              onClick={() => {
                                if (onExistingImageDelete) {
                                  onExistingImageDelete(stepIndex, img.id)
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}

                {/* Display newly added images */}
                {step.stepImages && step.stepImages.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      {step.existingStepImages && step.existingStepImages.length > 0
                        ? "Naujos nuotraukos:"
                        : "Nuotraukos:"}
                    </Typography>
                    <Grid container spacing={2}>
                      {step.stepImages.map((file, index) => (
                        <Grid item key={index}>
                          <Box
                            sx={{
                              width: 120,
                              height: 120,
                              border: "1px solid #ccc",
                              borderRadius: 2,
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={file.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                backgroundColor: "rgba(255,255,255,0.7)",
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                              }}
                              onClick={() => {
                                const newFiles = [...(step.stepImages || [])]
                                newFiles.splice(index, 1)
                                onImageChange(stepIndex, newFiles)
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  !step.existingStepImages?.length && (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nėra įkeltų nuotraukų
                      </Typography>
                    </Box>
                  )
                )}

                {step.stepImages.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Typography variant="body2" color="text.secondary">
                      Bendras dydis: {totalImageSizeMB.toFixed(2)} MB / {MAX_FILE_SIZE_MB} MB
                    </Typography>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
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

