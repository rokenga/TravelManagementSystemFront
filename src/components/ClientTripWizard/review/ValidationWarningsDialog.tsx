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
} from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"
import type { ValidationWarning } from "../../../types"

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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "rgba(255, 167, 38, 0.15)", color: "text.primary" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon />
          <Typography variant="h6">Patikrinimo pastabos ({warnings.length})</Typography>
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
                transition: "background-color 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary={warning.message} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hideHighlighting}
                onChange={(e) => onHideHighlightingChange(e.target.checked)}
                color="primary"
              />
            }
            label="Nebenoriu matyti įspėjimų paryškinimų kelionės peržiūroj (įspėjimų mygtukas liks matomas)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Supratau
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ValidationWarningsDialog

