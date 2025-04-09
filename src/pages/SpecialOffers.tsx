import React, { useState, useEffect } from "react";
import { Container, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicOfferCard from "../components/PublicOfferCard";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { type TripResponse } from "../types/ClientTrip";

const SpecialOffers: React.FC = () => {
  const [offers, setOffers] = useState<TripResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get(`${API_URL}/PublicTripOfferFacade`);
        setOffers(response.data);
      } catch (error) {
        console.error("Failed to fetch special offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleOfferClick = (id: string) => {
    navigate(`/specialOfferDetails/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Specialūs Pasiūlymai
      </Typography>
      <Grid container spacing={4}>
        {offers.map((offer) => (
          <Grid item xs={12} sm={6} md={4} key={offer.id}>
            <PublicOfferCard offer={offer} onClick={handleOfferClick} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SpecialOffers;
