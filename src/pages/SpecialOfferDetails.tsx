import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ReservationCard from "../components/ReservationCard";

const SpecialOfferDetails: React.FC = () => {
  const navigate = useNavigate();

  const handleReserve = () => {
    navigate("/reserve-special-offer"); // Replace "/reservation" with the actual route for your reservation page
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              mb: 4,
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <CardMedia
              component="img"
              image="../assets/relax.jpg" // Replace with your actual image path
              alt="Italija, Roma"
              sx={{ height: 300, borderRadius: 2 }}
            />
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Italija, Roma
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Vasario 1 - Vasario 4
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Į kainą įskaičiuota:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Tiesioginis skrydis Vilnius – Roma – Vilnius (skrydžius vykdo oro linijų bendrovė „Ryanair“)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Rankinis bagažas: 1 vnt., ne didesnis kaip 40 cm x 20 cm x 25 cm." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Apgyvendinimas viešbutyje (dviviečiame kambaryje) nurodytam dienų skaičiui su nurodytu maitinimo tipu." />
                </ListItem>
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Papildomos išlaidos:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Savarankiška kelionė oro uostas – viešbutis – oro uostas;" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Asmeninės išlaidos (pusryčiai, pietūs, vakarienės, lankomų objektų mokesčiai ir kt.);" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Turistinis mokestis – apie 6 Eur/asm. už naktį;" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Draudimas (labai rekomenduojamas)." />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Viešbutis:
              </Typography>
              <Typography variant="body1" paragraph>
                <b>Auditorium Mecenate (3*)</b> – Tai labai gerai vertinamas
                (booking.com svetainėje – 8,2 balo) viešbutis, įsikūręs Romos
                centre, netoli Termini stoties. Jį pamėgo dėl patogios
                lokacijos, gero susisiekimo ir draugiško, dėmesingo personalo.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vieta: apie 500 m iki Termini stoties, apie 11 km iki Čampino
                oro uosto, apie 20 km iki Fjumičino oro uosto, apie 1,5 km iki
                Piazza Venezia aikštės ir Trevi fontano.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Content */}
        <Grid item xs={12} md={4}>
          <ReservationCard
            pricePerPerson={773}
            totalPrice={1547}
            onReserve={handleReserve}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SpecialOfferDetails;
