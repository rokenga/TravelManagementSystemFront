"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { UserContext } from "../contexts/UserContext"
import type { TripResponse } from "../types/ClientTrip"
import { Box, Typography, Grid, Button, CircularProgress, Menu, MenuItem, useMediaQuery, useTheme } from "@mui/material"
import { FilterList, KeyboardArrowDown } from "@mui/icons-material"
import FilterMenu from "../components/FilterMenu"
import SearchBar from "../components/SearchBar"
import SortMenu from "../components/SortMenu"
import TripSummaryCard from "../components/TripSummaryCard"

const AdminTripList: React.FC = () => {
  const [trips, setTrips] = useState<TripResponse[]>([])
  const [filteredTrips, setFilteredTrips] = useState<TripResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const user = useContext(UserContext)
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true)
        const response = await axios.get<TripResponse[]>(`${API_URL}/client-trips`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setTrips(response.data)
        setFilteredTrips(response.data)
      } catch (err: any) {
        console.error("Failed to fetch trips:", err)
        setError(err.response?.data?.message || "Nepavyko gauti kelionių sąrašo.")
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [token])

  // Filtering logic
  useEffect(() => {
    let updatedTrips = trips

    if (searchTerm) {
      updatedTrips = updatedTrips.filter((trip) => trip.tripName?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredTrips(updatedTrips)
  }, [searchTerm, trips])

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleTripClick = (id: string) => {
    navigate(`/trips/${id}`)
  }

  const filterSections = [
    {
      title: "Kelionės kategorija",
      options: [
        {
          type: "checkbox" as const,
          label: "Pasirinkite kategoriją",
          options: ["Turistinė", "Grupinė", "Poilsinė", "Verslo", "Kruizas"],
        },
      ],
    },
    {
      title: "Kelionės būklė",
      options: [
        {
          type: "checkbox" as const,
          label: "Pasirinkite būklę",
          options: ["Juodraštis", "Patvirtinta", "Atšaukta"],
        },
      ],
    },
    {
      title: "Kelionės data",
      options: [
        {
          type: "date" as const,
          label: "Kelionės pradžia",
        },
        {
          type: "date" as const,
          label: "Kelionės pabaiga",
        },
      ],
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Jūsų sukurtos kelionės
      </Typography>

      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Ieškoti kelionių..." />

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
        <Box>
          <Button variant="contained" color="primary" onClick={() => navigate("/trips/client")}>
            Sukurti kelionę klientui
          </Button>
        </Box>


        <Box sx={{ display: "flex", gap: 2 }}>
          {isMobile && (
            <Button variant="outlined" startIcon={<FilterList />} onClick={() => setIsFilterDrawerOpen(true)}>
              Filtrai
            </Button>
          )}
          <SortMenu
            options={["Naujausios pirmos", "Seniausios pirmos", "Kaina (didėjimo tvarka)", "Kaina (mažėjimo tvarka)"]}
            onSort={() => {}}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex" }}>
        {!isMobile && (
          <FilterMenu
            sections={filterSections}
            onApplyFilters={() => {}}
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
          />
        )}
        <Box sx={{ flex: 1 }}>
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          ) : filteredTrips.length > 0 ? (
            <Grid container spacing={2}>
              {filteredTrips.map((trip) => (
                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                  <TripSummaryCard trip={trip} onClick={handleTripClick} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" textAlign="center">
              Nėra sukurtų kelionių.
            </Typography>
          )}
        </Box>
      </Box>

      {isMobile && (
        <FilterMenu
          sections={filterSections}
          onApplyFilters={() => {}}
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
      )}
    </Box>
  )
}

export default AdminTripList

