"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Link,
  useTheme,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material"
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Facebook as FacebookIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon,
  VpnKey as VpnKeyIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Security as SecurityIcon,
} from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type PartnerResponse, type PartnerLoginResponse, partnerTypeColors } from "../types/Partner"
import { translatePartnerType } from "../Utils/translateEnums"
import LeafletMapDisplay from "../components/LeafletMapDisplay"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import { useNavigation } from "../contexts/NavigationContext"
import { UserContext } from "../contexts/UserContext"
import PartnerFormModal from "../components/CreatePartnerModal"
import ActionBar from "../components/ActionBar"
import UpdateLoginModal from "../components/UpdatePartnerLoginModal"

const PartnerDetailsPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>()
  const navigate = useNavigate()
  const { navigateBack } = useNavigation()
  const theme = useTheme()
  const user = useContext(UserContext)

  const [partner, setPartner] = useState<PartnerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [updateLoginModalOpen, setUpdateLoginModalOpen] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  
  // Add state for credentials section
  const [showCredentials, setShowCredentials] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState<PartnerLoginResponse | null>(null)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const token = localStorage.getItem("accessToken")

  const fetchPartner = useCallback(async () => {
    if (!partnerId) return

    setLoading(true)
    try {
      const response = await axios.get<PartnerResponse>(`${API_URL}/Partner/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setPartner(response.data)
      setCanEdit(response.data.createdBy === user?.email)
    } catch (err: any) {
      setError(err.response?.data?.message || "Nepavyko gauti partnerio informacijos.")
    } finally {
      setLoading(false)
    }
  }, [partnerId, token, user?.email])

  // Add function to fetch login credentials
  const fetchLoginCredentials = async () => {
    if (!partnerId) return

    setCredentialsLoading(true)
    setCredentialsError(null)
    try {
      const response = await axios.get<PartnerLoginResponse>(`${API_URL}/Partner/${partnerId}/login-info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setLoginCredentials(response.data)
    } catch (err: any) {
      setCredentialsError(err.response?.data?.message || "Nepavyko gauti prisijungimo duomenų.")
    } finally {
      setCredentialsLoading(false)
    }
  }

  // Handle credentials visibility toggle
  const handleToggleCredentials = () => {
    if (!showCredentials) {
      fetchLoginCredentials()
    } else {
      // Hide credentials and clear data
      setLoginCredentials(null)
      setCredentialsError(null)
    }
    setShowCredentials(!showCredentials)
  }

  // Handle copying to clipboard
  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSnackbar({
        open: true,
        message: `${label} nukopijuotas į iškarpinę!`,
        severity: "success",
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Nepavyko nukopijuoti ${label.toLowerCase()}`,
        severity: "error",
      })
    }
  }

  useEffect(() => {
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId, fetchPartner])

  // Reset credentials when leaving page
  useEffect(() => {
    return () => {
      setShowCredentials(false)
      setLoginCredentials(null)
      setCredentialsError(null)
    }
  }, [])

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleUpdateLogin = () => {
    setUpdateLoginModalOpen(true)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!partnerId) return

    setDeleteLoading(true)
    try {
      await axios.delete(`${API_URL}/Partner/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSnackbar({
        open: true,
        message: "Partneris sėkmingai ištrintas!",
        severity: "success",
      })

      setShowDeleteDialog(false)

      setTimeout(() => {
        navigate("/partner-list")
      }, 1500)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Jūs neturite teisių ištrinti šio partnerio.",
          severity: "error",
        })
      } else {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Nepavyko ištrinti partnerio.",
          severity: "error",
        })
      }
      setShowDeleteDialog(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditSuccess = (updatedPartner: PartnerResponse) => {
    setPartner(updatedPartner)
    setSnackbar({
      open: true,
      message: "Partneris sėkmingai atnaujintas!",
      severity: "success",
    })

    setTimeout(() => {
      fetchPartner()
    }, 500)
  }

  const handleUpdateLoginSuccess = () => {
    setSnackbar({
      open: true,
      message: "Prisijungimo duomenys sėkmingai atnaujinti!",
      severity: "success",
    })

    // Refresh credentials if they're currently visible
    if (showCredentials) {
      fetchLoginCredentials()
    }
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getMapAddress = () => {
    if (!partner) return ""

    if (partner.city) return partner.city
    if (partner.country) return partner.country
    if (partner.region) return partner.region

    return ""
  }

  const hasLocationData = partner && (partner.city || partner.country || partner.region)

  const getTypeColor = () => {
    if (!partner) return partnerTypeColors[4] // Default to Other

    if (typeof partner.type === "string") {
      const typeMap: Record<string, number> = {
        HotelSystem: 0,
        Guide: 1,
        DestinationPartner: 2,
        TransportCompany: 3,
        Other: 4,
      }
      const typeNumber = typeMap[partner.type] !== undefined ? typeMap[partner.type] : 4 // Default to Other
      return partnerTypeColors[typeNumber]
    }

    return partnerTypeColors[partner.type] || partnerTypeColors[4] // Default to Other color
  }

  const hasContactInfo = partner && (partner.email || partner.phone || partner.websiteUrl || partner.facebook)

  // Check if partner has additional info (only notes now)
  const hasAdditionalInfo = partner && partner.notes

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/partner-list")} sx={{ mb: 2 }}>
          Grįžti į partnerių sąrašą
        </Button>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Container>
    )
  }

  if (!partner) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/partner-list")} sx={{ mb: 2 }}>
          Grįžti į partnerių sąrašą
        </Button>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6">Partneris nerastas</Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with ActionBar */}
      <ActionBar
        title={partner.name}
        showBackButton={true}
        backUrl="/partner-list"
        showUpdateLoginButton={canEdit}
        showEditButton={canEdit}
        showDeleteButton={canEdit}
        onUpdateLogin={handleUpdateLogin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                height: 80,
                bgcolor: getTypeColor(),
                opacity: 0.8,
              }}
            />
            <CardContent sx={{ position: "relative", px: 3, pb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mt: -5, mb: 2 }}>
                {partner.logoUrl ? (
                  <Avatar
                    src={partner.logoUrl}
                    alt={`${partner.name} logo`}
                    sx={{
                      width: 80, 
                      height: 80,
                      border: "4px solid white",
                      boxShadow: 2,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 80, 
                      height: 80,
                      bgcolor: "#f0f0f0",
                      color: "#757575",
                      border: "4px solid white",
                      boxShadow: 2,
                      fontSize: 32, 
                    }}
                  >
                    {partner.name?.substring(0, 2).toUpperCase() || "?"}
                  </Avatar>
                )}
              </Box>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
                  {partner.name || "Nenurodyta"}
                </Typography>
                <Chip
                  label={translatePartnerType(partner.type)}
                  sx={{
                    bgcolor: getTypeColor(),
                    color: "white",
                    fontWeight: "medium",
                    fontSize: "0.875rem",
                    height: 28,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Add secure credentials section */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SecurityIcon sx={{ color: "primary.main", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Prisijungimo duomenys
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleToggleCredentials}
                  startIcon={showCredentials ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  disabled={credentialsLoading}
                >
                  {showCredentials ? "Slėpti" : "Rodyti"}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Collapse in={showCredentials}>
                {credentialsLoading && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                {credentialsError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {credentialsError}
                  </Alert>
                )}

                {loginCredentials && !credentialsLoading && (
                  <Box sx={{ space: 2 }}>
                    {loginCredentials.loginEmail && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Prisijungimo el. paštas
                        </Typography>
                        <TextField
                          value={loginCredentials.loginEmail}
                          fullWidth
                          size="small"
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyToClipboard(loginCredentials.loginEmail!, "El. paštas")}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>
                    )}

                    {loginCredentials.loginPassword && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Slaptažodis
                        </Typography>
                        <TextField
                          value={loginCredentials.loginPassword}
                          type="password"
                          fullWidth
                          size="small"
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyToClipboard(loginCredentials.loginPassword!, "Slaptažodis")}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>
                    )}

                    {!loginCredentials.loginEmail && !loginCredentials.loginPassword && (
                      <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center", py: 2 }}>
                        Nėra prisijungimo duomenų
                      </Typography>
                    )}
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {hasContactInfo && (
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BusinessIcon sx={{ color: "primary.main", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Kontaktinė informacija
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {partner.email && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <EmailIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" color="text.secondary">
                        El. paštas
                      </Typography>
                      <Link href={`mailto:${partner.email}`} color="inherit" underline="hover">
                        {partner.email}
                      </Link>
                    </Box>
                  </Box>
                )}

                {partner.phone && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <PhoneIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" color="text.secondary">
                        Telefonas
                      </Typography>
                      <Link href={`tel:${partner.phone}`} color="inherit" underline="hover">
                        {partner.phone}
                      </Link>
                    </Box>
                  </Box>
                )}

                {partner.websiteUrl && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <LanguageIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" color="text.secondary">
                        Svetainė
                      </Typography>
                      <Link
                        href={
                          partner.websiteUrl.startsWith("http") ? partner.websiteUrl : `https://${partner.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        underline="hover"
                      >
                        {partner.websiteUrl}
                      </Link>
                    </Box>
                  </Box>
                )}

                {partner.facebook && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <FacebookIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" color="text.secondary">
                        Facebook
                      </Typography>
                      <Link
                        href={partner.facebook.startsWith("http") ? partner.facebook : `https://${partner.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        underline="hover"
                      >
                        {partner.facebook}
                      </Link>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {hasAdditionalInfo && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <NotesIcon sx={{ color: "primary.main", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Papildoma informacija
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {partner.notes && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                      <NotesIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                      <Box sx={{ textAlign: "left" }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          Pastabos
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                          {partner.notes}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationIcon sx={{ color: "primary.main", mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Vietos informacija
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {partner.city || partner.country || partner.region ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
                    <LocationIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Adresas
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {[partner.city, partner.country, partner.region].filter(Boolean).join(", ")}
                      </Typography>
                    </Box>
                  </Box>

                  {hasLocationData && (
                    <Box sx={{ mt: 3, height: 400 }}>
                      <LeafletMapDisplay address={getMapAddress()} initialZoom={10} height={400} />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <LocationIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                  <Typography color="text.secondary" variant="h6">
                    Nėra vietos informacijos
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Redaguokite partnerį, kad pridėtumėte miestą ar šalį
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmationDialog
        open={showDeleteDialog}
        title="Ištrinti partnerį"
        message={`Ar tikrai norite ištrinti partnerį "${partner.name}"? Šis veiksmas negrįžtamas.`}
        confirmButtonText="Ištrinti"
        cancelButtonText="Atšaukti"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />

      {partner && (
        <PartnerFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          partner={partner}
          isEditing={true}
        />
      )}

      {partnerId && (
        <UpdateLoginModal
          open={updateLoginModalOpen}
          onClose={() => setUpdateLoginModalOpen(false)}
          onSuccess={handleUpdateLoginSuccess}
          partnerId={partnerId}
        />
      )}

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Container>
  )
}

export default PartnerDetailsPage
