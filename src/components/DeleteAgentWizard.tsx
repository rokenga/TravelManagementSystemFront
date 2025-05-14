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
  FormGroup,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
} from "@mui/material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "./CustomSnackBar"
import CloseIcon from "@mui/icons-material/Close"
import { Person, Warning } from "@mui/icons-material"

interface AgentReassignmentOption {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  clientCount: number
  tripCount: number
}

interface DeleteAgentWizardProps {
  open: boolean
  onClose: () => void
  agentId: string
  agentName: string
}

interface DeleteAgentRequest {
  agentIdToDelete: string
  targetAgentIds: string[]
}

const DeleteAgentWizard: React.FC<DeleteAgentWizardProps> = ({ open, onClose, agentId, agentName }) => {
  const [activeStep, setActiveStep] = useState(0)
  const steps = ["Pasirinkite agentus", "Patvirtinkite veiksmą"]

  const [availableAgents, setAvailableAgents] = useState<AgentReassignmentOption[]>([])
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)

  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("error")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && agentId) {
      fetchAvailableAgents()
    }
  }, [open, agentId])

  useEffect(() => {
    if (open) {
      setActiveStep(0)
      setSelectedAgentIds([])
      setError(null)
    }
  }, [open])

  const fetchAvailableAgents = async () => {
    setLoadingAgents(true)
    setError(null)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await axios.get<AgentReassignmentOption[]>(`${API_URL}/Agent/${agentId}/reassignment`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAvailableAgents(response.data)
    } catch (err) {
      setError("Nepavyko gauti agentų sąrašo. Bandykite dar kartą vėliau.")
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleNext = () => {
    if (activeStep === 0 && selectedAgentIds.length === 0) {
      setSnackbarMessage("Prašome pasirinkti bent vieną agentą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prevSelected) => {
      if (prevSelected.includes(agentId)) {
        return prevSelected.filter((id) => id !== agentId)
      } else {
        return [...prevSelected, agentId]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedAgentIds.length === 0) {
      setSnackbarMessage("Prašome pasirinkti bent vieną agentą")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    const token = localStorage.getItem("accessToken")
    const requestBody: DeleteAgentRequest = {
      agentIdToDelete: agentId,
      targetAgentIds: selectedAgentIds,
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/agent/delete-agent`, requestBody, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSnackbarMessage("Agentas sėkmingai ištrintas!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)

      setTimeout(() => {
        onClose()
        window.location.href = "/agents"
      }, 1500)
    } catch (error: any) {
      setSnackbarMessage(error.response?.data?.message || "Nepavyko ištrinti agento")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedAgentsDetails = () => {
    return availableAgents.filter((agent) => selectedAgentIds.includes(agent.id))
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "column" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Typography variant="h6">Agento ištrynimas</Typography>
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
                Pasirinkite agentus, kuriems bus priskirti agento <strong>{agentName}</strong> klientai:
              </Typography>

              {loadingAgents ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : availableAgents.length === 0 ? (
                <Alert severity="warning">
                  Nėra kitų agentų, kuriems būtų galima priskirti klientus. Prieš ištrinant šį agentą, sukurkite naują
                  agentą.
                </Alert>
              ) : (
                <List sx={{ width: "100%" }}>
                  {availableAgents.map((agent) => (
                    <Paper
                      key={agent.id}
                      elevation={selectedAgentIds.includes(agent.id) ? 3 : 1}
                      sx={{
                        mb: 2,
                        border: selectedAgentIds.includes(agent.id) ? "2px solid #1976d2" : "1px solid #e0e0e0",
                        "&:hover": {
                          borderColor: "#bbdefb",
                        },
                      }}
                    >
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: selectedAgentIds.includes(agent.id) ? "primary.main" : "grey.400" }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {agent.firstName && agent.lastName
                                  ? `${agent.firstName} ${agent.lastName}`
                                  : agent.email}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span" display="block">
                                {agent.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span">
                                Klientų: {agent.clientCount} | Kelionių: {agent.tripCount}
                              </Typography>
                            </>
                          }
                        />
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedAgentIds.includes(agent.id)}
                                onChange={() => handleAgentSelection(agent.id)}
                              />
                            }
                            label=""
                          />
                        </FormGroup>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  Dėmesio! Šis veiksmas negrįžtamas.
                </Typography>
                <Typography variant="body1">
                  Agentas <strong>{agentName}</strong> bus ištrintas, o jo klientai bus priskirti pasirinktiems
                  agentams.
                </Typography>
              </Alert>

              <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
                Pasirinkti agentai:
              </Typography>

              <List sx={{ bgcolor: "#f5f5f5", borderRadius: 1, mb: 3 }}>
                {getSelectedAgentsDetails().map((agent) => (
                  <ListItem key={agent.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          {agent.firstName && agent.lastName ? `${agent.firstName} ${agent.lastName}` : agent.email}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {agent.email}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {activeStep === 0 ? (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={selectedAgentIds.length === 0 || loading || availableAgents.length === 0}
              >
                Toliau
              </Button>
            </Box>
          ) : (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <Button onClick={handleBack} disabled={loading} variant="outlined">
                Atgal
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleSubmit}
                disabled={loading || selectedAgentIds.length === 0}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? "Vykdoma..." : "Ištrinti agentą"}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  )
}

export default DeleteAgentWizard
