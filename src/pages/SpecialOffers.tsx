import React from "react";
import { Container, Grid, Card, CardContent, CardMedia, Typography, Box, Chip, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FilterMenu from "../components/FilterMenu";

const SpecialOffers: React.FC = () => {
  const offers = [
    { id: 1, title: "Italija, Roma", dateRange: "Vasario 1 - Vasario 4", price: "339 €", image: "src/assets/italy.jpg", tag: "Trumpas poilsis" },
    { id: 2, title: "Egiptas, Naama Bay", dateRange: "Sausio 15 - Sausio 22", price: "364 €", image: "src/assets/italy.jpg", tag: "Žiemos atostogos" },
    { id: 3, title: "Kipras, Larnaka", dateRange: "Sausio 18 - Sausio 21", price: "239 €", image: "src/assets/italy.jpg", tag: "Trumpas poilsis" },
  ];

  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Specialūs Pasiūlymai
      </Typography>
      <Box sx={{ display: "flex" }}>
        {/* Sidebar Filter Menu */}
        <FilterMenu categories={["Trumpas poilsis", "Žiemos atostogos"]} onFilter={() => {}} />

        {/* Offers */}
        <Grid container spacing={4} sx={{ flex: 1, ml: 2 }}>
          {offers.map((offer) => (
            <Grid item xs={12} sm={6} md={4} key={offer.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/specialOfferDetails/${offer.id}`)}
              >
                <CardMedia component="img" height="200" image={offer.image} alt={offer.title} />
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Chip label={offer.tag} color="success" />
                    <Typography variant="h6" color="primary">
                      {offer.price}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {offer.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {offer.dateRange}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default SpecialOffers;
