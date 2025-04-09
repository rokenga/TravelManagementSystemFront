"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { Box, Typography, Grid, Button, CircularProgress } from "@mui/material"
import PublicOfferCard from "./PublicOfferCard"
import type { TripResponse } from "../types/ClientTrip"

const PublicSpecialOffers: React.FC = () => {
  const [offers, setOffers] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  /**
   * Fetch the public offers from the API
   */
  const fetchOffers = async () => {
    try {
      setLoading(true)

      // Initialize axios GET request for the public offers
      const response = await axios.get<TripResponse[]>(`${API_URL}/PublicTripOfferFacade/agent`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setOffers(response.data)
    } catch (err: any) {
      console.error("Failed to fetch public offers:", err)
      setError(err.response?.data?.message || "Nepavyko gauti viešų pasiūlymų sąrašo.")
    } finally {
      setLoading(false)
    }
  }

  const handleOfferClick = (id: string) => {
    navigate(`/public-offers/${id}`)
  }

  const handleCreateOffer = () => {
    navigate("/public-offers/create")
  }

  // Initial load
  useEffect(() => {
    fetchOffers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array for initial load

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
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
            <Button variant="contained" color="primary" onClick={handleCreateOffer}>
              Sukurti naują viešą pasiūlymą
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" textAlign="center">
            {error}
          </Typography>
        ) : offers.length > 0 ? (
          <Grid container spacing={2}>
            {offers.map((offer) => (
              <Grid item xs={12} sm={6} md={6} key={offer.id}>
                <PublicOfferCard offer={offer} onClick={handleOfferClick} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" textAlign="center" sx={{ my: 4 }}>
            Nėra sukurtų viešų pasiūlymų.
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default PublicSpecialOffers

