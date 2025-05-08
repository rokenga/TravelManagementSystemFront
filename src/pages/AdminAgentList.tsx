"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Card,
  CardContent,
  Divider,
  IconButton,
  Avatar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import SearchBar from "../components/SearchBar"
import RegisterAgentForm from "../components/RegisterAgentForm"
import type { Agent } from "../types/AdminsAgent"
import type { AgentQueryParams } from "../types/AdminsAgent"
import type { PaginatedResponse } from "../types/Pagination"
import { API_URL } from "../Utils/Configuration"
import { PersonAdd, Email as EmailIcon, Close as CloseIcon, Person } from "@mui/icons-material"
import CustomSnackbar from "../components/CustomSnackBar"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"

const AdminAgentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)

  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Create a function to get initials from name and surname with null checks
  const getInitials = (firstName?: string, lastName?: string): string => {
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : ""
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : ""

    if (firstInitial || lastInitial) {
      return `${firstInitial}${lastInitial}`
    }

    // Fallback if both are empty
    return "?"
  }

  // Create a function to get a consistent color based on name with null checks
  const getAvatarColor = (name?: string): string => {
    const colors = [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
      "#03A9F4",
      "#00BCD4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFC107",
      "#FF9800",
      "#FF5722",
    ]

    if (!name || name.length === 0) {
      return colors[0] // Default color if name is empty
    }

    // Simple hash function to get a consistent color
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  const fetchAgents = async () => {
    try {
      setLoading(true)

      const queryParams: AgentQueryParams = {
        pageNumber: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm.trim() || undefined,
      }

      const response = await axios.post<PaginatedResponse<Agent>>(`${API_URL}/Agent/search`, queryParams, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setAgents(response.data.items)
      setTotalPages(Math.ceil(response.data.totalCount / pageSize))
    } catch (err: any) {
      console.error("Failed to fetch agents:", err)
      setError("Nepavyko gauti agentų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  // Use effect to fetch agents when page, pageSize or searchTerm changes
  useEffect(() => {
    fetchAgents()
  }, [currentPage, pageSize, searchTerm])

  const handleAgentClick = (id: string) => {
    navigate(`/agents/${id}`)
  }

  const handleAgentSuccess = () => {
    setSnackbar({
      open: true,
      message: "Agentas sėkmingai užregistruotas!",
      severity: "success",
    })
    fetchAgents()
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Agentų sąrašas
        </Typography>

        <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Ieškoti agentų..." />

        <Box
          sx={{
            mt: 2,
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsModalOpen(true)}
              startIcon={<PersonAdd />}
              sx={{ textTransform: "none" }}
            >
              Naujas agentas
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} options={[25, 50, 100]} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : agents.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {agents.map((agent) => (
                    <Grid item xs={12} key={agent.id}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 3,
                          },
                        }}
                        onClick={() => handleAgentClick(agent.id)}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: getAvatarColor(`${agent.firstName || ""} ${agent.lastName || ""}`),
                                mr: 2,
                                width: 40,
                                height: 40,
                                fontSize: "1rem",
                              }}
                            >
                              {agent.firstName || agent.lastName ? (
                                getInitials(agent.firstName, agent.lastName)
                              ) : (
                                <Person />
                              )}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, ml: "0.5px" }}>
                                  {agent.firstName || agent.lastName
                                    ? `${agent.firstName || ""} ${agent.lastName || ""}`
                                    : "Nežinomas agentas"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <EmailIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {agent.email || "Nėra el. pašto"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination Controls */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 3,
                  }}
                >
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </Box>
              </>
            ) : (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm
                    ? "Nėra rastų agentų pagal jūsų paiešką."
                    : 'Nėra rastų agentų. Sukurkite naują agentą paspaudę mygtuką "Naujas agentas".'}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>

      {/* Register Agent Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PersonAdd sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h6">Naujo agento registracija</Typography>
          </Box>
          <IconButton onClick={() => setIsModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <RegisterAgentForm onClose={() => setIsModalOpen(false)} onSuccess={handleAgentSuccess} />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </Box>
  )
}

export default AdminAgentList
