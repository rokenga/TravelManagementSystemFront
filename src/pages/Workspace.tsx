"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import StatsCard from "../components/StatCard"
import Calendar from "../components/Calendar"
import ClientList from "../components/ClientList"

const drawerWidth = 240

export const mockClients = [
  {
    id: 1,
    name: "Jonas Jonaitis",
    destination: "Paryžius",
    startDate: "2024-02-15",
    endDate: "2024-02-22",
    status: "Keliauja",
  },
  {
    id: 2,
    name: "Eglė Eglaitė",
    destination: "Tokijas",
    startDate: "2024-03-01",
    endDate: "2024-03-10",
    status: "Laukia peržiūros",
  },
  {
    id: 3,
    name: "Mykolas Rudasis",
    destination: "Barselona",
    startDate: "2024-02-01",
    endDate: "2024-02-08",
    status: "Užbaigta",
  },
  {
    id: 4,
    name: "Saulė Daukšaitė",
    destination: "Roma",
    startDate: "2024-04-05",
    endDate: "2024-04-12",
    status: "Būsima",
  },
  {
    id: 5,
    name: "Jokūbas Jankauskas",
    destination: "Niujorkas",
    startDate: "2024-02-10",
    endDate: "2024-02-17",
    status: "Keliauja",
  },
]

export const mockStats = {
  currentlyTraveling: 2,
  pendingReviews: 3,
  upcomingTrips: 5,
  completedTrips: 8,
}

export const mockListItems = [
  { id: "traveling", label: "Šiuo metu keliauja" },
  { id: "reviews", label: "Laukia peržiūros" },
  { id: "upcoming", label: "Būsimos kelionės" },
  { id: "completed", label: "Užbaigtos kelionės" },
]

const Workspace: React.FC = () => {
  const [selectedList, setSelectedList] = useState("traveling")

  return (
    <Box sx={{ display: "flex" }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 250,
          padding: 2,
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "100vh",
          backgroundColor: "background.paper",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Filtruoti keliones
        </Typography>
        <List>
          {mockListItems.map((item) => (
            <ListItem
              button
              key={item.id}
              selected={selectedList === item.id}
              onClick={() => setSelectedList(item.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, ml: "250px", p: 3 }}>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Šiuo metu keliauja" value={mockStats.currentlyTraveling} color="#2196f3" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Laukia peržiūros" value={mockStats.pendingReviews} color="#f44336" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Būsimos kelionės" value={mockStats.upcomingTrips} color="#4caf50" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Užbaigtos kelionės" value={mockStats.completedTrips} color="#ff9800" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {mockListItems.find((item) => item.id === selectedList)?.label}
              </Typography>
              <ClientList filter={selectedList} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Calendar />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Workspace

