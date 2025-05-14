"use client"

import type React from "react"
import { Grid, Typography, Paper, Box, Chip, List, ListItem, ListItemIcon, ListItemText, useTheme } from "@mui/material"
import { CalendarMonth, Person, Category, Euro, Group, ChildCare, LocationOn } from "@mui/icons-material"
import type { TripFormData } from "../../../types"

interface TripInfoCardProps {
  tripData: TripFormData
  hideHighlighting?: boolean
}

const TripInfoCard: React.FC<TripInfoCardProps> = ({ tripData, hideHighlighting = false }) => {
  const theme = useTheme()

  const getCategoryLabel = (category: string): string => {
    const categories: Record<string, string> = {
      Tourist: "Pažintinė",
      Group: "Grupinė",
      Relax: "Poilsinė",
      Business: "Verslo",
      Cruise: "Kruizas",
    }
    return categories[category] || category || "Nepasirinkta"
  }

  const shouldHighlight = (condition: boolean): boolean => {
    return !hideHighlighting && condition
  }

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            mb: 3,
            fontWeight: 500,
            color: theme.palette.primary.main,
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {tripData.tripName || (
            <Typography
              component="span"
              color={hideHighlighting ? "text.primary" : "#ED6C02"}
              fontStyle={hideHighlighting ? "normal" : "italic"}
            >
              Nepavadinta kelionė
            </Typography>
          )}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <List disablePadding>
              {tripData.destination && (
                <ListItem alignItems="center" sx={{ py: 1 }}>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body1" component="span" fontWeight="bold">
                          Kelionės tikslas:
                        </Typography>
                        <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                          {tripData.destination}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )}

              <ListItem
                alignItems="center"
                sx={{
                  py: 1,
                  bgcolor: shouldHighlight(!tripData.startDate || !tripData.endDate)
                    ? "rgba(255, 167, 38, 0.08)"
                    : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <CalendarMonth color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Kelionės datos:
                      </Typography>
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {tripData.startDate && tripData.endDate ? (
                          `${tripData.startDate} - ${tripData.endDate}`
                        ) : (
                          <Typography
                            component="span"
                            color={hideHighlighting ? "text.primary" : "#ED6C02"}
                            fontStyle={hideHighlighting ? "normal" : "italic"}
                          >
                            Nenustatyta
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem
                alignItems="center"
                sx={{
                  py: 1,
                  bgcolor: shouldHighlight(!tripData.category) ? "rgba(255, 167, 38, 0.08)" : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <Category color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Kategorija:
                      </Typography>
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {tripData.category ? (
                          getCategoryLabel(tripData.category)
                        ) : (
                          <Typography
                            component="span"
                            color={hideHighlighting ? "text.primary" : "#ED6C02"}
                            fontStyle={hideHighlighting ? "normal" : "italic"}
                          >
                            Nepasirinkta
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <List disablePadding>
              <ListItem
                alignItems="center"
                sx={{
                  py: 1,
                  bgcolor: shouldHighlight(!tripData.clientName || tripData.clientName?.trim() === "")
                    ? "rgba(255, 167, 38, 0.08)"
                    : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <Person color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Klientas:
                      </Typography>
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {tripData.clientName && tripData.clientName.trim() !== "" ? (
                          `${tripData.clientName}`
                        ) : (
                          <Typography
                            component="span"
                            color={hideHighlighting ? "text.primary" : "#ED6C02"}
                            fontStyle={hideHighlighting ? "normal" : "italic"}
                          >
                            Nepasirinkta
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem
                alignItems="center"
                sx={{
                  py: 1,
                  bgcolor: shouldHighlight(!tripData.adultsCount || tripData.adultsCount === 0)
                    ? "rgba(255, 167, 38, 0.08)"
                    : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <Group color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Keliautojų skaičius:
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, ml: 1, flexWrap: "wrap", mt: 0.5 }}>
                        <Chip
                          icon={<Group fontSize="small" />}
                          label={`${tripData.adultsCount || 0} suaugę`}
                          size="small"
                          color={
                            shouldHighlight(!tripData.adultsCount || tripData.adultsCount === 0) ? "warning" : "default"
                          }
                        />
                        {tripData.childrenCount && tripData.childrenCount > 0 && (
                          <Chip
                            icon={<ChildCare fontSize="small" />}
                            label={`${tripData.childrenCount} vaikai`}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>

              <ListItem
                alignItems="center"
                sx={{
                  py: 1,
                  bgcolor: shouldHighlight(!tripData.price || tripData.price === 0)
                    ? "rgba(255, 167, 38, 0.08)"
                    : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <Euro color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Bendra kaina:
                      </Typography>
                      <Box sx={{ ml: 1 }}>
                        {tripData.price ? (
                          <Chip
                            label={`${tripData.price} €`}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: "medium" }}
                          />
                        ) : (
                          <Typography
                            component="span"
                            color={hideHighlighting ? "text.primary" : "#ED6C02"}
                            fontStyle={hideHighlighting ? "normal" : "italic"}
                          >
                            0.00 €
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </List>

            {tripData.description && (
              <Box sx={{ mt: 2 }}>
                <ListItem alignItems="flex-start" sx={{ py: 1, pl: 0 }}>
                  <ListItemIcon>
                    <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography
                          variant="body1"
                          component="span"
                          fontWeight="bold"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Aprašymas:
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            textAlign: "left",
                          }}
                        >
                          {tripData.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  )
}

export default TripInfoCard
