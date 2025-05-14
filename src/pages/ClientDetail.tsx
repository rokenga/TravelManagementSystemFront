"use client"

import type React from "react"
import { useState, useEffect, useContext, useCallback, useRef } from "react"
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
  Tabs,
  Tab,
  Link,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { UserContext } from "../contexts/UserContext"
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff"
import LocalOfferIcon from "@mui/icons-material/LocalOffer"
import HistoryIcon from "@mui/icons-material/History"
import EmailIcon from "@mui/icons-material/Email"
import PhoneIcon from "@mui/icons-material/Phone"
import CakeIcon from "@mui/icons-material/Cake"
import { API_URL } from "../Utils/Configuration"
import TagManagementModal from "../components/TagManagementModal"
import ClientTimeline from "../components/ClientTimeline"
import ClientsTripListCard from "../components/ClientsTripListCard"
import type { TripResponse } from "../types/ClientTrip"
import type { ClientTripListResponse, PaginationParams } from "../types/ClientsTripList"
import type { PaginatedResponse } from "../types/Pagination"
import { useNavigation } from "../contexts/NavigationContext"
import ActionBar from "../components/ActionBar"
import ClientFormModal from "../components/ClientFormModal"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import SpecialOfferCard from "../components/ClientSpecialOfferCard"
import Pagination from "../components/Pagination"
import PageSizeSelector from "../components/PageSizeSelector"

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

const categoryColors: Record<TagCategory, string> = {
  [TagCategory.DestinationInterest]: "#FFA726",
  [TagCategory.Other]: "#66BB6A",
  [TagCategory.SpecialRequirements]: "#42A5F5",
  [TagCategory.TravelFrequency]: "#EC407A",
  [TagCategory.TravelPreference]: "#AB47BC",
}

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

