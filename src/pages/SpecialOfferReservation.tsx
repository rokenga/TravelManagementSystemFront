import React from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook

const SpecialOfferReservation: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Kelionės užsakymas
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="El. paštas"
            placeholder="Įveskite savo el. pašto adresą"
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Telefonas"
            placeholder="Įveskite savo telefono numerį"
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Įrašykite keliautojų duomenis</Typography>
        </Grid>
        {Array.from({ length: 2 }).map((_, index) => (
          <Grid container spacing={2} key={index}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vardas"
                placeholder="Vardas"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Pavardė"
                placeholder="Pavardė"
                fullWidth
                required
              />
            </Grid>
          </Grid>
        ))}

        <Grid item xs={12} sx={{ textAlign: "center", mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/specialOffers")} // Use navigate here
          >
            Užsakyti
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SpecialOfferReservation;
