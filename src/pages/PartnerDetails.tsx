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
} from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type PartnerResponse, partnerTypeColors } from "../types/Partner"
import { translatePartnerType } from "../Utils/translateEnums"
import LeafletMapDisplay from "../components/LeafletMapDisplay"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import { useNavigation } from "../contexts/NavigationContext"
import { UserContext } from "../contexts/UserContext"
import PartnerFormModal from "../components/CreatePartnerModal"
import ActionBar from "../components/ActionBar"

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
  const [canEdit, setCanEdit] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const token = localStorage.getItem("accessToken")

  // Use useCallback to create a memoized fetchPartner function
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

      // Check if the current user can edit this partner
      setCanEdit(response.data.createdBy === user?.email)
    } catch (err: any) {
      console.error("Failed to fetch partner:", err)
      setError(err.response?.data?.message || "Nepavyko gauti partnerio informacijos.")
    } finally {
      setLoading(false)
    }
  }, [partnerId, token, user?.email])

  useEffect(() => {
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId, fetchPartner])

  const handleEdit = () => {
    setEditModalOpen(true)
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

      // Navigate back to partner list after a short delay
      setTimeout(() => {
        navigate("/partner-list")
      }, 1500)
    } catch (err: any) {
      console.error("Failed to delete partner:", err)

      // Handle unauthorized error
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
    console.log("Edit success called with:", updatedPartner)

    // Update the partner state with the new data
    setPartner(updatedPartner)

    // Show success message in the snackbar
    setSnackbar({
      open: true,
      message: "Partneris sėkmingai atnaujintas!",
      severity: "success",
    })

    // Refresh the partner data from the server
    // Add a small delay to ensure the API has time to update
    setTimeout(() => {
      fetchPartner()
    }, 300)
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Function to get the location string for the map - just return the city if available
  const getMapAddress = () => {
    if (!partner) return ""

    // Prioritize just the city for better geocoding results
    if (partner.city) return partner.city

    // Fall back to country if no city
    if (partner.country) return partner.country

    // If we have both region and country
    if (partner.region) {
      return partner.region
    }

    return ""
  }

  // Check if we have enough location data to show a map
  const hasLocationData = partner && (partner.city || partner.country || partner.region)

  // Function to get the type color
  const getTypeColor = () => {
    if (!partner) return partnerTypeColors[4] // Default to Other

    // If type is a string (from API), convert to number
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

    // If type is already a number
    return partnerTypeColors[partner.type] || partnerTypeColors[4] // Default to Other color
  }

  // Check if contact information exists
  const hasContactInfo = partner && (partner.email || partner.phone || partner.websiteUrl || partner.facebook)

  // Check if additional information exists
  const hasAdditionalInfo = partner && (partner.loginInfo || partner.notes)

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
        showEditButton={canEdit}
        showDeleteButton={canEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Left column - Partner info */}
        <Grid item xs={12} md={4}>
          {/* Partner profile card - SMALLER VERSION */}
          <Card sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                height: 80, // Reduced height
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
                      width: 80, // Smaller avatar
                      height: 80,
                      border: "4px solid white",
                      boxShadow: 2,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 80, // Smaller avatar
                      height: 80,
                      bgcolor: "#f0f0f0",
                      color: "#757575",
                      border: "4px solid white",
                      boxShadow: 2,
                      fontSize: 32, // Smaller font
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

              {/* Removed creation date */}
            </CardContent>
          </Card>

          {/* Contact Information */}
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

          {/* Additional Information */}
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

                {partner.loginInfo && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                      <VpnKeyIcon sx={{ color: "text.secondary", mr: 2, mt: 0.5 }} />
                      <Box sx={{ textAlign: "left" }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          Prisijungimo informacija
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                          {partner.loginInfo}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

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

        {/* Right column - Location and Map */}
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

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Partner Modal */}
      {partner && (
        <PartnerFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          partner={partner}
          isEditing={true}
        />
      )}

      {/* Snackbar for notifications */}
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
