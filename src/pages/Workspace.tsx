"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Grid, Paper, Typography, Collapse, IconButton, CircularProgress, Alert } from "@mui/material"
import Calendar from "../components/Calendar"
import TripRequestList from "../components/TripRequestList"
import SpecialOffersWithReservations from "../components/SpecialOffersWithReservations"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"

const Workspace: React.FC = () => {
  const [expandedOffers, setExpandedOffers] = useState(false)
  const [hasReservations, setHasReservations] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkForReservations = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/PublicTripOfferFacade/agent/reservations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })

        const offersWithReservations = response.data.filter((offer: any) => offer.reservationCount > 0)
        setHasReservations(offersWithReservations.length > 0)

        if (offersWithReservations.length > 0) {
          setExpandedOffers(true)
        }
      } catch (err) {
        setError("Nepavyko patikrinti rezervacijų.")
      } finally {
        setLoading(false)
        setIsInitialLoading(false)
      }
    }

    checkForReservations()
  }, [])

  const toggleExpandedOffers = () => {
    setExpandedOffers(!expandedOffers)
  }

  return (
    <Box sx={{ p: 3 }}>
      {isInitialLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%" }}>
              {hasReservations && (
                <Paper sx={{ mb: 3, overflow: "hidden" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      cursor: "pointer",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderRadius: (theme) => `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
                    }}
                    onClick={toggleExpandedOffers}
                  >
                    <Typography sx={{ fontSize: "1rem", fontWeight: 400 }}>Pasiūlymai su rezervacijomis</Typography>
                    <IconButton size="small" sx={{ color: "inherit" }}>
                      {expandedOffers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedOffers}>
                    <Box sx={{ p: 2 }}>
                      {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {error}
                        </Alert>
                      ) : (
                        <SpecialOffersWithReservations />
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              )}

              <TripRequestList />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: "100%", mt: { xs: 2, md: 0 } }}>
              <Calendar />
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default Workspace
