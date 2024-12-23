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
import { RecordRequest, RecordResponse } from "../types/Record";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});

const EditRecord: React.FC = () => {
  const { destinationId, recordId } = useParams<{ destinationId: string; recordId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecordRequest>({
    title: "",
    content: "",
    destinationId: destinationId || "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch record details
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await axios.get<RecordResponse>(
          `${API_URL}/Record/${recordId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          }
        );
        console.log("Fetched Record Data:", response.data);
        setFormData({
          title: response.data.title,
          content: response.data.content,
          destinationId: response.data.destinationId,
        });
      } catch (err: any) {
        console.error("Error fetching record data:", err);
        setError(err.response?.data?.message || "Nepavyko gauti įrašo duomenų.");
      } finally {
        setIsLoading(false);
      }
    };

    if (destinationId && recordId) {
      fetchRecord();
    }
  }, [destinationId, recordId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/Record/${recordId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSnackbarMessage("Įrašas sėkmingai atnaujintas!");
      setSnackbarOpen(true);
      setTimeout(() => navigate(`/destination/${destinationId}/records/${recordId}`), 2000);
    } catch (err: any) {
      console.error("Error updating record:", err);
      setError(err.response?.data?.message || "Nepavyko atnaujinti įrašo.");
      setSnackbarMessage("Klaida atnaujinant įrašą.");
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => navigate(`/destination/${destinationId}/records/${recordId}`);

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
            Redaguoti įrašą
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Pavadinimas"
              name="title"
              autoComplete="title"
              value={formData.title}
              onChange={handleInputChange}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Turinys
              </Typography>
              <MarkdownEditor
                value={formData.content}
                onChange={handleContentChange}
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

export default EditRecord;
