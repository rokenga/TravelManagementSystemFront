import type React from "react"
import { Snackbar, Alert, type AlertColor } from "@mui/material"
import { styled } from "@mui/system"

interface CustomSnackbarProps {
  open: boolean
  message: string
  severity: AlertColor
  onClose: () => void
}

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  borderLeft: `4px solid ${severity === "success" ? theme.palette.success.main : theme.palette.error.main}`,
  backgroundColor: severity === "success" ? "#e8f5e9" : "#ffebee",
  color: theme.palette.text.primary,
  "& .MuiAlert-icon": {
    color: severity === "success" ? theme.palette.success.main : theme.palette.error.main,
  },
}))

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <StyledAlert onClose={onClose} severity={severity} variant="filled">
        {message}
      </StyledAlert>
    </Snackbar>
  )
}

export default CustomSnackbar

