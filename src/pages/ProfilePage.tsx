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
  Email as EmailIcon,
  Cake as CakeIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { API_URL } from "../Utils/Configuration"
import ChangePasswordModal from "../components/ChangePasswordModal"
import ActionBar from "../components/ActionBar"
import { useNavigate } from "react-router-dom"
import EditProfileModal from "../components/EditProfileModal"
import CustomSnackbar from "../components/CustomSnackBar"

interface User {
  id: string
  email: string
  role: "Admin" | "Agent" | null
  firstName: string
  lastName: string
  birthday: string 
  wantsToReceiveReminders: boolean
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const theme = useTheme()
  const navigate = useNavigate()

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await axios.get<User>(`${API_URL}/Auth/getUser`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        setUser(response.data)
      } catch (err) {
        setError("Nepavyko užkrauti vartotojo duomenų. Bandykite dar kartą vėliau.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Nepateikta"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Nepateikta"
      return date.toLocaleDateString("lt-LT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Nepateikta"
    }
  }

  const getUserInitials = () => {
    if (!user) return "?"
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleToggleReminders = async () => {
    return
  }

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true)
  }

  const handleProfileUpdateSuccess = (updatedUser: User) => {
    setUser(updatedUser)
    setSnackbar({
      open: true,
      message: "Profilis sėkmingai atnaujintas!",
      severity: "success",
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ActionBar
        title="Mano profilis"
        showBackButton={true}
        onBackClick={() => navigate(-1)}
        showEditButton={true}
        onEdit={handleEdit}
        children={
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LockIcon />}
            onClick={handleChangePassword}
            sx={{ textTransform: "none" }}
          >
            Keisti slaptažodį
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 3 }}>
              {loading ? (
                <Skeleton variant="circular" width={120} height={120} sx={{ mb: 2 }} />
              ) : (
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
              )}

              {loading ? (
                <>
                  <Skeleton variant="text" width="70%" height={40} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" width="50%" height={32} sx={{ mb: 3, borderRadius: 1 }} />
                </>
              ) : (
                <>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  {user?.role && (
                    <Chip
                      label={user.role === "Admin" ? "Administratorius" : "Agentas"}
                      color={user.role === "Admin" ? "error" : "primary"}
                      size="medium"
                      sx={{ fontWeight: "bold", mb: 3 }}
                    />
                  )}
                </>
              )}

              <Divider sx={{ width: "100%", mb: 3 }} />

              {loading ? (
                <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2, borderRadius: 1 }} />
              ) : (
                <Box sx={{ width: "100%", mb: 2 }}>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" align="left">
                    Asmeninė informacija
                  </Typography>
                </Box>
              }
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                p: 2.5,
              }}
            />
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <BadgeIcon sx={{ mr: 2, color: theme.palette.primary.main, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom align="left">
                            Vardas
                          </Typography>
                          <Typography variant="h6" fontWeight="medium" align="left">
                            {user?.firstName || "Nėra"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <BadgeIcon sx={{ mr: 2, color: theme.palette.primary.main, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom align="left">
                            Pavardė
                          </Typography>
                          <Typography variant="h6" fontWeight="medium" align="left">
                            {user?.lastName || "Nėra"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <EmailIcon sx={{ mr: 2, color: theme.palette.primary.main, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom align="left">
                            El. paštas
                          </Typography>
                          <Typography variant="h6" fontWeight="medium" align="left">
                            {user?.email || "Nėra"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <CakeIcon sx={{ mr: 2, color: theme.palette.primary.main, mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom align="left">
                            Gimimo data
                          </Typography>
                          <Typography variant="h6" fontWeight="medium" align="left">
                            {user ? formatDate(user.birthday) : "Nėra"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <NotificationsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" align="left">
                    Pranešimai
                  </Typography>
                </Box>
              }
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                p: 2.5,
              }}
            />
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
              ) : (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1 }}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium" align="left">
                      Gauti priminimus el. paštu
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="left">
                      Gaukite priminimus apie artėjančias keliones ir svarbius įvykius
                    </Typography>
                  </Box>
                  <Switch
                    checked={user?.wantsToReceiveReminders || false}
                    onChange={handleToggleReminders}
                    color="primary"
                    disabled={true}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EditProfileModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleProfileUpdateSuccess}
        user={user}
      />

      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default ProfilePage
