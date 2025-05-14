"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Typography, Card, CardContent, CircularProgress, Grid, Alert } from "@mui/material"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import type { PublicOfferWithReservationCountResponse } from "../types/Reservation"

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Nenustatyta"

  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Intl.DateTimeFormat("lt-LT", options).format(date)
}

const SpecialOffersWithReservations: React.FC = () => {
  const [offers, setOffers] = useState<PublicOfferWithReservationCountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOffersWithReservations()
  }, [])

  const fetchOffersWithReservations = async () => {
    try {
      setLoading(true)
      const response = await axios.get<PublicOfferWithReservationCountResponse[]>(
        `${API_URL}/PublicTripOfferFacade/agent/reservations`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      )

      const offersWithReservations = response.data.filter((offer) => offer.reservationCount > 0)
      setOffers(offersWithReservations)
    } catch (err) {
      setError("Nepavyko gauti pasiūlymų su rezervacijomis.")
    } finally {
      setLoading(false)
    }
  }

  const handleOfferClick = (offerId: string) => {
    navigate(`/public-offers/${offerId}/reservations`)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (offers.length === 0) {
    return <Alert severity="info">Nėra pasiūlymų su rezervacijomis.</Alert>
  }

  return (
    <Grid container spacing={2}>
      {offers.map((offer) => (
        <Grid item xs={12} key={offer.id}>
          <Card
            sx={{
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 3,
              },
            }}
            onClick={() => handleOfferClick(offer.id)}
          >
            <CardContent sx={{ p: 3, textAlign: "left" }}>
              <Typography variant="h6" gutterBottom>
                {offer.tripName || "Pasiūlymas be pavadinimo"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1, fontWeight: 600, color: "success.main" }}>
                Naujos rezervacijos: {offer.reservationCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default SpecialOffersWithReservations
