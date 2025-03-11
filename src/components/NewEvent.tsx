import React from 'react'
import { Grid, TextField, IconButton, MenuItem } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

interface EventFormProps {
  event: any
  onChange: (field: string, value: any) => void
  onDelete: () => void
}

/**
 * Example modular event editing form. The UI is in Lithuanian. 
 * Type can be "transport", "accommodation", "activity", or ""
 */
const EventForm: React.FC<EventFormProps> = ({ event, onChange, onDelete }) => {
  const renderAdditionalFields = () => {
    switch (event.type) {
      case 'transport':
        return (
          <>
            <Grid item xs={6} md={6}>
              <TextField
                label="Transporto tipas"
                value={event.transportType || ''}
                onChange={(e) => onChange('transportType', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Išvykimo laikas"
                type="datetime-local"
                value={event.departureTime || ''}
                onChange={(e) => onChange('departureTime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Atvykimo laikas"
                type="datetime-local"
                value={event.arrivalTime || ''}
                onChange={(e) => onChange('arrivalTime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                label="Išvykimo vieta"
                value={event.departurePlace || ''}
                onChange={(e) => onChange('departurePlace', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                label="Atvykimo vieta"
                value={event.arrivalPlace || ''}
                onChange={(e) => onChange('arrivalPlace', e.target.value)}
                fullWidth
              />
            </Grid>
          </>
        )

      case 'accommodation':
        return (
          <>
            <Grid item xs={6}>
              <TextField
                label="Viešbučio pavadinimas"
                value={event.hotelName || ''}
                onChange={(e) => onChange('hotelName', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Įsiregistravimo laikas"
                type="datetime-local"
                value={event.checkIn || ''}
                onChange={(e) => onChange('checkIn', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Išsiregistravimo laikas"
                type="datetime-local"
                value={event.checkOut || ''}
                onChange={(e) => onChange('checkOut', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )

      case 'activity':
        return (
          <>
            <Grid item xs={6}>
              <TextField
                label="Veiklos laikas"
                type="datetime-local"
                value={event.activityTime || ''}
                onChange={(e) => onChange('activityTime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Aprašymas"
                value={event.description || ''}
                onChange={(e) => onChange('description', e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
      {/* Event Type */}
      <Grid item xs={6} md={3}>
        <TextField
          select
          label="Veiklos tipas"
          value={event.type || ''}
          onChange={(e) => onChange('type', e.target.value)}
          fullWidth
        >
          <MenuItem value="">--Pasirinkite--</MenuItem>
          <MenuItem value="transport">Transportas</MenuItem>
          <MenuItem value="accommodation">Nakvynė</MenuItem>
          <MenuItem value="activity">Veikla</MenuItem>
        </TextField>
      </Grid>

      {/* Additional fields, depending on event type */}
      {renderAdditionalFields()}

      {/* Delete button */}
      <Grid item xs={1} md={1}>
        <IconButton onClick={onDelete} color="error">
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  )
}

export default EventForm
