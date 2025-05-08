"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Typography, Box, Grid, Button, CircularProgress } from "@mui/material"
import { styled } from "@mui/system"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import PublicOfferCard from "./PublicOfferCard"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import type { TripResponse } from "../types/ClientTrip"

const StyledSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(4, 0),
  },
}))

const ViewAllButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(4),
  backgroundColor: "#F58220",
  color: "white",
  "&:hover": {
    backgroundColor: "#d66d0e",
  },
}))

const RecentOffers: React.FC = () => {
  const [offers, setOffers] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRecentOffers = async () => {
      try {
        setLoading(true)
        // Use the non-paginated endpoint to get all offers
        const response = await axios.get(`${API_URL}/PublicTripOfferFacade`)

        // Sort by creation date (newest first) and take the first 3
        const sortedOffers = response.data
          .sort((a: TripResponse, b: TripResponse) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          })
          .slice(0, 3)

        setOffers(sortedOffers)
      } catch (error) {
        console.error("Failed to fetch recent offers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentOffers()
  }, [])

  const handleOfferClick = (id: string) => {
    navigate(`/specialOfferDetails/${id}`)
  }

  const handleViewAllClick = () => {
    navigate("/specialOffers")
  }

  return (
    <StyledSection>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        color="primary"
        sx={{
          fontSize: {
            xs: "1.5rem",
            sm: "1.75rem",
            md: "2.125rem",
          },
          mb: 3,
        }}
      >
        Naujausi kelionių pasiūlymai
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : offers.length > 0 ? (
        <>
          <Grid container spacing={3} justifyContent="center">
            {offers.map((offer) => (
              <Grid item xs={12} sm={6} md={4} key={offer.id}>
                <PublicOfferCard offer={offer} onClick={handleOfferClick} />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center">
            <ViewAllButton variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleViewAllClick} size="large">
              Visi pasiūlymai
            </ViewAllButton>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Šiuo metu specialių pasiūlymų nėra
          </Typography>
          <ViewAllButton variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleViewAllClick} sx={{ mt: 2 }}>
            Peržiūrėti visus pasiūlymus
          </ViewAllButton>
        </Box>
      )}
    </StyledSection>
  )
}

export default RecentOffers
