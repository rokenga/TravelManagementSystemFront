import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});

interface RecordData {
  title: string;
  content: string;
}

const CreateRecord: React.FC = () => {
  const navigate = useNavigate();

  const [recordData, setRecordData] = useState<RecordData>({
    title: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRecordData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleContentChange = (value: string) => {
    setRecordData((prevData) => ({
      ...prevData,
      content: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/Record`,
        {
          title: recordData.title,
          content: recordData.content,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }
      );

      if (response.status === 201) {
        const newRecordId = response.data;
        setSnackbarMessage("Įrašas sėkmingai sukurtas!");
        setSnackbarOpen(true);
        setTimeout(() => navigate(`/records/${newRecordId}`), 2000);
      }
    } catch (error) {
      console.error("Klaida kuriant įrašą:", error);
      setSnackbarMessage("Nepavyko sukurti įrašo. Bandykite dar kartą.");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/records`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Naujo įrašo kūrimas
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
              autoFocus
              value={recordData.title}
              onChange={handleInputChange}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Turinys
              </Typography>
              <MarkdownEditor value={recordData.content} onChange={handleContentChange} />
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
                  {isLoading ? <CircularProgress size={24} /> : "Kurti įrašą"}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" color="secondary" onClick={handleCancel}>
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

export default CreateRecord;
