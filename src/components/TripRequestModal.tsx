"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Alert,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import EmailIcon from "@mui/icons-material/Email"
import PersonIcon from "@mui/icons-material/Person"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import { translateTripRequestStatus } from "../Utils/translateEnums"
import CustomSnackbar from "./CustomSnackBar"
import ConfirmationDialog from "./ConfirmationDialog"
import { UserContext } from "../contexts/UserContext" 
import TripRequestStatusChangeDialog from "./status/TripRequestStatusChangeModal"
import { useNavigate } from "react-router-dom"

interface TripRequestModalProps {
  open: boolean
  onClose: () => void
  requestId: string | null
}

const getStatusColor = (status: TripRequestStatus) => {
  switch (status) {
    case TripRequestStatus.New:
      return "#4caf50" 
    case TripRequestStatus.Confirmed:
      return "#2196f3"
    case TripRequestStatus.Completed:
      return "#757575" 
    default:
      return "#757575"
  }
}

const TripRequestModal: React.FC<TripRequestModalProps> = ({ open, onClose, requestId }) => {
  const user = useContext(UserContext)
  const isAdmin = user?.role === "Admin"
  const navigate = useNavigate()
  const [request, setRequest] = useState<TripRequestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [clientCreationLoading, setClientCreationLoading] = useState(false)

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchorEl)

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails(requestId)
    } else {
      setRequest(null)
    }
  }, [open, requestId])

  const fetchRequestDetails = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<TripRequestResponse>(`${API_URL}/TripRequest/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      setRequest(response.data)
    } catch (err) {
      setError("Nepavyko gauti užklausos detalių.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClick = () => {
    setConfirmDialogOpen(true)
  }

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false)
  }

  const handleConfirm = async () => {
    if (!request) return
    setConfirmDialogOpen(false)
    setActionLoading(true)

    try {
      await axios.put(`${API_URL}/TripRequest/${request.id}/confirm`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      fetchRequestDetails(request.id)
      setSnackbar({ open: true, message: "Užklausa sėkmingai patvirtinta!", severity: "success" })
    } catch (err: any) {

      if (err.response && err.response.status === 404) {
        setSnackbar({
          open: true,
          message: "Užklausa jau buvo patvirtinta kito agento.",
          severity: "error",
        })
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko patvirtinti užklausos.",
          severity: "error",
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendEmail = () => {
    if (!request) return

    const subject = `Kelionės užklausa - ${request.fullName}`

    const body = `Sveiki ${request.fullName},\n\nDėkojame už jūsų kelionės užklausą.\n\n`

    const mailtoLink = `mailto:${request.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = mailtoLink
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false)
  }

  const handleChangeStatusClick = () => {
    handleMenuClose()
    setStatusDialogOpen(true)
  }

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false)
  }

  const handleStatusChangeSuccess = () => {
    fetchRequestDetails(requestId!)
    setSnackbar({
      open: true,
      message: "Užklausos statusas sėkmingai pakeistas!",
      severity: "success",
    })
  }

  const handleCreateClient = async () => {
    if (!request) return
    setClientCreationLoading(true)
    handleMenuClose() 

    try {
      const response = await axios.post(`${API_URL}/TripRequest/${request.id}/create-client`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSnackbar({
        open: true,
        message: `Klientas "${request.fullName}" sėkmingai sukurtas!`,
        severity: "success",
      })

      if (response.data && response.data.id) {
        setTimeout(() => {
          navigate(`/admin-client-list/${response.data.id}`)
        }, 1500) 
      }
    } catch (err: any) {

      if (err.response && err.response.data && err.response.data.error) {
        setSnackbar({
          open: true,
          message: err.response.data.error,
          severity: "error",
        })
      } else {
        setSnackbar({
          open: true,
          message: "Nepavyko sukurti kliento.",
          severity: "error",
        })
      }
    } finally {
      setClientCreationLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!request) return
    setDeleteDialogOpen(false)
    setActionLoading(true)

    try {
      await axios.delete(`${API_URL}/TripRequest/${request.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      setSnackbar({
        open: true,
        message: "Kelionės užklausa sėkmingai ištrinta!",
        severity: "success",
      })

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {

      setSnackbar({
        open: true,
        message: "Nepavyko ištrinti užklausos. Patikrinkite savo teises.",
        severity: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const showAgentInfo = isAdmin && (request?.agentFirstName || request?.agentLastName || request?.agentId)
  const agentName =
    request && showAgentInfo ? `${request.agentFirstName || ""} ${request.agentLastName || ""}`.trim() : ""

  const canDelete =
    request &&
    ((isAdmin && request.status === TripRequestStatus.New && !request.agentId) || 
      (request.status === TripRequestStatus.Confirmed && request.agentId === user?.id)) 

  const canChangeStatus = request && request.agentId === user?.id 

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 5,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5">Kelionės užklausa</Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {request && !loading && !error && (
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              {request.status === TripRequestStatus.New && (
                <Button
                  startIcon={<CheckCircleIcon />}
                  variant="contained"
                  color="primary"
                  onClick={handleConfirmClick}
                  disabled={actionLoading}
                  sx={{ textTransform: "none" }}
                >
                  Patvirtinti
                </Button>
              )}
              {request.status === TripRequestStatus.Confirmed && (
                <>
                  <Button
                    startIcon={<EmailIcon />}
                    variant="contained"
                    color="primary"
                    onClick={handleSendEmail}
                    sx={{ textTransform: "none" }}
                  >
                    Siųsti el. laišką
                  </Button>
                </>
              )}
            </Box>

            <IconButton
              aria-label="more"
              aria-controls="trip-request-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        )}

        <DialogContent sx={{ p: 3, minHeight: "400px" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : request ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Chip
                  label={translateTripRequestStatus(request.status)}
                  sx={{
                    bgcolor: getStatusColor(request.status),
                    color: "white",
                    fontWeight: 500,
                    px: 1,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Sukurta: {format(new Date(request.createdAt), "yyyy-MM-dd HH:mm", { locale: lt })}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mb: 2 }}>
                  Kliento informacija
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body1">
                    <strong>Vardas ir pavardė:</strong> {request.fullName}
                  </Typography>

                  {request.status === TripRequestStatus.Confirmed && (
                    <>
                      <Typography variant="body1">
                        <strong>El. paštas:</strong> {request.email}
                      </Typography>

                      {request.phoneNumber && (
                        <Typography variant="body1">
                          <strong>Tel. numeris:</strong> {request.phoneNumber}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {showAgentInfo && (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Agento informacija
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body1">{agentName || "Nežinomas agentas"}</Typography>
                  </Box>
                </Box>
              )}

              {request.message && (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Žinutė
                  </Typography>
                  <Typography variant="body1">{request.message}</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography textAlign="center" color="text.secondary">
              Nėra duomenų
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Menu
        id="trip-request-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "trip-request-menu-button",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
          },
        }}
      >
        {canChangeStatus && (
          <MenuItem onClick={handleChangeStatusClick}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Keisti statusą</ListItemText>
          </MenuItem>
        )}

        {request?.status === TripRequestStatus.Confirmed && request.agentId === user?.id && (
          <MenuItem onClick={handleCreateClient} disabled={clientCreationLoading}>
            <ListItemIcon>
              <PersonAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sukurti klientą</ListItemText>
            {clientCreationLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </MenuItem>
        )}

        {canDelete && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Ištrinti</ListItemText>
          </MenuItem>
        )}

        {!canDelete && !canChangeStatus && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nėra galimų veiksmų
            </Typography>
          </MenuItem>
        )}
      </Menu>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Patvirtinti užklausą"
        message="Ar tikrai norite patvirtinti užklausą? Kiti agentai jos nebematys ir užklausa atiteks jums."
        onConfirm={handleConfirm}
        onCancel={handleConfirmDialogClose}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Ištrinti užklausą"
        message="Ar tikrai norite ištrinti šią kelionės užklausą? Šio veiksmo negalėsite atšaukti."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteDialogClose}
      />

      {request && (
        <TripRequestStatusChangeDialog
          open={statusDialogOpen}
          requestId={request.id}
          currentStatus={request.status}
          onClose={handleStatusDialogClose}
          onSuccess={handleStatusChangeSuccess}
        />
      )}

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  )
}

export default TripRequestModal