interface ClientDetailState {
  clientId: string
  tabValue: number
  scrollPosition: number
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

const isValidDate = (dateString: string | null): boolean => {
  if (!dateString) return false
  const date = new Date(dateString)
  return date.getFullYear() > 1
}

const ClientDetail: React.FC = () => {
  const user = useContext(UserContext)
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { savePageState, getPageState, setNavigationSource, setSourceClientId, navigateBack } = useNavigation()

  const [client, setClient] = useState<Client | null>(null)
  const [isClientLoading, setIsClientLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [tabValue, setTabValue] = useState<number>(0)
  const [clientTags, setClientTags] = useState<ClientTagAssignment[]>([])
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [initialStateLoaded, setInitialStateLoaded] = useState<boolean>(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const [isTripsLoading, setIsTripsLoading] = useState<boolean>(false)
  const [isOffersLoading, setIsOffersLoading] = useState<boolean>(false)

  const [clientTrips, setClientTrips] = useState<ClientTripListResponse[]>([])
  const [clientSpecialOffers, setClientSpecialOffers] = useState<TripResponse[]>([])

  const [tripPageNumber, setTripPageNumber] = useState(1)
  const [tripPageSize, setTripPageSize] = useState(10)
  const [tripTotalCount, setTripTotalCount] = useState(0)

  const [offerPageNumber, setOfferPageNumber] = useState(1)
  const [offerPageSize, setOfferPageSize] = useState(10)
  const [offerTotalCount, setOfferTotalCount] = useState(0)

  const pageSizeOptions = [5, 10, 25, 50]

  const tripsTabScrollPos = useRef(0)
  const offersTabScrollPos = useRef(0)
  const historyTabScrollPos = useRef(0)

  const [tripsLoaded, setTripsLoaded] = useState(false)
  const [offersLoaded, setOffersLoaded] = useState(false)

  const saveCurrentState = useCallback(() => {
    if (!clientId) return

    const state: ClientDetailState = {
      clientId,
      tabValue,
      scrollPosition: window.scrollY,
    }
    savePageState(`client-detail-${clientId}`, state)
  }, [clientId, tabValue, savePageState])

  const fetchClientData = useCallback(async () => {
    if (!clientId) return

    try {
      setIsClientLoading(true)
      setError(null)

      const response = await axios.get(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      setClient(response.data)
    } catch (err: any) {
      setError("Nepavyko gauti kliento duomenų.")
    } finally {
      setIsClientLoading(false)
    }
  }, [clientId])

  const fetchClientTrips = useCallback(async () => {
    if (!clientId) return

    try {
      setIsTripsLoading(true)

      const paginationParams: PaginationParams = {
        pageNumber: tripPageNumber,
        pageSize: tripPageSize,
      }

      const response = await axios.post<PaginatedResponse<ClientTripListResponse>>(
        `${API_URL}/client-trips/client/${clientId}`,
        paginationParams,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )

      setClientTrips(response.data.items)
      setTripTotalCount(response.data.totalCount)
      setTripsLoaded(true)
    } catch (error) {
      setError("Nepavyko gauti kliento kelionių.")
    } finally {
      setIsTripsLoading(false)
    }
  }, [clientId, tripPageNumber, tripPageSize])

  const fetchClientTags = useCallback(async () => {
    if (!clientId) return

    try {
      const response = await axios.get<ClientTagAssignment[]>(`${API_URL}/ClientTagAssignment/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setClientTags(response.data)
    } catch (error) {
      setError("Nepavyko gauti kliento žymų.")
    }
  }, [clientId])

  const fetchClientSpecialOffers = useCallback(async () => {
    if (!clientId) return

    try {
      setIsOffersLoading(true)

      const paginationParams: PaginationParams = {
        pageNumber: offerPageNumber,
        pageSize: offerPageSize,
      }

      const response = await axios.post<PaginatedResponse<TripResponse>>(
        `${API_URL}/ClientTripOfferFacade/client/${clientId}`,
        paginationParams,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )

      setClientSpecialOffers(response.data.items)
      setOfferTotalCount(response.data.totalCount)
      setOffersLoaded(true)
    } catch (error) {
      setError("Nepavyko gauti kliento specialių pasiūlymų.")
    } finally {
      setIsOffersLoading(false)
    }
  }, [clientId, offerPageNumber, offerPageSize])

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
    }
  }, [clientId, fetchClientData, fetchClientTags])

  useEffect(() => {
    if (clientId && !tripsLoaded) {
      fetchClientTrips()
    }
  }, [clientId, fetchClientTrips, tripsLoaded])

  useEffect(() => {
    if (clientId && !offersLoaded) {
      fetchClientSpecialOffers()
    }
  }, [clientId, fetchClientSpecialOffers, offersLoaded])

  useEffect(() => {
    if (clientId && tripsLoaded && tabValue === 0) {
      fetchClientTrips()
    }
  }, [clientId, fetchClientTrips, tabValue, tripPageNumber, tripPageSize, tripsLoaded])

  useEffect(() => {
    if (clientId && offersLoaded && tabValue === 1) {
      fetchClientSpecialOffers()
    }
  }, [clientId, fetchClientSpecialOffers, tabValue, offerPageNumber, offerPageSize, offersLoaded])

  useEffect(() => {
    return () => {
      saveCurrentState()
    }
  }, [saveCurrentState])

  const saveScrollPosition = useCallback(() => {
    const currentScrollPos = window.scrollY

    if (tabValue === 0) {
      tripsTabScrollPos.current = currentScrollPos
    } else if (tabValue === 1) {
      offersTabScrollPos.current = currentScrollPos
    } else if (tabValue === 2) {
      historyTabScrollPos.current = currentScrollPos
    }
  }, [tabValue])

  const handleDeleteClient = async () => {
    if (!clientId) return

    try {
      await axios.delete(`${API_URL}/Client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      setSnackbar({
        open: true,
        message: "Klientas sėkmingai ištrintas",
        severity: "success",
      })

      navigateBack()
    } catch (err: any) {
      setError("Nepavyko ištrinti kliento.")
      setSnackbar({
        open: true,
        message: "Nepavyko ištrinti kliento",
        severity: "error",
      })
    }
  }

  const handleEditClient = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchClientData()
  }

  const handleTagClick = () => {
    setIsTagModalOpen(true)
  }

  const openDeleteDialog = () => setDeleteDialogOpen(true)
  const closeDeleteDialog = () => setDeleteDialogOpen(false)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    saveScrollPosition()

    setTabValue(newValue)

    setTimeout(() => {
      if (newValue === 0) {
        window.scrollTo(0, tripsTabScrollPos.current)
      } else if (newValue === 1) {
        window.scrollTo(0, offersTabScrollPos.current)
      } else if (newValue === 2) {
        window.scrollTo(0, historyTabScrollPos.current)
      }
    }, 50)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleTripClick = (tripId: string) => {
    saveCurrentState()

    setNavigationSource("client-details")

    if (clientId) {
      setSourceClientId(clientId)
    }

    navigate(`/admin-trip-list/${tripId}`)
  }

  const handleSpecialOfferClick = (offerId: string) => {
    saveCurrentState()

    setNavigationSource("client-details")

    if (clientId) {
      setSourceClientId(clientId)
    }

    navigate(`/special-offers/${offerId}`)
  }

  const handleCreateOffer = () => {
    if (client) {
      navigate(
        `/special-offers/create?clientId=${clientId}&clientName=${encodeURIComponent(`${client.name} ${client.surname}`)}`,
      )
    } else {
      navigate("/special-offers/create")
    }
  }

  const handleTripPageChange = (newPage: number) => {
    setTripPageNumber(newPage)
  }

  const handleTripPageSizeChange = (newPageSize: number) => {
    setTripPageSize(newPageSize)
    setTripPageNumber(1) 
  }

  const handleOfferPageChange = (newPage: number) => {
    setOfferPageNumber(newPage)
  }

  const handleOfferPageSizeChange = (newPageSize: number) => {
    setOfferPageSize(newPageSize)
    setOfferPageNumber(1) 
  }

  const tripTotalPages = Math.ceil(tripTotalCount / tripPageSize)
  const offerTotalPages = Math.ceil(offerTotalCount / offerPageSize)

  return (
    <Box sx={{ maxWidth: "xl", margin: "0 auto", padding: "20px" }}>
      {isClientLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : client ? (
        <>
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
            onCreateOffer={handleCreateOffer}
          />

          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {client.name} {client.surname}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PhoneIcon color="primary" fontSize="small" />
                      <Typography variant="body1">{client.phoneNumber}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EmailIcon color="primary" fontSize="small" />
                      <Link href={`mailto:${client.email}`} underline="hover" color="primary" sx={{ fontWeight: 400 }}>
                        {client.email}
                      </Link>
                    </Box>

                    {isValidDate(client.birthday) && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CakeIcon color="primary" fontSize="small" />
                        <Typography variant="body1">
                          {new Date(client.birthday!).toLocaleDateString("lt-LT")}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {clientTags.length > 0 && (
                    <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {clientTags.map((tag) => (
                        <Chip
                          key={tag.tagId}
                          label={tag.tagName}
                          size="small"
                          sx={{
                            backgroundColor: categoryColors[tag.category],
                            color: "white",
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {client.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="body1"
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.03)",
                          p: 2,
                          borderRadius: 2,
                          whiteSpace: "pre-wrap",
                          textAlign: "left",
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
              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                  <PageSizeSelector
                    pageSize={tripPageSize}
                    onPageSizeChange={handleTripPageSizeChange}
                    options={pageSizeOptions}
                  />
                </Box>

                {isTripsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : clientTrips.length > 0 ? (
                  <>
                    {clientTrips.map((trip) => (
                      <ClientsTripListCard key={trip.id} trip={trip} onClick={handleTripClick} />
                    ))}

                    <Box sx={{ mt: 4, mb: 2 }}>
                      <Pagination
                        currentPage={tripPageNumber}
                        totalPages={tripTotalPages}
                        onPageChange={handleTripPageChange}
                      />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                    Klientas dar neturi kelionių.
                  </Typography>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                  <PageSizeSelector
                    pageSize={offerPageSize}
                    onPageSizeChange={handleOfferPageSizeChange}
                    options={pageSizeOptions}
                  />
                </Box>

                {isOffersLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : clientSpecialOffers.length > 0 ? (
                  <>
                    <Grid container spacing={2}>
                      {clientSpecialOffers.map((offer) => (
                        <Grid item xs={12} sm={6} key={offer.id}>
                          <SpecialOfferCard offer={offer} onClick={handleSpecialOfferClick} />
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ mt: 4, mb: 2 }}>
                      <Pagination
                        currentPage={offerPageNumber}
                        totalPages={offerTotalPages}
                        onPageChange={handleOfferPageChange}
                      />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                    Klientas dar neturi specialių pasiūlymų.
                  </Typography>
                )}
              </Box>
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

          <ConfirmationDialog
            open={deleteDialogOpen}
            title="Ištrinti klientą"
            message="Ar tikrai norite ištrinti šį klientą? Šis veiksmas yra negrįžtamas, bus ištrinta visa susijusi informacija."
            onConfirm={handleDeleteClient}
            onCancel={closeDeleteDialog}
          />

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

          <ClientFormModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            clientId={clientId}
          />

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

export default ClientDetail
