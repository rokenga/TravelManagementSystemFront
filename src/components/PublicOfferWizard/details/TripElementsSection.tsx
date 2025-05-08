"use client"

import type React from "react"
import { Box, Typography, Paper, Alert } from "@mui/material"
import AddEventMenu from "./AddEventMenu"
import AccommodationItem from "./AccommodationItem"
import TransportItem from "./TransportItem"
import CruiseItem from "./CruiseItem"
import type { PublicOfferWizardData, Accommodation, Transport, Cruise } from "../CreatePublicOfferWizardForm"

interface TripElementsSectionProps {
  formData: PublicOfferWizardData & { showValidationErrors?: boolean }
  handleAddAccommodation: () => void
  handleAddTransport: () => void
  handleAddCruise: () => void
  handleAccommodationChange: (accIndex: number, field: keyof Accommodation, value: any) => void
  handleAccommodationDateChange: (accIndex: number, field: "checkIn" | "checkOut", value: any) => void
  handleRemoveAccommodation: (accIndex: number) => void
  handleTransportChange: (transIndex: number, field: keyof Transport, value: any) => void
  handleTransportTimeChange: (transIndex: number, field: "departureTime" | "arrivalTime", value: any) => void
  handleRemoveTransport: (transIndex: number) => void
  handleCruiseChange: (cruiseIndex: number, field: keyof Cruise, value: any) => void
  handleCruiseTimeChange: (cruiseIndex: number, field: "departureTime" | "arrivalTime", value: any) => void
  handleRemoveCruise: (cruiseIndex: number) => void
  timeErrors: Record<string, string | null>
  validateEventRequiredFields: () => string[]
  validateEventDateRanges: () => string[]
  setSnackbarMessage: (message: string) => void
  setSnackbarSeverity: (severity: "success" | "error" | "info" | "warning") => void
  setSnackbarOpen: (open: boolean) => void
  isEditing: boolean
}

const TripElementsSection: React.FC<TripElementsSectionProps> = ({
  formData,
  handleAddAccommodation,
  handleAddTransport,
  handleAddCruise,
  handleAccommodationChange,
  handleAccommodationDateChange,
  handleRemoveAccommodation,
  handleTransportChange,
  handleTransportTimeChange,
  handleRemoveTransport,
  handleCruiseChange,
  handleCruiseTimeChange,
  handleRemoveCruise,
  timeErrors,
  validateEventRequiredFields,
  validateEventDateRanges,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  isEditing,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      {/* Add Event Menu */}
      <Box sx={{ mb: 4 }}>
        <AddEventMenu
          onAddAccommodation={handleAddAccommodation}
          onAddTransport={handleAddTransport}
          onAddCruise={handleAddCruise}
        />
      </Box>

      {/* Combined events section */}
      {formData.accommodations.length === 0 && formData.transports.length === 0 && formData.cruises.length === 0 && (
        <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", mb: 2, textAlign: "center" }}>
          Nėra pridėtų pasiūlymo elementų. Naudokite mygtuką viršuje, kad pridėtumėte elementus.
        </Typography>
      )}

      {/* Accommodations */}
      {formData.accommodations.map((acc, accIndex) => (
        <AccommodationItem
          key={`acc-${accIndex}`}
          accommodation={acc}
          index={accIndex}
          formData={formData}
          handleAccommodationChange={handleAccommodationChange}
          handleAccommodationDateChange={handleAccommodationDateChange}
          handleRemoveAccommodation={handleRemoveAccommodation}
          timeErrors={timeErrors}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarSeverity={setSnackbarSeverity}
          setSnackbarOpen={setSnackbarOpen}
          isEditing={isEditing}
        />
      ))}

      {/* Transports */}
      {formData.transports.map((trans, transIndex) => (
        <TransportItem
          key={`trans-${transIndex}`}
          transport={trans}
          index={transIndex}
          formData={formData}
          handleTransportChange={handleTransportChange}
          handleTransportTimeChange={handleTransportTimeChange}
          handleRemoveTransport={handleRemoveTransport}
          timeErrors={timeErrors}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarSeverity={setSnackbarSeverity}
          setSnackbarOpen={setSnackbarOpen}
          isEditing={isEditing}
        />
      ))}

      {/* Cruises */}
      {formData.cruises.map((cruise, cruiseIndex) => (
        <CruiseItem
          key={`cruise-${cruiseIndex}`}
          cruise={cruise}
          index={cruiseIndex}
          formData={formData}
          handleCruiseChange={handleCruiseChange}
          handleCruiseTimeChange={handleCruiseTimeChange}
          handleRemoveCruise={handleRemoveCruise}
          timeErrors={timeErrors}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarSeverity={setSnackbarSeverity}
          setSnackbarOpen={setSnackbarOpen}
          isEditing={isEditing}
        />
      ))}
    </Paper>
  )
}

export default TripElementsSection
