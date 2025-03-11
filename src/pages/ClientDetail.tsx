"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Grid,
  Avatar,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { UserContext } from "../contexts/UserContext"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import HistoryIcon from "@mui/icons-material/History"
import { API_URL } from "../Utils/Configuration"
import TagManagementModal from "../components/TagManagementModal"
import ClientTimeline from "../components/ClientTimeline"
import TripSummaryCard from "../components/TripSummaryCard"
import type { TripResponse } from "../types/ClientTrip"

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

// Now let's update the ClientDetail component to include tag functionality
const ClientDetail: React.FC = () => {
  const user = useContext(UserContext)
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [tabValue, setTabValue] = useState<number>(0)
  const [clientTags, setClientTags] = useState<ClientTagAssignment[]>([])
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false)
  const [clientTrips, setClientTrips] = useState<TripResponse[]>([])

  const mockOffers: Offer[] = [
    {
      id: "1",
      title: "Prabangus kruizas",
      description: "Kelionė Karibų jūroje su nuolaida.",
      createdAt: "2023-04-15",
    },
    {
      id: "2",
      title: "Poilsis Maldyvuose",
      description: "Savaitės kelionė su įskaičiuotu maitinimu.",
      createdAt: "2023-06-20",
    },
    {
      id: "3",
      title: "Slidinėjimas Alpėse",
      description: "Žiemos atostogos Prancūzijos Alpėse.",
      createdAt: "2023-11-10",
    },
    {
      id: "4",
      title: "Savaitgalis Prahoje",
      description: "Trumpa kultūrinė kelionė į Prahą.",
      createdAt: "2024-02-05",
    },
  ]

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

  useEffect(() => {
    const fetchClientData = async () => {
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
    }

    if (clientId) {
      fetchClientData()
      fetchClientTags()
      fetchClientTrips()
    }
  }, [clientId, fetchClientTags, fetchClientTrips])

  const handleDeleteClient = async () => {
    try {
      await axios.delete(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      navigate("/admin-client-list")
    } catch (err) {
      console.error("Error deleting client:", err)
      setError("Nepavyko ištrinti kliento.")
    }
  }

  const handleBack = () => navigate("/admin-client-list")
  const openDeleteDialog = () => setDeleteDialogOpen(true)
  const closeDeleteDialog = () => setDeleteDialogOpen(false)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Add a function to handle tag modal
  const handleTagClick = () => {
    setIsTagModalOpen(true)
  }

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`)
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
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(`${client.name} ${client.surname}`),
                    width: 64,
                    height: 64,
                    fontSize: "1.5rem",
                  }}
                >
                  {client.name[0]}
                  {client.surname[0]}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {client.name} {client.surname}
                    </Typography>
                    {(user?.role === "Admin" || user?.role === "Agent") && (
                      <Box>
                        <IconButton color="primary" onClick={handleTagClick} sx={{ mr: 1 }} aria-label="Manage tags">
                          <LocalOfferIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/clients/edit/${clientId}`)}
                          sx={{ mr: 1 }}
                          aria-label="Edit client"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={openDeleteDialog} aria-label="Delete client">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
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
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  navigate(
                    `/trips/client?clientId=${clientId}&clientName=${encodeURIComponent(`${client.name} ${client.surname}`)}`,
                  )
                }
                sx={{ mb: 2 }}
              >
                Pridėti kelionę
              </Button>
              {clientTrips.length > 0 ? (
                <Grid container spacing={2}>
                  {clientTrips.map((trip) => (
                    <Grid item xs={12} sm={6} key={trip.id}>
                      <TripSummaryCard trip={trip} onClick={handleTripClick} />
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
              <Button
                variant="contained"
                color="primary"
                onClick={() => console.log("Navigate to create offer")}
                sx={{ mb: 2 }}
              >
                Pridėti pasiūlymą
              </Button>
              <Grid container spacing={2}>
                {mockOffers.map((offer) => (
                  <Grid item xs={12} sm={6} key={offer.id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{offer.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {offer.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Kliento kelionių ir pasiūlymų istorija
                </Typography>
                <ClientTimeline trips={clientTrips} offers={mockOffers} />
              </Box>
            </TabPanel>
          </Paper>

          <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
            <DialogTitle>Ištrinti klientą</DialogTitle>
            <DialogContent>
              <DialogContentText>Ar tikrai norite ištrinti šį klientą? Šis veiksmas yra negrįžtamas.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDeleteDialog} color="primary">
                Atšaukti
              </Button>
              <Button onClick={handleDeleteClient} color="error">
                Ištrinti
              </Button>
            </DialogActions>
          </Dialog>

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
        </>
      ) : (
        <Typography>Klientas nerastas.</Typography>
      )}
      <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
        Grįžti
      </Button>
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

