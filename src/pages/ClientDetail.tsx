"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { UserContext } from "../contexts/UserContext"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import HistoryIcon from "@mui/icons-material/History"
import { API_URL } from "../Utils/Configuration"
import TagManagementModal from "../components/TagManagementModal"
import ClientTimeline from "../components/ClientTimeline"
import TripSummaryCard from "../components/TripSummaryCard"
import type { TripResponse } from "../types/ClientTrip"
import { useNavigation } from "../contexts/NavigationContext"
import ActionBar from "../components/ActionBar"
import ClientFormModal from "../components/ClientFormModal"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import SpecialOfferCard from "../components/ClientSpecialOfferCard"

enum TagCategory {
  DestinationInterest = "DestinationInterest",
  Other = "Other",
  SpecialRequirements = "SpecialRequirements",
  TravelFrequency = "TravelFrequency",
  TravelPreference = "TravelPreference",
}

interface ClientTagAssignment {
  clientId: string
  tagId: string
  tagName: string
  category: TagCategory
  assignedByAgentId: string
}

// Add the categoryColors object for tag styling
const categoryColors: Record<TagCategory, string> = {
  [TagCategory.DestinationInterest]: "#FFA726",
  [TagCategory.Other]: "#66BB6A",
  [TagCategory.SpecialRequirements]: "#42A5F5",
  [TagCategory.TravelFrequency]: "#EC407A",
  [TagCategory.TravelPreference]: "#AB47BC",
}

// Add a function to get avatar color based on name
const getAvatarColor = (name: string) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
  const charCode = name.charCodeAt(0)
  return colors[charCode % colors.length]
}

// Now update the StyledCard component to make it more visually appealing
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "hidden",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[6],
  },
}))

// Update the Client interface to match what we need
interface Client {
  id: string
  name: string
  surname: string
  phoneNumber: string
  email: string
  birthday: string | null
  address: string | null
  notes: string | null
  createdAt: string
}

interface Offer {
  id: string
  title: string
  description: string
  createdAt?: string
}

// Define the client detail state interface
interface ClientDetailState {
  clientId: string
  tabValue: number
  scrollPosition: number
}

