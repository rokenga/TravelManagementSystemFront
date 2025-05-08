"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "./CustomSnackBar"
import CloseIcon from "@mui/icons-material/Close"
import { Person, Warning } from "@mui/icons-material"

interface AgentResponse {
  id: string
  email: string
}

interface ReservationReassignmentWizardProps {
  open: boolean
  onClose: () => void
  reservationId: string
}

const ReservationReassignmentWizard: React.FC<ReservationReassignmentWizardProps> = ({
  open,
  onClose,
  reservationId,
}) => {
  // Stepper state
  const [activeStep, setActiveStep] = useState(0)
  const steps = ["Pasirinkite agentą", "Patvirtinkite veiksmą"]

  // Form state
  const [availableAgents, setAvailableAgents] = useState<AgentResponse[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [loadingAgents, setLoadingAgents] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")
  const [error, setError] = useState<string | null>(null)

  // Fetch available agents when the dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableAgents()
    }
  }, [open])

  // Reset state when the popup opens
  useEffect(() => {
    if (open) {
      setActiveStep(0)
      setSelectedAgentId("")
      setError(null)
    }
  }, [open])

  const fetchAvailableAgents = async () => {
    setLoadingAgents(true)
    setError(null)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await axios.get<AgentResponse[]>(`${API_URL}/Agent/all-agents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAvailableAgents(response.data)
    } catch (err) {
      console.error("Failed to fetch available agents:", err)
      setError("Nepavyko gauti agentų sąrašo. Bandykite dar kartą vėliau.")
    } finally {
      setLoadingAgents(false)
    }
  }

  // Handle step change
  const handleNext = () => {
    if (activeStep === 0 && !selectedAgentId) {
      setSnackbarMessage("Prašome pasirinkti agentą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  // Handle agent selection
  const handleAgentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAgentId(event.target.value)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedAgentId) {
      setSnackbarMessage("Prašome pasirinkti agentą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const token = localStorage.getItem("accessToken")
    const requestBody = {
      reservationId: reservationId,
      newAgentId: selectedAgentId,
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/Reservation/reassign`, requestBody, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
      })

      setSnackbarMessage("Rezervacija sėkmingai perduota kitam agentui!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      // Close after a short delay to show the success message
      setTimeout(() => {
        onClose()
        // Refresh the page to reflect changes
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error("Failed to reassign reservation:", error)
      // Handle different error response formats
      let errorMessage = "Nepavyko perduoti rezervacijos"

      if (error.response?.data) {
        // If the error data is an object with a Message property
        if (typeof error.response.data === "object" && error.response.data.Message) {
          errorMessage = error.response.data.Message
        }
        // If the error data is a string
        else if (typeof error.response.data === "string") {
          errorMessage = error.response.data
        }
      }

      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // Get selected agent details for confirmation page
  const getSelectedAgentDetails = () => {
    return availableAgents.find((agent) => agent.id === selectedAgentId)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "column" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Typography variant="h6">Rezervacijos perdavimas kitam agentui</Typography>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
          <Stepper activeStep={activeStep} sx={{ mt: 2, width: "100%" }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 ? (
            <Box sx={{ py: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Pasirinkite agentą, kuriam norite perduoti šią rezervaciją:
              </Typography>

              {loadingAgents ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : availableAgents.length === 0 ? (
                <Alert severity="warning">Nėra kitų agentų, kuriems būtų galima perduoti rezervaciją.</Alert>
              ) : (
                <RadioGroup aria-label="agents" name="agents" value={selectedAgentId} onChange={handleAgentSelection}>
                  <List sx={{ width: "100%" }}>
                    {availableAgents.map((agent) => (
                      <Paper
                        key={agent.id}
                        elevation={selectedAgentId === agent.id ? 3 : 1}
                        sx={{
                          mb: 2,
                          border: selectedAgentId === agent.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                          "&:hover": {
                            borderColor: "#bbdefb",
                          },
                        }}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: selectedAgentId === agent.id ? "primary.main" : "grey.400" }}>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight="bold">
                                {agent.email}
                              </Typography>
                            }
                          />
                          <FormControlLabel value={agent.id} control={<Radio />} label="" />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                </RadioGroup>
              )}
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  Dėmesio! Šis veiksmas negrįžtamas.
                </Typography>
                <Typography variant="body1">
                  Rezervacija bus perduota kitam agentui ir jūs nebegalėsite jos matyti ar valdyti.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Naujam agentui bus išsiųstas pranešimas el. paštu apie jam priskirtą rezervaciją.
                </Typography>
              </Alert>

              <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
                Pasirinktas agentas:
              </Typography>

              {getSelectedAgentDetails() && (
                <List sx={{ bgcolor: "#f5f5f5", borderRadius: 1, mb: 3 }}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          {getSelectedAgentDetails()?.email}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {activeStep === 0 ? (
            // Center the "Toliau" button in the first step
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedAgentId || loading || availableAgents.length === 0}
              >
                Toliau
              </Button>
            </Box>
          ) : (
            // Show Back and Confirm buttons in the second step
            <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <Button onClick={handleBack} disabled={loading} variant="outlined">
                Atgal
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || !selectedAgentId}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? "Vykdoma..." : "Patvirtinti perdavimą"}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  )
}

export default ReservationReassignmentWizard
