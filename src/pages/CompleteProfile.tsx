import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { TextField, Button, Box, Typography, Container, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CustomSnackbar from "../components/CustomSnackBar"; // Import Snackbar for messages

const defaultTheme = createTheme();

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [email, setEmail] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (!storedEmail) {
      navigate("/login");
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName || firstName.length < 2) {
      setSnackbar({ open: true, message: "Vardas turi būti bent 2 simbolių ilgio", severity: "error" });
      return;
    }
    if (!lastName || lastName.length < 2) {
      setSnackbar({ open: true, message: "Pavardė turi būti bent 2 simbolių ilgio", severity: "error" });
      return;
    }
    if (!birthDay) {
      setSnackbar({ open: true, message: "Būtina pasirinkti gimimo datą", severity: "error" });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/Auth/completeProfile`,
        { firstName, lastName, birthDay },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );

      setSnackbar({ open: true, message: "Profilis sėkmingai užpildytas!", severity: "success" });

      // Redirect after showing success message
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setSnackbar({ open: true, message: "Nepavyko užpildyti profilio. Bandykite dar kartą.", severity: "error" });
      console.error(error);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography component="h1" variant="h5">
            Užpildykite savo profilį
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Vardas"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Pavardė"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Gimimo data"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Išsaugoti profilį
            </Button>
          </Box>
        </Box>
      </Container>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={handleSnackbarClose} />
    </ThemeProvider>
  );
}