// Now let's update the ClientDetail component to include tag functionality
const ClientDetail: React.FC = () => {
  const user = useContext(UserContext)
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { savePageState, getPageState, setNavigationSource, setSourceClientId, navigateBack } = useNavigation()

  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [tabValue, setTabValue] = useState<number>(0)
  const [clientTags, setClientTags] = useState<ClientTagAssignment[]>([])
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [clientTrips, setClientTrips] = useState<TripResponse[]>([])
  const [clientSpecialOffers, setClientSpecialOffers] = useState<TripResponse[]>([])
  const [initialStateLoaded, setInitialStateLoaded] = useState<boolean>(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  // Save current state to be restored when coming back
  const saveCurrentState = useCallback(() => {
    if (!clientId) return

    const state: ClientDetailState = {
      clientId,
      tabValue,
      scrollPosition: window.scrollY,
    }
    console.log("Saving client detail state:", state)
    savePageState(`client-detail-${clientId}`, state)
  }, [clientId, tabValue, savePageState])

  const fetchClientData = useCallback(async () => {
    if (!clientId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.get(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      setClient(response.data)
    } catch (err: any) {
      console.error("Error fetching client data:", err)
      setError("Nepavyko gauti kliento duomenų.")
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  const fetchClientTrips = useCallback(async () => {
    if (!clientId) return

    try {
      const response = await axios.get<TripResponse[]>(`${API_URL}/client-trips/client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClientTrips(response.data)
    } catch (error) {
      console.error("Failed to fetch client trips:", error)
    }
  }, [clientId])

  // Add a function to fetch client tags
  const fetchClientTags = useCallback(async () => {
    if (!clientId) return

    try {
      const response = await axios.get<ClientTagAssignment[]>(`${API_URL}/ClientTagAssignment/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClientTags(response.data)
    } catch (error) {
      console.error("Failed to fetch client tags:", error)
    }
  }, [clientId])

  const fetchClientSpecialOffers = useCallback(async () => {
    if (!clientId) return

    try {
      const response = await axios.get<TripResponse[]>(`${API_URL}/ClientTripOfferFacade/client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClientSpecialOffers(response.data)
    } catch (error) {
      console.error("Failed to fetch client special offers:", error)
    }
  }, [clientId])

  // Restore state only once when component mounts
  useEffect(() => {
    if (!clientId || initialStateLoaded) return

    const savedState = getPageState(`client-detail-${clientId}`) as ClientDetailState | null
    if (savedState && savedState.clientId === clientId) {
      setTabValue(savedState.tabValue || 0)
      setTimeout(() => {
        window.scrollTo(0, savedState.scrollPosition || 0)
      }, 100)
    }
    setInitialStateLoaded(true)
  }, [clientId, getPageState, initialStateLoaded])

  useEffect(() => {
    if (clientId) {
      fetchClientData()
      fetchClientTags()
      fetchClientTrips()
      fetchClientSpecialOffers()
    }
  }, [clientId, fetchClientData, fetchClientTags, fetchClientTrips, fetchClientSpecialOffers])

  // Save state when component unmounts
  useEffect(() => {
    return () => {
      saveCurrentState()
    }
  }, [saveCurrentState])

  const handleDeleteClient = async () => {
    try {
      await axios.delete(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      // Show success message
      setSnackbar({
        open: true,
        message: "Klientas sėkmingai ištrintas!",
        severity: "success",
      })

      // Add a small delay before navigation to ensure the snackbar is seen
      setTimeout(() => {
        navigate("/admin-client-list")
      }, 1500) // 1.5 second delay
    } catch (err: any) {
      console.error("Error deleting client:", err)

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Nepavyko ištrinti kliento.",
        severity: "error",
      })

      setDeleteDialogOpen(false)
    }
  }

  const handleEditClient = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh client data after successful edit
    fetchClientData()
  }

  const handleTagClick = () => {
    setIsTagModalOpen(true)
  }

  const openDeleteDialog = () => setDeleteDialogOpen(true)
  const closeDeleteDialog = () => setDeleteDialogOpen(false)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleTripClick = (tripId: string) => {
    // Save the current state before navigating
    saveCurrentState()

    // Set the navigation source to identify where we came from
    setNavigationSource("client-details")

    // Save the client ID as the source
    if (clientId) {
      setSourceClientId(clientId)
    }

    // Navigate to the trip detail page
    navigate(`/admin-trip-list/${tripId}`)
  }

  const handleSpecialOfferClick = (offerId: string) => {
    // Save the current state before navigating
    saveCurrentState()

    // Set the navigation source to identify where we came from
    setNavigationSource("client-details")

    // Save the client ID as the source
    if (clientId) {
      setSourceClientId(clientId)
    }

    // Navigate to the special offer detail page
    navigate(`/special-offers/${offerId}`)
  }

  const handleCreateTrip = () => {
    if (client) {
      navigate(
        `/admin-trip-list/create?clientId=${clientId}&clientName=${encodeURIComponent(`${client.name} ${client.surname}`)}`,
      )
    }
  }

  const handleCreateOffer = () => {
    navigate("/special-offers/create")
  }

  return (
    <Box sx={{ maxWidth: "xl", margin: "0 auto", padding: "20px" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : client ? (
        <>
          {/* Action Bar */}
          <ActionBar
            backUrl="/admin-client-list"
            showBackButton={true}
            showEditButton={user?.role === "Admin" || user?.role === "Agent"}
            showDeleteButton={user?.role === "Admin" || user?.role === "Agent"}
            showTagButton={user?.role === "Admin" || user?.role === "Agent"}
            showCreateTripButton={user?.role === "Admin" || user?.role === "Agent"}
            showCreateOfferButton={user?.role === "Admin" || user?.role === "Agent"}
            onEdit={handleEditClient}
            onDelete={openDeleteDialog}
            onTagManage={handleTagClick}
            onBackClick={navigateBack}
            onCreateTrip={() =>
              navigate(
                `/admin-trip-list/create?clientId=${clientId}&clientName=${encodeURIComponent(`${client.name} ${client.surname}`)}`,
              )
            }
            onCreateOffer={() => navigate("/special-offers/create")}
          />

          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {client.name} {client.surname}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 3 }}>
                    <Chip label={`Telefonas: ${client.phoneNumber}`} variant="outlined" sx={{ borderRadius: "8px" }} />
                    <Chip label={`El. paštas: ${client.email}`} variant="outlined" sx={{ borderRadius: "8px" }} />
                    {client.birthday && (
                      <Chip
                        label={`Gimimo data: ${new Date(client.birthday).toLocaleDateString("lt-LT")}`}
                        variant="outlined"
                        sx={{ borderRadius: "8px" }}
                      />
                    )}
                    {client.address && (
                      <Chip label={`Adresas: ${client.address}`} variant="outlined" sx={{ borderRadius: "8px" }} />
                    )}
                  </Box>

                  {/* Display client tags */}
                  {clientTags.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                        Kliento žymos:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {clientTags.map((tag) => (
                          <Chip
                            key={tag.tagId}
                            label={tag.tagName}
                            sx={{
                              backgroundColor: categoryColors[tag.category],
                              color: "white",
                              fontWeight: 500,
                              borderRadius: "8px",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {client.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Pastabos
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.03)",
                          p: 2,
                          borderRadius: 2,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {client.notes}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </StyledCard>

          {/* Tabs Section */}
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "1rem",
                },
              }}
            >
              <Tab icon={<FlightTakeoffIcon />} iconPosition="start" label="Kliento kelionės" />
              <Tab icon={<LocalOfferIcon />} iconPosition="start" label="Specialūs pasiūlymai" />
              <Tab icon={<HistoryIcon />} iconPosition="start" label="Istorija" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {clientTrips.length > 0 ? (
                <Grid container spacing={2}>
                  {clientTrips.map((trip) => (
                    <Grid item xs={12} sm={6} key={trip.id}>
                      <TripSummaryCard trip={trip} onClick={() => handleTripClick(trip.id)} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                  Klientas dar neturi kelionių.
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {clientSpecialOffers.length > 0 ? (
                <Grid container spacing={2}>
                  {clientSpecialOffers.map((offer) => (
                    <Grid item xs={12} sm={6} key={offer.id}>
                      <SpecialOfferCard offer={offer} onClick={handleSpecialOfferClick} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                  Klientas dar neturi specialių pasiūlymų.
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Kliento kelionių ir pasiūlymų istorija
                </Typography>
                <ClientTimeline trips={clientTrips} offers={clientSpecialOffers} />
              </Box>
            </TabPanel>
          </Paper>

          {/* Custom Confirmation Dialog for Delete */}
          <ConfirmationDialog
            open={deleteDialogOpen}
            title="Ištrinti klientą"
            message="Ar tikrai norite ištrinti šį klientą? Šis veiksmas yra negrįžtamas, bus ištrinta visa susijusi informacija."
            onConfirm={handleDeleteClient}
            onCancel={closeDeleteDialog}
          />

          {/* Add Tag Management Modal */}
          <TagManagementModal
            open={isTagModalOpen}
            onClose={() => setIsTagModalOpen(false)}
            clientId={clientId || ""}
            clientTags={clientTags.map((t) => ({
              id: t.tagId,
              name: t.tagName,
              category: t.category,
            }))}
            onTagsUpdated={fetchClientTags}
          />

          {/* Client Edit Modal */}
          <ClientFormModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            clientId={clientId}
          />

          {/* Snackbar for notifications */}
          <CustomSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={handleCloseSnackbar}
          />
        </>
      ) : (
        <Typography>Klientas nerastas.</Typography>
      )}
    </Box>
  )
}

interface TabPanelProps {
  children?: React.ReactNode
  index: any
  value: any
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default ClientDetail
