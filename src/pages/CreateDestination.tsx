import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../Utils/Configuration';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Snackbar,
  CircularProgress,
  Grid,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MarkdownEditor from '../components/MarkdownEditor';

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

interface DestinationData {
  country: string;
  city: string;
  description: string;
}

const CreateDestination: React.FC = () => {
  const [destinationData, setDestinationData] = useState<DestinationData>({
    country: '',
    city: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDestinationData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setDestinationData((prevData) => ({
      ...prevData,
      description: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
  
    try {
      const response = await axios.post(`${API_URL}/Destination`, destinationData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
  
      if (response.status === 201) {
        const newDestinationId = response.data;
        setSnackbarMessage('Kelionės kryptis sėkmingai sukurta!');
        setSnackbarOpen(true);
        setTimeout(() => navigate(`/destination/${newDestinationId}`), 2000);
      }
    } catch (error) {
      console.error('Klaida kuriant kelionės kryptį:', error);
      setSnackbarMessage('Nepavyko sukurti kelionės krypties. Bandykite dar kartą.');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleCancel = () => {
    navigate('/destinations');
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Naujos kelionės krypties kūrimas
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="country"
              label="Šalis"
              name="country"
              autoComplete="country"
              autoFocus
              value={destinationData.country}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="city"
              label="Miestas"
              name="city"
              autoComplete="city"
              value={destinationData.city}
              onChange={handleInputChange}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Aprašymas
              </Typography>
              <MarkdownEditor
                value={destinationData.description}
                onChange={handleDescriptionChange}
              />
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Kurti kryptį'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                >
                  Atšaukti
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </ThemeProvider>
  );
};

export default CreateDestination;

