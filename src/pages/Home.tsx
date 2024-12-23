import React from "react";
import { Container, Grid, Typography, Box } from "@mui/material";
import PictureText from "../components/HomePageContainers";
import exoticImage from "../assets/exotic.jpg";
import relaxImage from "../assets/relax.jpg";
import cruiseImage from "../assets/cruises.jpg";

const Home: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Introduction Section */}
      <Box mb={6}>
        <Typography variant="h4" align="center" gutterBottom>
          Kelionių agentūra – 32 metų patirtis!
        </Typography>
        <Typography variant="body1" align="center">
          Jau 32 metus padedame žmonėms atrasti nuostabiausius pasaulio kampelius. Mūsų kelionių
          agentūra siūlo egzotines, poilsines ir kruizines keliones, pritaikytas Jūsų poreikiams.
          Pasitikėkite mūsų patirtimi ir išpildykite savo svajones su mūsų profesionalia komanda.
        </Typography>
      </Box>

      {/* Trip Components Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <PictureText
            imagePath={exoticImage}
            title="Egzotinės kelionės"
            description="Tolimos šalys: Tailandas, Šri Lanka, Dominikos Respublika, Kuba, Maldyvai, Meksika, JAE, Jamaika, JAV, Karibų salos, Kenija, PAR, Mauricijus ir kitos"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PictureText
            imagePath={relaxImage}
            title="Poilsinės kelionės"
            description="Viduržemio jūros regionas: Graikija, Ispanija, Turkija, Italija, Bulgarija, Egiptas, Portugalija, Prancūzija ir kitos šalys"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PictureText
            imagePath={cruiseImage}
            title="Kruizai"
            description="MSC, Norwegian Cruise Line, Celebrity Cruises, Costa Cruises"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
