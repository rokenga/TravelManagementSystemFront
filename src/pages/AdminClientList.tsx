"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { Box, Typography, Grid, Button, CircularProgress, useMediaQuery, useTheme } from "@mui/material"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import SearchBar from "../components/SearchBar"
import FilterMenu from "../components/FilterMenu"
import SortMenu from "../components/SortMenu"
import { FilterList } from "@mui/icons-material"
import ClientTagManager from "../components/ClientTagManager"
import ClientCard from "../components/ClientCard"
import CreateClientModal from "../components/CreateClientModal"

interface Client {
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  createdAt: Date
  notes?: string
  isOnTrip?: boolean
}

const AdminClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const navigate = useNavigate()
  const user = useContext(UserContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false) 

  useEffect(() => {
    fetchClients()
  }, [refreshTrigger])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await axios.get<Client[]>(`${API_URL}/Client`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClients(response.data)
    } catch (err: any) {
      console.error("Failed to fetch clients:", err)
      setError("Nepavyko gauti klientų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const filterSections = [
    {
      title: "Kelionės statusas",
      options: [
        {
          type: "checkbox" as const,
          label: "Kelionės statusas",
          options: ["Šiuo metu keliauja", "Nėra kelionėje"],
        },
      ],
    },
    {
      title: "Registracijos data",
      options: [
        {
          type: "checkbox" as const,
          label: "Registracijos laikotarpis",
          options: ["Šią savaitę", "Šį mėnesį", "Šiais metais"],
        },
      ],
    },
    {
      title: "Kelionių skaičius",
      options: [
        {
          type: "slider" as const,
          label: "Kelionių skaičius",
          range: [0, 20],
        },
      ],
    },
  ]

  const handleApplyFilters = (filters: any) => {
    console.log("Applied filters:", filters)
  }

  const filteredClients = clients.filter((client) =>
    `${client.name} ${client.surname}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const refreshClientTags = () => {
    setRefreshTrigger(prev => !prev) // 🔹 Toggle state to force refresh
  }

  const refreshClientList = () => {
    setRefreshTrigger((prev) => !prev) // ✅ Force refresh client list
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Klientų sąrašas
        </Typography>

        <SearchBar value={searchTerm} onChange={(value) => setSearchTerm(value)} placeholder="Ieškoti klientų..." />

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
              onClick={() => setIsClientModalOpen(true)} 
              sx={{ textTransform: "none" }}
            >
              Pridėti naują klientą
            </Button>

            <Button variant="outlined" color="secondary" onClick={() => setIsTagModalOpen(true)}>
              Tvarkyti žymeklius
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            {isMobile && (
              <Button variant="outlined" startIcon={<FilterList />} onClick={() => setIsFilterDrawerOpen(true)}>
                Filtrai
              </Button>
            )}
            <SortMenu options={["Vardas A-Z", "Vardas Z-A"]} onSort={() => {}} />
          </Box>
        </Box>
        <ClientTagManager open={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} onTagsUpdated={refreshClientTags} />

        <Box sx={{ display: "flex" }}>
          {!isMobile && (
            <FilterMenu
              sections={filterSections}
              onApplyFilters={handleApplyFilters}
              isOpen={isFilterDrawerOpen}
              onClose={() => setIsFilterDrawerOpen(false)}
            />
          )}
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" align="center">
                {error}
              </Typography>
            ) : filteredClients.length > 0 ? (
              <Grid container spacing={2}>
                {filteredClients.map((client) => (
                  <Grid item xs={12} key={client.id}>
                    <ClientCard client={client} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" align="center">
                Nėra sukurtų klientų.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <CreateClientModal
        open={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientCreated={refreshClientList} // ✅ Refresh list after creation
      />

      {isMobile && (
        <FilterMenu
          sections={filterSections}
          onApplyFilters={handleApplyFilters}
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
      )}
    </Box>
  )
}

export default AdminClientList

