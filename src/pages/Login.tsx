"use client"

import type * as React from "react"
import { useState } from "react"
import {
  Button,
  CssBaseline,
  TextField,
  Box,
  Typography,
  Container,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  useMediaQuery,
  Link as MuiLink,
} from "@mui/material"
import { createTheme, ThemeProvider, responsiveFontSizes } from "@mui/material/styles"
import { useNavigate, Link } from "react-router-dom"
import { API_URL } from "../Utils/Configuration"
import axios from "axios"
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  FlightTakeoff,
  ExploreOutlined,
  LocationOnOutlined,
  BeachAccessOutlined,
  DirectionsBoatOutlined,
} from "@mui/icons-material"

// Create a custom theme with travel-inspired colors
let travelTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Ocean blue
      light: "#4791db",
      dark: "#115293",
    },
    secondary: {
      main: "#009688", // Teal green (like tropical waters)
      light: "#33ab9f",
      dark: "#00695f",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#1976d2",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
})

// Make the theme responsive
travelTheme = responsiveFontSizes(travelTheme)

export default function SignIn() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isSmallScreen = useMediaQuery(travelTheme.breakpoints.down("sm"))

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const validate = (data: any) => {
    const tempErrors = { ...errors }
    tempErrors.email = data.get("email")
      ? /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.get("email"))
        ? ""
        : "Neteisingas el. pašto adresas"
      : "El. paštas yra privalomas"
    tempErrors.password = data.get("password")
      ? data.get("password").length > 5
        ? ""
        : "Slaptažodį turi sudaryti mažiausiai 6 simboliai"
      : "Slaptažodis yra privalomas"
    setErrors(tempErrors)
    return Object.values(tempErrors).every((x) => x === "")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (!validate(data)) {
      console.error("Validation errors:", errors)
      return
    }

    setIsLoading(true)
    const loginData = {
      email: data.get("email") as string,
      password: data.get("password") as string,
    }

    try {
      const response = await axios.post(API_URL + "/Auth/login", loginData, {
        headers: { "Content-Type": "application/json" },
      })

      console.log("Success:", response.data)

      if (response.data.requires2FASetup) {
        localStorage.setItem("accessToken", response.data.accessToken)
        localStorage.setItem("refreshToken", response.data.refreshToken || "")
        localStorage.setItem("2fa_user_id", response.data.userId)
        setIsLoading(false)
        navigate("/2fa-setup")
        return
      }

      if (response.data.requires2FA) {
        localStorage.setItem("accessToken", response.data.accessToken)
        localStorage.setItem("refreshToken", response.data.refreshToken || "")
        localStorage.setItem("2fa_user_id", response.data.userId)
        setIsLoading(false)
        navigate("/2fa-verify")
        return
      }

      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken)
        localStorage.setItem("refreshToken", response.data.refreshToken || "")
      } else {
        console.error("Login failed: No access token returned.")
        setIsLoading(false)
        return
      }

      if (response.data.requiresPasswordReset) {
        localStorage.setItem("email", loginData.email)
        navigate("/change-password")
        return
      }

      if (response.data.requiresProfileCompletion) {
        localStorage.setItem("email", loginData.email)
        navigate("/complete-profile")
        return
      }

      navigate("/")
      window.location.reload()
    } catch (error) {
      setIsLoading(false)
      if (axios.isAxiosError(error)) {
        console.error("Response error:", error.response?.data)
        setErrors({
          ...errors,
          email: error.response?.data.Message || "Login failed",
          password: error.response?.data.Message || "Login failed",
        })
      } else {
        console.error("Error during Axios request:", error)
      }
    }
  }

  // Travel icons for decoration
  const travelIcons = [
    <FlightTakeoff key="flight" />,
    <ExploreOutlined key="explore" />,
    <LocationOnOutlined key="location" />,
    <BeachAccessOutlined key="beach" />,
    <DirectionsBoatOutlined key="boat" />,
  ]

  return (
    <ThemeProvider theme={travelTheme}>
      <CssBaseline />
      <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
            borderTop: 3,
            borderColor: "primary.main",
            mt: 4, // Adjusted spacing
          }}
        >
          {/* Decorative travel icons at the top */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              width: "100%",
              mb: 3,
              color: "primary.main", // Primary color
              opacity: 0.8,
            }}
          >
            {travelIcons.map((icon, index) => (
              <Box
                key={index}
                sx={{
                  transform: `rotate(${index % 2 === 0 ? -10 : 10}deg)`,
                  fontSize: { xs: "1.5rem", sm: "1.8rem" },
                }}
              >
                {icon}
              </Box>
            ))}
          </Box>

          <Avatar
            sx={{
              m: 1,
              bgcolor: "primary.main", // Primary color
              width: 56,
              height: 56,
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <FlightTakeoff fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mb: 1, color: "primary.main", fontWeight: "bold" }}>
            Sveiki sugrįžę!
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="El. paštas"
              name="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Slaptažodis"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      color="primary" // Primary color
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right", mb: 2 }}>
              <MuiLink component={Link} to="/forgot-password" variant="body2" color="primary">
                Pamiršote slaptažodį?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary" // Primary color
              disabled={isLoading}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.5,
                fontSize: "1rem",
                bgcolor: "primary.main", // Explicitly set primary color
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              {isLoading ? "Jungiamasi..." : "Prisijungti"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  )
}
