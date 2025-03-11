import type React from "react"
import { Box, Typography, Grid, Avatar, Divider, Card, CardContent, Chip } from "@mui/material"
import { Email, Flight, TrendingUp, Euro, People, PersonAdd } from "@mui/icons-material";
import type { Agent } from "../types/AdminsAgent"

interface AgentCardProps {
  agent: Agent
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  // Calculate percentage increase for new trips and clients
  const tripsPercentage = agent.totalTrips > 0 ? Math.round((agent.newTripsThisMonth / agent.totalTrips) * 100) : 0

  const clientsPercentage =
    agent.totalClients > 0 ? Math.round((agent.newClientsThisMonth / agent.totalClients) * 100) : 0


    return (
        <Box>
          {/* Agent Profile Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "primary.main",
                    fontSize: "2rem",
                  }}
                >
                  {agent.email ? agent.email.charAt(0).toUpperCase() : "?"}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    Agentas {/* Could be agent's name, then email, then phone */}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <Email sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} />
                    <Typography variant="body1" color="text.secondary">
                      {agent.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid> {/* ✅ Correctly closed the Grid container */}

      <Divider sx={{ mb: 4 }} />

      {/* Performance Metrics */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Veiklos rodikliai
      </Typography>

      <Grid container spacing={3}>
        {/* Trips Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              boxShadow: 2,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-5px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography color="text.secondary" gutterBottom>
                  Kelionės
                </Typography>
                <Avatar sx={{ bgcolor: "primary.light", width: 40, height: 40 }}>
                  <Flight />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold", my: 1 }}>
                {agent.totalTrips}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ color: "success.main", mr: 0.5, fontSize: 18 }} />
                <Typography variant="body2" color="success.main">
                  +{agent.newTripsThisMonth} šį mėnesį ({tripsPercentage}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              boxShadow: 2,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-5px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography color="text.secondary" gutterBottom>
                  Pajamos
                </Typography>
                <Avatar sx={{ bgcolor: "success.light", width: 40, height: 40 }}>
                  <Euro />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold", my: 1 }}>
                €{agent.totalRevenue.toFixed(2)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Vidutiniškai €{(agent.totalTrips > 0 ? agent.totalRevenue / agent.totalTrips : 0).toFixed(2)} per
                  kelionę
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Clients Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              boxShadow: 2,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-5px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography color="text.secondary" gutterBottom>
                  Klientai
                </Typography>
                <Avatar sx={{ bgcolor: "info.light", width: 40, height: 40 }}>
                  <People />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold", my: 1 }}>
                {agent.totalClients}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PersonAdd sx={{ color: "info.main", mr: 0.5, fontSize: 18 }} />
                <Typography variant="body2" color="info.main">
                  +{agent.newClientsThisMonth} šį mėnesį ({clientsPercentage}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AgentCard

