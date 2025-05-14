"use client"

import type React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Checkbox,
  useTheme,
} from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"
import type { ValidationWarning } from "../../../types"
import { useState, useEffect } from "react"

interface ValidationWarningsDialogProps {
  open: boolean
  onClose: () => void
  warnings: ValidationWarning[]
  hideHighlighting: boolean
  onHideHighlightingChange: (hide: boolean) => void
}

const ValidationWarningsDialog: React.FC<ValidationWarningsDialogProps> = ({
  open,
  onClose,
  warnings,
  hideHighlighting,
  onHideHighlightingChange,
}) => {
  const theme = useTheme()

  const [localHideHighlighting, setLocalHideHighlighting] = useState(hideHighlighting)

  useEffect(() => {
    if (open) {
      setLocalHideHighlighting(hideHighlighting)
    }
  }, [hideHighlighting, open])

  const handleCheckboxChange = () => {
    const newValue = !localHideHighlighting
    setLocalHideHighlighting(newValue)
  }

  const handleClose = () => {
    onHideHighlightingChange(localHideHighlighting)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "rgba(255, 167, 38, 0.15)", color: "text.primary", py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6" fontWeight="medium">
            Patikrinimo pastabos ({warnings.length})
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Šios pastabos netrukdo išsaugoti kelionės, tačiau rekomenduojame jas peržiūrėti:
        </Typography>

        <List>
          {warnings.map((warning, index) => (
            <ListItem
              key={index}
              sx={{
                mb: 1,
                borderRadius: "4px",
                bgcolor: "rgba(255, 167, 38, 0.05)",
                transition: "background-color 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: "rgba(255, 167, 38, 0.1)",
                },
              }}
            >
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary={warning.message} primaryTypographyProps={{ fontWeight: "medium" }} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 3, bgcolor: "rgba(0, 0, 0, 0.02)", p: 2, borderRadius: 1 }}>
          <FormControlLabel
            control={<Checkbox checked={localHideHighlighting} onChange={handleCheckboxChange} color="primary" />}
            label="Nebenoriu matyti įspėjimų paryškinimų kelionės peržiūroj (įspėjimų mygtukas liks matomas)"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="primary" variant="contained" size="large">
          Supratau
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ValidationWarningsDialog
