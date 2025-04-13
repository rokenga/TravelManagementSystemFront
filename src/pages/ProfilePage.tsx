"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Skeleton,
  Alert,
  Chip,
  useTheme,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import PersonIcon from "@mui/icons-material/Person"
import EmailIcon from "@mui/icons-material/Email"
import CakeIcon from "@mui/icons-material/Cake"
import { API_URL } from "../Utils/Configuration"

// Define the User interface
export type UserRole = "Admin" | "Agent"

export interface User {
  id: string
  email: string
  role: UserRole | null
  firstName: string
  lastName: string
  birthDate: string
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await axios.get<User>(`${API_URL}/Auth/getUser`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setUser(response.data)
      } catch (err) {
        console.error("Failed to fetch user data:", err)
        setError("Nepavyko užkrauti vartotojo duomenų. Bandykite dar kartą vėliau.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "Nepateikta"
    const date = new Date(dateString)
    return date.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
  }

  const handleEdit = () => {
    // Implement edit functionality
    console.log("Edit profile clicked")
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card elevation={3}>
        <CardHeader
          title={
            <Typography variant="h5" align="left">
              Paskyros informacija
            </Typography>
          }
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Redaguoti
            </Button>
          }
          sx={{
            bgcolor: theme.palette.primary.main,
            color: "white",
            "& .MuiCardHeader-action": {
              margin: 0,
              alignSelf: "center",
            },
            "& .MuiCardHeader-content": {
              textAlign: "left",
            },
          }}
        />

        <CardContent sx={{ pt: 3, pb: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={120} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* Avatar and Role Section */}
              <Grid item xs={12} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    fontSize: 24,
                    bgcolor: theme.palette.secondary.main,
                    mr: 2,
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  {user?.role && (
                    <Chip
                      label={user.role === "Admin" ? "Administratorius" : "Agentas"}
                      color={user.role === "Admin" ? "error" : "primary"}
                      size="small"
                    />
                  )}
                </Box>
              </Grid>

              {/* User Details Section - Single Column */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <PersonIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Vardas
                    </Typography>
                    <Typography variant="body1">{user?.firstName || "Nėra"}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <PersonIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Pavardė
                    </Typography>
                    <Typography variant="body1">{user?.lastName || "Nėra"}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      El. paštas
                    </Typography>
                    <Typography variant="body1">{user?.email || "Nėra"}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CakeIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Gimimo data
                    </Typography>
                    <Typography variant="body1">{user ? formatDate(user.birthDate) : "Nėra"}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default ProfilePage
