import * as React from "react";
import { useState } from "react";
import { Button, CssBaseline, TextField, Box, Typography, Container } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../Utils/Configuration";
import axios from "axios";

const defaultTheme = createTheme();

export default function SignIn() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = (data: any) => {
    const tempErrors = { ...errors };
    tempErrors.email = data.get("email")
      ? /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.get("email"))
        ? ""
        : "Neteisingas el. pašto adresas"
      : "El. paštas yra privalomas";
    tempErrors.password = data.get("password")
      ? data.get("password").length > 5
        ? ""
        : "Slaptažodį turi sudaryti mažiausiai 6 simboliai"
      : "Slaptažodis yra privalomas";
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
  
    if (!validate(data)) {
      console.error("Validation errors:", errors);
      return;
    }
  
    const loginData = {
      email: data.get("email") as string,
      password: data.get("password") as string,
    };
  
    try {
      const response = await axios.post(API_URL + "/Auth/login", loginData, {
        headers: { "Content-Type": "application/json" },
      });
  
      console.log("Success:", response.data);
  
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken || "");
      } else {
        console.error("Login failed: No access token returned.");
        return;
      }
  
      if (response.data.requiresPasswordReset) {
        localStorage.setItem("email", loginData.email);
        navigate("/change-password");
        return;
      }
  
      if (response.data.requiresProfileCompletion) {
        localStorage.setItem("email", loginData.email);
        navigate("/complete-profile");
        return;
      }
  
      navigate("/");
      window.location.reload();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Response error:", error.response?.data);
        setErrors({
          ...errors,
          email: error.response?.data.Message || "Login failed",
          password: error.response?.data.Message || "Login failed",
        });
      } else {
        console.error("Error during Axios request:", error);
      }
    }
  };
  
  
  

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography component="h1" variant="h5">
            Prisijunk
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField margin="normal" required fullWidth id="email" label="El. paštas" name="email" autoComplete="email" autoFocus error={!!errors.email} helperText={errors.email} />
            <TextField margin="normal" required fullWidth name="password" label="Slaptažodis" type="password" id="password" autoComplete="current-password" error={!!errors.password} helperText={errors.password} />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Prisijungti
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
