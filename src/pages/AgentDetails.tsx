"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { Box, Tabs, Tab, Typography, CircularProgress, Paper, Alert } from "@mui/material"
import { useParams, useNavigate } from "react-router-dom"
import AgentCard from "../components/AgentCard"
import ClientsTable from "../components/ClientsTable"
import TripsTable from "../components/TripsTable"
import type { Agent } from "../types/AdminsAgent"
import type { ClientResponse } from "../types/Client"
import type { TripResponse } from "../types/ClientTrip"
import { API_URL } from "../Utils/Configuration"

const AgentDetails: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(0)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [clients, setClients] = useState<ClientResponse[]>([])
  const [trips, setTrips] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState<{ [key: number]: boolean }>({
    0: true, // Clients tab
    1: false, // Trips tab
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgentDetails()
  }, [agentId])

  // Load clients data when component mounts
  useEffect(() => {
    if (agent) {
      fetchClients()
    }
  }, [agent])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      const agentResponse = await axios.get<Agent>(`${API_URL}/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setAgent(agentResponse.data)
    } catch (err) {
      setError("Nepavyko gauti agento informacijos.")
      console.error("Error fetching agent details:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      setTabsLoading((prev) => ({ ...prev, 0: true }))
      const response = await axios.get<ClientResponse[]>(`${API_URL}/agent/${agentId}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClients(response.data)
    } catch (err) {
      console.error("Failed to fetch clients:", err)
    } finally {
      setTabsLoading((prev) => ({ ...prev, 0: false }))
    }
  }

  const fetchTrips = async () => {
    try {
      setTabsLoading((prev) => ({ ...prev, 1: true }))
      const response = await axios.get<TripResponse[]>(`${API_URL}/agent/${agentId}/trips`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setTrips(response.data)
    } catch (err) {
      console.error("Failed to fetch trips:", err)
    } finally {
      setTabsLoading((prev) => ({ ...prev, 1: false }))
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (newValue === 1 && trips.length === 0) fetchTrips()
  }

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`)
  }

  const handleTripClick = (tripId: string) => {
    navigate(`/admin-trip-list/${tripId}`)
  }

  return (
    <Box sx={{ width: "100%", p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
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
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}>
              Agento informacija
            </Typography>
            <AgentCard agent={agent} />
          </Paper>

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
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  py: 2,
                },
                "& .Mui-selected": {
                  color: "white",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "secondary.main",
                  height: 3,
                },
              }}
            >
              <Tab label="Klientai" />
              <Tab label="Kelionės" />
              <Tab label="Spec. pasiūlymai" />
              <Tab label="Naujienlaiškis" />
            </Tabs>

            <Box sx={{ p: 3, backgroundColor: "white" }}>
              {activeTab === 0 &&
                (tabsLoading[0] ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ClientsTable clients={clients} onClientClick={handleClientClick} />
                ))}

              {activeTab === 1 &&
                (tabsLoading[1] ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TripsTable trips={trips} onTripClick={handleTripClick} />
                ))}

              {activeTab === 2 && (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6">Čia bus specialūs pasiūlymai.</Typography>
                </Box>
              )}

              {activeTab === 3 && (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6">Čia bus naujienlaiškio turinys.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="error">Agentas nerastas.</Alert>
      )}
    </Box>
  )
}

export default AgentDetails

