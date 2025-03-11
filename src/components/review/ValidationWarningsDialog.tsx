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
} from "@mui/material"
import { Warning as WarningIcon, Info as InfoIcon } from "@mui/icons-material"
import type { ValidationWarning } from "../../types"

interface ValidationWarningsDialogProps {
  open: boolean
  onClose: () => void
  warnings: ValidationWarning[]
}

const ValidationWarningsDialog: React.FC<ValidationWarningsDialogProps> = ({ open, onClose, warnings }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "error.light", color: "error.contrastText" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon />
          <Typography variant="h6">Patikrinimo įspėjimai ({warnings.length})</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Šie įspėjimai netrukdo išsaugoti kelionės, tačiau gali reikėti atkreipti dėmesį:
        </Typography>

        <List>
          {warnings.map((warning, index) => (
            <ListItem
              key={index}
              sx={{
                borderLeft: "4px solid",
                borderColor: warning.type === "warning" ? "error.main" : "info.main",
                bgcolor: warning.type === "warning" ? "rgba(211, 47, 47, 0.08)" : "rgba(2, 136, 209, 0.08)",
                mb: 1,
                borderRadius: "4px",
              }}
            >
              <ListItemIcon>
                {warning.type === "warning" ? <WarningIcon color="error" /> : <InfoIcon color="info" />}
              </ListItemIcon>
              <ListItemText primary={warning.message} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Uždaryti
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ValidationWarningsDialog

