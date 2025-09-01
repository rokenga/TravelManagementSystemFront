"use client"

import React from "react"
import { useState, useEffect, useContext, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Grid,
  Link,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { UserContext } from "../contexts/UserContext"
import { Business, Person, Email, Phone, Language, LocationOn, AccountBalance, Code } from "@mui/icons-material"
import { API_URL } from "../Utils/Configuration"
import { useNavigation } from "../contexts/NavigationContext"
import ActionBar from "../components/ActionBar"
import CompanyFormModal from "../components/CompanyFormModal"
import ConfirmationDialog from "../components/ConfirmationDialog"
import CustomSnackbar from "../components/CustomSnackBar"
import type { CompanyWithEmployeesResponse } from "../types/Company"

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

const getAvatarColor = (name: string) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
  const charCode = name.charCodeAt(0)
  return colors[charCode % colors.length]
}

const CompanyDetail = () => {
  const user = useContext(UserContext)
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const { savePageState, navigateBack } = useNavigation()

  const [company, setCompany] = useState<CompanyWithEmployeesResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  const fetchCompanyData = useCallback(async () => {
    if (!companyId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.get<CompanyWithEmployeesResponse>(`${API_URL}/Company/${companyId}/employees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      setCompany(response.data)
    } catch (err: any) {
      setError("Nepavyko gauti įmonės duomenų.")
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId, fetchCompanyData])

  const handleDeleteCompany = async () => {
    if (!companyId) return

    try {
      await axios.delete(`${API_URL}/Company/${companyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })

      setSnackbar({
        open: true,
        message: "Įmonė sėkmingai ištrinta",
        severity: "success",
      })

      setTimeout(() => {
        navigateBack()
      }, 1500)
    } catch (err: any) {
      setError("Nepavyko ištrinti įmonės.")
      setSnackbar({
        open: true,
        message: "Nepavyko ištrinti įmonės",
        severity: "error",
      })
    }
  }

  const handleEditCompany = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchCompanyData()
  }

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/admin-client-list/${employeeId}`)
  }

  const openDeleteDialog = () => setDeleteDialogOpen(true)
  const closeDeleteDialog = () => setDeleteDialogOpen(false)

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box sx={{ maxWidth: "xl", margin: "0 auto", padding: "20px" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : company ? (
        <>
          <ActionBar
            backUrl="/admin-client-list"
            showBackButton={true}
            showEditButton={user?.role === "Admin" || user?.role === "Agent"}
            showDeleteButton={user?.role === "Admin" || user?.role === "Agent"}
            onEdit={handleEditCompany}
            onDelete={openDeleteDialog}
            onBackClick={navigateBack}
          />

          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(company.name),
                    width: 80,
                    height: 80,
                  }}
                >
                  <Business sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                    {company.name}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Code color="primary" fontSize="small" />
                          <Typography variant="body1">
                            <strong>Įmonės kodas:</strong> {company.companyCode}
                          </Typography>
                        </Box>

                        {company.vatCode && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <AccountBalance color="primary" fontSize="small" />
                            <Typography variant="body1">
                              <strong>PVM kodas:</strong> {company.vatCode}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Person color="primary" fontSize="small" />
                          <Typography variant="body1">
                            <strong>Darbuotojų skaičius:</strong> {company.employees.length}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {company.email && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Email color="primary" fontSize="small" />
                            <Link href={`mailto:${company.email}`} underline="hover" color="primary">
                              {company.email}
                            </Link>
                          </Box>
                        )}

                        {company.phoneNumber && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Phone color="primary" fontSize="small" />
                            <Typography variant="body1">{company.phoneNumber}</Typography>
                          </Box>
                        )}

                        {company.website && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Language color="primary" fontSize="small" />
                            <Link
                              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              color="primary"
                            >
                              {company.website}
                            </Link>
                          </Box>
                        )}

                        {company.address && (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <LocationOn color="primary" fontSize="small" sx={{ mt: 0.2 }} />
                            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                              {company.address}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>

          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Darbuotojai
              </Typography>
            </Box>

            {company.employees.length > 0 ? (
              <List sx={{ p: 0 }}>
                {company.employees.map((employee, index) => (
                  <React.Fragment key={employee.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => handleEmployeeClick(employee.id)} sx={{ py: 2 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(`${employee.name} ${employee.surname}`),
                              width: 48,
                              height: 48,
                            }}
                          >
                            {employee.name[0]}
                            {employee.surname[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="h6">
                                {employee.name} {employee.surname}
                              </Typography>
                              {employee.occupation && (
                                <Chip label={employee.occupation} size="small" color="primary" variant="outlined" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Email fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {employee.email}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Phone fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {employee.phoneNumber}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < company.employees.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  Šioje įmonėje dar nėra darbuotojų.
                </Typography>
              </Box>
            )}
          </Paper>

          <ConfirmationDialog
            open={deleteDialogOpen}
            title="Ištrinti įmonę"
            message="Ar tikrai norite ištrinti šią įmonę? Šis veiksmas yra negrįžtamas."
            onConfirm={handleDeleteCompany}
            onCancel={closeDeleteDialog}
          />

          <CompanyFormModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            companyId={companyId}
          />

          <CustomSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={handleCloseSnackbar}
          />
        </>
      ) : (
        <Typography>Įmonė nerasta.</Typography>
      )}
    </Box>
  )
}

export default CompanyDetail
