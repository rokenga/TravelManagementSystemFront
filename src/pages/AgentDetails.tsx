"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { Box, Tabs, Tab, CircularProgress, Paper, Alert } from "@mui/material"
import { useParams, useNavigate } from "react-router-dom"
import AgentCard from "../components/AgentCard"
import AgentSummaryCards from "../components/AgentSummaryCards"
import ClientsTable from "../components/ClientsTable"
import TripsTable from "../components/TripsTable"
import SpecialOffersTable from "../components/SpecialOffersTable"
import ActionBar from "../components/ActionBar"
import PaginatedTableWrapper from "../components/PaginatedTableWrapper"
import DeleteAgentWizard from "../components/DeleteAgentWizard"
import type { Agent } from "../types/AdminsAgent"
import type { ClientResponse } from "../types/Client"
import type { TripResponse } from "../types/ClientTrip"
import { API_URL } from "../Utils/Configuration"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"

// Define the PaginatedResponse interface
interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const AgentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(0)
  const [agent, setAgent] = useState<Agent | null>(null)

  // Update state to store paginated responses
  const [clientsData, setClientsData] = useState<PaginatedResponse<ClientResponse> | null>(null)
  const [tripsData, setTripsData] = useState<PaginatedResponse<TripResponse> | null>(null)
  const [offersData, setOffersData] = useState<PaginatedResponse<TripResponse> | null>(null)

  // Pagination state for each tab
  const [clientsPage, setClientsPage] = useState(1)
  const [clientsPageSize, setClientsPageSize] = useState(25)
  const [tripsPage, setTripsPage] = useState(1)
  const [tripsPageSize, setTripsPageSize] = useState(25)
  const [offersPage, setOffersPage] = useState(1)
  const [offersPageSize, setOffersPageSize] = useState(25)

  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState<{ [key: number]: boolean }>({
    0: true, // Clients tab
    1: false, // Trips tab
    2: false, // Special offers tab
  })
  const [error, setError] = useState<string | null>(null)
  const [tabErrors, setTabErrors] = useState<{ [key: number]: string | null }>({
    0: null, // Clients tab
    1: null, // Trips tab
    2: null, // Special offers tab
  })
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [deleteWizardOpen, setDeleteWizardOpen] = useState(false)

  const [reset2FAConfirmDialogOpen, setReset2FAConfirmDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })
  const [resetting2FA, setResetting2FA] = useState(false)

  useEffect(() => {
    fetchAgentDetails()
  }, [id])

  // Load clients data when component mounts or when pagination changes
  useEffect(() => {
    if (agent && activeTab === 0) {
      fetchClients(clientsPage, clientsPageSize)
    }
  }, [agent, activeTab, clientsPage, clientsPageSize])

  // Load trips data when tab changes or pagination changes
  useEffect(() => {
    if (agent && activeTab === 1) {
      fetchTrips(tripsPage, tripsPageSize)
    }
  }, [agent, activeTab, tripsPage, tripsPageSize])

  // Load offers data when tab changes or pagination changes
  useEffect(() => {
    if (agent && activeTab === 2) {
      fetchOffers(offersPage, offersPageSize)
    }
  }, [agent, activeTab, offersPage, offersPageSize])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      const agentResponse = await axios.get<Agent>(`${API_URL}/agent/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      // Map backend response to our Agent interface
      const agentData = {
        ...agentResponse.data,
        // Map the backend field names to our interface field names if needed
        newTripsThisMonth: agentResponse.data.newClientTripsThisMonth,
        totalRevenue: agentResponse.data.thisMonthsRevenue || 0, // Fallback for compatibility
      }

      setAgent(agentData)
    } catch (err) {
      setError("Nepavyko gauti agento informacijos.")
      console.error("Error fetching agent details:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async (page: number, pageSize: number) => {
    try {
      setTabsLoading((prev) => ({ ...prev, 0: true }))
      setTabErrors((prev) => ({ ...prev, 0: null }))

      const response = await axios.get<PaginatedResponse<ClientResponse>>(
        `${API_URL}/agent/${id}/clients?page=${page}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )
      setClientsData(response.data)
    } catch (err) {
      console.error("Failed to fetch clients:", err)
      setTabErrors((prev) => ({ ...prev, 0: "Nepavyko gauti klientų sąrašo." }))
    } finally {
      setTabsLoading((prev) => ({ ...prev, 0: false }))
    }
  }

  const fetchTrips = async (page: number, pageSize: number) => {
    try {
      setTabsLoading((prev) => ({ ...prev, 1: true }))
      setTabErrors((prev) => ({ ...prev, 1: null }))

      const response = await axios.get<PaginatedResponse<TripResponse>>(
        `${API_URL}/agent/${id}/client-trips?page=${page}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )
      setTripsData(response.data)
    } catch (err) {
      console.error("Failed to fetch trips:", err)
      setTabErrors((prev) => ({ ...prev, 1: "Nepavyko gauti kelionių sąrašo." }))
    } finally {
      setTabsLoading((prev) => ({ ...prev, 1: false }))
    }
  }

  const fetchOffers = async (page: number, pageSize: number) => {
    try {
      setTabsLoading((prev) => ({ ...prev, 2: true }))
      setTabErrors((prev) => ({ ...prev, 2: null }))

      const response = await axios.get<PaginatedResponse<TripResponse>>(
        `${API_URL}/agent/${id}/client-offers?page=${page}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )
      setOffersData(response.data)
    } catch (err) {
      console.error("Failed to fetch offers:", err)
      setTabErrors((prev) => ({ ...prev, 2: "Nepavyko gauti specialių pasiūlymų sąrašo." }))
    } finally {
      setTabsLoading((prev) => ({ ...prev, 2: false }))
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)

    // Load data for the selected tab if it hasn't been loaded yet
    if (newValue === 0 && !clientsData) {
      fetchClients(clientsPage, clientsPageSize)
    } else if (newValue === 1 && !tripsData) {
      fetchTrips(tripsPage, tripsPageSize)
    } else if (newValue === 2 && !offersData) {
      fetchOffers(offersPage, offersPageSize)
    }
  }

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`)
  }

  const handleTripClick = (tripId: string) => {
    navigate(`/admin-trip-list/${tripId}`)
  }

  const handleOfferClick = (offerId: string) => {
    navigate(`/admin-offer-list/${offerId}`)
  }

  const handleBackClick = () => {
    navigate("/agents")
  }

  const handleDeleteClick = () => {
    setDeleteConfirmDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    setDeleteConfirmDialogOpen(false)
    setDeleteWizardOpen(true)
  }

  const getAgentFullName = () => {
    if (!agent) return ""
    return `${agent.firstName || ""} ${agent.lastName || ""}`.trim() || agent.email
  }

  // Handlers for pagination
  const handleClientsPageChange = (page: number) => {
    setClientsPage(page)
  }

  const handleClientsPageSizeChange = (pageSize: number) => {
    setClientsPageSize(pageSize)
    setClientsPage(1) // Reset to first page when changing page size
  }

  const handleTripsPageChange = (page: number) => {
    setTripsPage(page)
  }

  const handleTripsPageSizeChange = (pageSize: number) => {
    setTripsPageSize(pageSize)
    setTripsPage(1) // Reset to first page when changing page size
  }

  const handleOffersPageChange = (page: number) => {
    setOffersPage(page)
  }

  const handleOffersPageSizeChange = (pageSize: number) => {
    setOffersPageSize(pageSize)
    setOffersPage(1) // Reset to first page when changing page size
  }

  const handleReset2FAClick = () => {
    setReset2FAConfirmDialogOpen(true)
  }

  // Add handler for reset 2FA confirmation
  const handleReset2FAConfirm = async () => {
    if (!id) return

    setResetting2FA(true)
    try {
      await axios.post(
        `${API_URL}/Auth/disable-2fa/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )

      setSnackbar({
        open: true,
        message: "2FA sėkmingai atstatyta agentui.",
        severity: "success",
      })
    } catch (err) {
      console.error("Failed to reset 2FA:", err)
      setSnackbar({
        open: true,
        message: "Nepavyko atstatyti 2FA. Bandykite dar kartą vėliau.",
        severity: "error",
      })
    } finally {
      setResetting2FA(false)
      setReset2FAConfirmDialogOpen(false)
    }
  }

  // Add handler for snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box sx={{ width: "100%", p: 3, minHeight: "100vh" }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : agent ? (
        <>
          <ActionBar
            showBackButton={true}
            showDeleteButton={true}
            showReset2FAButton={true}
            onBackClick={handleBackClick}
            onDelete={handleDeleteClick}
            onReset2FA={handleReset2FAClick}
            backUrl="/agents"
          />

          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <AgentCard agent={agent} />
          </Paper>

          {/* Add the new summary cards */}
          <Box sx={{ mb: 4 }}>
            <AgentSummaryCards agent={agent} />
          </Box>

          <Paper sx={{ borderRadius: 2, boxShadow: 3, overflow: "hidden" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "primary.main",
                "& .MuiTab-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  fontWeight: "medium",
                  fontSize: "1rem",
                  py: 2,
                },
                "& .Mui-selected": {
                  color: "white !important",
                  fontWeight: "bold",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "white",
                  height: 3,
                },
              }}
            >
              <Tab label="Klientai" />
              <Tab label="Kelionės" />
              <Tab label="Spec. pasiūlymai" />
            </Tabs>

            <Box sx={{ p: 3, backgroundColor: "white" }}>
              {activeTab === 0 && (
                <PaginatedTableWrapper
                  data={clientsData}
                  title="Klientai"
                  renderTable={(items) => <ClientsTable clients={items} onClientClick={handleClientClick} />}
                  onPageChange={handleClientsPageChange}
                  onPageSizeChange={handleClientsPageSizeChange}
                  loading={tabsLoading[0]}
                  error={tabErrors[0]}
                />
              )}

              {activeTab === 1 && (
                <PaginatedTableWrapper
                  data={tripsData}
                  title="Kelionės"
                  renderTable={(items) => <TripsTable trips={items} onTripClick={handleTripClick} />}
                  onPageChange={handleTripsPageChange}
                  onPageSizeChange={handleTripsPageSizeChange}
                  loading={tabsLoading[1]}
                  error={tabErrors[1]}
                />
              )}

              {activeTab === 2 && (
                <PaginatedTableWrapper
                  data={offersData}
                  title="Specialūs pasiūlymai"
                  renderTable={(items) => <SpecialOffersTable offers={items} onOfferClick={handleOfferClick} />}
                  onPageChange={handleOffersPageChange}
                  onPageSizeChange={handleOffersPageSizeChange}
                  loading={tabsLoading[2]}
                  error={tabErrors[2]}
                />
              )}
            </Box>
          </Paper>

          {/* Initial Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteConfirmDialogOpen}
            title="Ištrinti agentą"
            message={`Ar tikrai norite ištrinti agentą ${getAgentFullName()}? Šio veiksmo negalėsite atšaukti.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmDialogOpen(false)}
          />

          {/* Delete Agent Wizard */}
          <DeleteAgentWizard
            open={deleteWizardOpen}
            onClose={() => setDeleteWizardOpen(false)}
            agentId={id || ""}
            agentName={getAgentFullName()}
          />

          {/* Reset 2FA Confirmation Dialog */}
          <ConfirmationDialog
            open={reset2FAConfirmDialogOpen}
            title="Atstatyti 2FA"
            message={`Ar tikrai norite atstatyti dviejų faktorių autentifikaciją agentui ${getAgentFullName()}? Agentas turės iš naujo nustatyti 2FA prisijungęs.`}
            onConfirm={handleReset2FAConfirm}
            onCancel={() => setReset2FAConfirmDialogOpen(false)}
          />

          {/* Snackbar for notifications */}
          <CustomSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={handleSnackbarClose}
          />
        </>
      ) : (
        <Alert severity="error">Agentas nerastas.</Alert>
      )}
    </Box>
  )
}

export default AgentDetails
