"use client"

import type React from "react"
import { Box, Grid } from "@mui/material"
import StatsCard from "../components/StatCard"
import Calendar from "../components/Calendar"
import TripRequestList from "../components/TripRequestList"

export const mockStats = {
  currentlyTraveling: 2,
  pendingReviews: 3,
  upcomingTrips: 5,
  completedTrips: 8,
}

const Workspace: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
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

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '100%' }}>
            <TripRequestList />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ height: '100%', mt: { xs: 2, md: 0 } }}>
            <Calendar />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Workspace

