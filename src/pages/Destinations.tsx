import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { UserContext } from "../contexts/UserContext";

import {
  CssBaseline,
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AddIcon from '@mui/icons-material/Add';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface DestinationInfo {
  id: string;
  country: string;
  city: string;
}

function Destinations() {
  const [destinations, setDestinations] = useState<DestinationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const role = user?.role;

  console.log("Current user role:", role);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axios.get(API_URL + "/Destination");
        if (response.status === 200) {
          setDestinations(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">

        {/* Main Content */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Kryptys
          </Typography>
                  {/* Top Bar for Admin Button */}
        {(role === "Admin" || role === "Agent") && (
          <Box 
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              my: 2, // Adds margin top and bottom
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />} // Add the plus icon
              onClick={() => navigate("/destination/create")}
            >
              Pridėti
            </Button>
          </Box>
        )}
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : destinations.length > 0 ? (
            <Grid container spacing={3}>
              {destinations.map((destination) => (
                <Grid item xs={12} sm={6} md={4} key={destination.id}>
                  <Card 
                    elevation={3}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: '0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {destination.country}
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <PublicIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {destination.country}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <LocationCityIcon color="secondary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {destination.city}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        fullWidth
                        onClick={() => navigate(`/destination/${destination.id}`)}
                      >
                        Peržiūrėti
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Nėra sukurtų krypčių
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Destinations;
