"use client"

import type React from "react"
import { Grid, TextField, Typography, MenuItem } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import DestinationAutocomplete from "../../DestinationAutocomplete"
import OfferImageUpload from "../../ClientOfferWizard/OfferImageUpload"
import type { PublicOfferWizardData } from "../CreatePublicOfferWizardForm"

interface TripBasicInfoFormProps {
  formData: PublicOfferWizardData
  handleInputChange: (name: string, value: any) => void
  handleDateChange: (field: "startDate" | "endDate" | "validUntil", newValue: any) => void
  handleImageChange: (files: File[]) => void
  handleExistingImageDelete: (imageId: string) => void
  dateError: string | null
  validUntilError: string | null
  isEditing: boolean
}

const TripBasicInfoForm: React.FC<TripBasicInfoFormProps> = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleImageChange,
  handleExistingImageDelete,
  dateError,
  validUntilError,
  isEditing,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Kelionės pavadinimas"
          name="tripName"
          value={formData.tripName}
          onChange={(e) => handleInputChange("tripName", e.target.value)}
          inputProps={{ maxLength: 150 }}
          helperText={`${formData.tripName.length}/150 simbolių`}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DestinationAutocomplete
          value={formData.destination ? { code: "", name: formData.destination } : null}
          onChange={(country) => handleInputChange("destination", country?.name || "")}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          select
          label="Kelionės kategorija"
          value={formData.category}
          onChange={(e) => handleInputChange("category", e.target.value)}
          fullWidth
        >
          <MenuItem value="">--Nepasirinkta--</MenuItem>
          <MenuItem value="Tourist">Pažintinė</MenuItem>
          <MenuItem value="Group">Grupinė</MenuItem>
          <MenuItem value="Relax">Poilsinė</MenuItem>
          <MenuItem value="Business">Verslo</MenuItem>
          <MenuItem value="Cruise">Kruizas</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} md={4}>
        <DatePicker
          label="Kelionės pradžia"
          value={formData.startDate}
          onChange={(newDate) => handleDateChange("startDate", newDate)}
          slotProps={{ textField: { fullWidth: true } }}
          disablePast={!isEditing} 
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <DatePicker
          label="Kelionės pabaiga"
          value={formData.endDate}
          onChange={(newDate) => handleDateChange("endDate", newDate)}
          slotProps={{ textField: { fullWidth: true } }}
          disablePast={!isEditing} 
        />
        {dateError && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
            {dateError}
          </Typography>
        )}
      </Grid>

      <Grid item xs={12} md={4}>
        <DatePicker
          label="Galioja iki"
          value={formData.validUntil}
          onChange={(newDate) => handleDateChange("validUntil", newDate)}
          slotProps={{
            textField: { fullWidth: true },
          }}
          disablePast={!isEditing} 
        />
        {validUntilError && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
            {validUntilError}
          </Typography>
        )}
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Suaugusių skaičius"
          type="number"
          value={formData.adultCount}
          onChange={(e) => handleInputChange("adultCount", Number(e.target.value))}
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Vaikų skaičius"
          type="number"
          value={formData.childrenCount}
          onChange={(e) => handleInputChange("childrenCount", Number(e.target.value))}
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Aprašymas"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Pasiūlymo nuotraukos
        </Typography>
        <OfferImageUpload
          images={formData.images}
          onImageChange={handleImageChange}
          existingImages={formData.existingImages || []}
          onExistingImageDelete={handleExistingImageDelete}
        />
      </Grid>
    </Grid>
  )
}

export default TripBasicInfoForm
