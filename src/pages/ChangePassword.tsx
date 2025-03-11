import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import { TextField, Button, Box, Typography, Container, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CustomSnackbar from "../components/CustomSnackBar"; // Import your snackbar component

const defaultTheme = createTheme();

export default function ChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      navigate("/login"); // Redirect back if email isn't found
      return;
    }
    setEmail(userEmail);
  }, [navigate]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || password.length < 6) {
      setSnackbar({ open: true, message: "Slaptažodį turi sudaryti bent 6 simboliai", severity: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setSnackbar({ open: true, message: "Slaptažodžiai nesutampa", severity: "error" });
      return;
    }

    try {
      await axios.post(API_URL + "/Auth/resetPassword", {
        email,
        newPassword: password,
      });

      setSnackbar({ open: true, message: "Slaptažodis sėkmingai pakeistas!", severity: "success" });
      localStorage.removeItem("email"); // Cleanup stored email

      // Delay navigation to allow snackbar to be visible
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setSnackbar({ open: true, message: "Nepavyko pakeisti slaptažodžio. Bandykite dar kartą.", severity: "error" });
      console.error(err);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography component="h1" variant="h5">
            Pakeisti slaptažodį
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Naujas slaptažodis"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Patvirtinkite slaptažodį"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Pakeisti slaptažodį
            </Button>
          </Box>
        </Box>
      </Container>
      {/* Snackbar Component */}
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={handleSnackbarClose} />
    </ThemeProvider>
  );
}
