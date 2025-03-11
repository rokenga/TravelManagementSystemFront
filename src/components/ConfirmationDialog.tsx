import type React from "react"
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Box } from "@mui/material"
import { styled } from "@mui/system"

interface ConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "12px",
    padding: theme.spacing(2),
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  },
}))

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
}))

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "20px",
  padding: theme.spacing(1, 3),
}))

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, title, message, onConfirm, onCancel }) => {
  return (
    <StyledDialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <StyledDialogTitle>{title}</StyledDialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Box display="flex" justifyContent="space-between" width="100%" px={2} py={1}>
          <StyledButton onClick={onConfirm} variant="contained" color="primary">
            Patvirtinti
          </StyledButton>
          <StyledButton onClick={onCancel} variant="outlined">
            Atšaukti
          </StyledButton>
        </Box>
      </DialogActions>
    </StyledDialog>
  )
}

export default ConfirmationDialog

