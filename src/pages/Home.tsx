import React, { useRef } from "react";
import { Container, Typography, Box, Grid } from "@mui/material";
import { styled } from "@mui/system";
import HeroSection from "../components/HeroSection";
import TripRequest from "../components/TripRequest";
import TravelCategory from "../components/TravelCategory";
import TestimonialSection from "../components/TestimonialSection";
import exoticImage from "../assets/exotic.jpg";
import relaxImage from "../assets/relax.jpg";
import cruiseImage from "../assets/cruises.jpg";

const StyledSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
}));

const Home: React.FC = () => {
  const tripRequestRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <HeroSection tripRequestRef={tripRequestRef} />
      <Container maxWidth="lg">


        <StyledSection>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Mūsų kelionių kategorijos
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <TravelCategory
                image={exoticImage}
                title="Egzotinės kelionės"
                description="Tolimos šalys: Tailandas, Šri Lanka, Dominikos Respublika, Kuba, Maldyvai, Meksika, JAE, Jamaika, JAV, Karibų salos, Kenija, PAR, Mauricijus ir kitos"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TravelCategory
                image={relaxImage}
                title="Poilsinės kelionės"
                description="Viduržemio jūros regionas: Graikija, Ispanija, Turkija, Italija, Bulgarija, Egiptas, Portugalija, Prancūzija ir kitos šalys"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TravelCategory
                image={cruiseImage}
                title="Kruizai"
                description="MSC, Norwegian Cruise Line, Celebrity Cruises, Costa Cruises"
              />
            </Grid>
          </Grid>
        </StyledSection>

        <StyledSection ref={tripRequestRef}>
          <TripRequest />
        </StyledSection>

        <TestimonialSection />
      </Container>
    </>
  );
};

export default Home;
