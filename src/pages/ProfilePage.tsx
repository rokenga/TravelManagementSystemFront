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
  Divider,
  Switch,
  Paper,
} from "@mui/material"
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
} from "@mui/icons-material"
import { API_URL } from "../Utils/Configuration"
import ChangePasswordModal from "../components/ChangePasswordModal"

// Define the User interface with WantsToReceiveReminders
interface User {
  id: string
  email: string
  role: "Admin" | "Agent" | null
  firstName: string
  lastName: string
  birthDate: string
  wantsToReceiveReminders: boolean
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
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

  const handleToggleReminders = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // This would be implemented to update the user's preference
    console.log("Toggle reminders:", event.target.checked)
    // In a real implementation, you would make an API call here
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Profile Card */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ overflow: "visible" }}>
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

            <CardContent sx={{ pt: 4, pb: 4 }}>
              {loading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Skeleton variant="circular" width={80} height={80} sx={{ mx: "auto" }} />
                  <Skeleton variant="rectangular" width="100%" height={30} />
                  <Skeleton variant="rectangular" width="100%" height={30} />
                  <Skeleton variant="rectangular" width="100%" height={30} />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* Avatar and Name Section */}
                  <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: 48,
                        bgcolor: theme.palette.secondary.main,
                        mb: 2,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    {user?.role && (
                      <Chip
                        label={user.role === "Admin" ? "Administratorius" : "Agentas"}
                        color={user.role === "Admin" ? "error" : "primary"}
                        size="medium"
                        sx={{ fontWeight: "bold" }}
                      />
                    )}
                  </Grid>

                  {/* User Details Section */}
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: "background.default", borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main, fontWeight: "bold" }}>
                        Asmeninė informacija
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <BadgeIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Vardas
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {user?.firstName || "Nėra"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <BadgeIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Pavardė
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {user?.lastName || "Nėra"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <EmailIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                El. paštas
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {user?.email || "Nėra"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <CakeIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Gimimo data
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {user ? formatDate(user.birthDate) : "Nėra"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 3 }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <NotificationsIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                          <Typography variant="body1">Gauti priminimus el. paštu</Typography>
                        </Box>
                        <Switch
                          checked={user?.wantsToReceiveReminders || false}
                          onChange={handleToggleReminders}
                          color="primary"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Card */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SecurityIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Saugumas</Typography>
                </Box>
              }
              sx={{
                bgcolor: "background.paper",
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LockIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Slaptažodis
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pakeiskite savo prisijungimo slaptažodį
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsPasswordModalOpen(true)}
                  sx={{ textTransform: "none" }}
                >
                  Keisti slaptažodį
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Modal */}
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </Container>
  )
}

export default ProfilePage
