import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import MarkdownEditor from "../components/MarkdownEditor";
import { DestinationResponse } from "../types/Destination";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});

const EditDestination: React.FC = () => {
  const { destinationId } = useParams<{ destinationId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    country: "",
    city: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const response = await axios.get<DestinationResponse>(
          `${API_URL}/Destination/${destinationId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          }
        );

        setFormData({
          country: response.data.country,
          city: response.data.city,
          description: response.data.description,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Nepavyko gauti kelionės krypties duomenų.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestination();
  }, [destinationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/Destination/${destinationId}`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSnackbarMessage("Kelionės kryptis sėkmingai atnaujinta!");
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/destination/${destinationId}`), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Nepavyko atnaujinti kelionės krypties.");
      setSnackbarMessage("Klaida atnaujinant kryptį.");
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => navigate(`/destination/${destinationId}`);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Redaguoti kelionės kryptį
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
              value={formData.country}
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
              value={formData.city}
              onChange={handleInputChange}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Aprašymas
              </Typography>
              <MarkdownEditor
                value={formData.description}
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
                  {isLoading ? <CircularProgress size={24} /> : "Išsaugoti"}
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
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    </ThemeProvider>
  );
};

export default EditDestination;
