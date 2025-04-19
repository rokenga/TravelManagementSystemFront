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
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import SearchBar from "../components/SearchBar"
import RegisterAgentForm from "../components/RegisterAgentForm"
import type { Agent } from "../types/AdminsAgent"
import { API_URL } from "../Utils/Configuration"
import { PersonAdd, Person, Email as EmailIcon, Close as CloseIcon, ArrowForward } from "@mui/icons-material"
import CustomSnackbar from "../components/CustomSnackBar"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"
import SortMenu from "../components/SortMenu"

const AdminAgentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>("Vardas A-Z")

  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await axios.get<Agent[]>(`${API_URL}/Agent`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      setAgents(response.data)
      // Calculate total pages (mock for pagination UI)
      setTotalPages(Math.ceil(response.data.length / pageSize))
    } catch (err: any) {
      console.error("Failed to fetch agents:", err)
      setError("Nepavyko gauti agentų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

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
    // Search functionality would be implemented here in a real app
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Page change functionality would be implemented here in a real app
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    // Page size change functionality would be implemented here in a real app
  }

  const handleSortChange = (option: string) => {
    setSortOption(option)
    // Sort functionality would be implemented here in a real app
  }

  // Filter agents by search term (client-side for demo)
  const filteredAgents = agents.filter(
    (agent) =>
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

            <SortMenu
              options={["Vardas A-Z", "Vardas Z-A", "Naujausi pirmi", "Seniausi pirmi"]}
              onSort={handleSortChange}
              value={sortOption}
            />
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
            ) : filteredAgents.length > 0 ? (
              <>
                <Grid container spacing={2}>
                  {filteredAgents.map((agent) => (
                    <Grid item xs={12} key={agent.id}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 3,
                          },
                        }}
                        onClick={() => handleAgentClick(agent.id)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                              <Person />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" noWrap>
                                {agent.firstName} {agent.lastName}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <EmailIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {agent.email}
                                </Typography>
                              </Box>
                            </Box>
                            <Tooltip title="Peržiūrėti detales">
                              <ArrowForward color="action" />
                            </Tooltip>
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
                  Nėra rastų agentų. Sukurkite naują agentą paspaudę mygtuką "Naujas agentas".
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
    </Box>
  )
}

export default AdminAgentList
