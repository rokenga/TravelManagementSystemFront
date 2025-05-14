"use client"

import type React from "react"
import { Grid, Card, CardContent, Typography, Box, Avatar } from "@mui/material"
import { People, Flight, LocalOffer, AttachMoney } from "@mui/icons-material"
import type { Agent } from "../types/AdminsAgent"

interface AgentSummaryCardsProps {
  agent: Agent
}

const AgentSummaryCards: React.FC<AgentSummaryCardsProps> = ({ agent }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("lt-LT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const summaryCards = [
    {
      title: "Nauji klientai šį mėnesį",
      value: agent.newClientsThisMonth,
      icon: <People />,
      color: "info.light",
    },
    {
      title: "Naujos kelionės šį mėnesį",
      value: agent.newClientTripsThisMonth,
      icon: <Flight />,
      color: "primary.light",
    },
    {
      title: "Nauji pasiūlymai šį mėnesį",
      value: agent.newClientTripOffersThisMonth,
      icon: <LocalOffer />,
      color: "warning.light",
    },
    {
      title: "Kelionių kaina šį mėnesį",
      value: formatCurrency(agent.thisMonthsRevenue),
      icon: <AttachMoney />,
      color: "success.light",
    },
  ]

  return (
    <Grid container spacing={3}>
      {summaryCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
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
                  {card.title}
                </Typography>
                <Avatar sx={{ bgcolor: card.color, width: 40, height: 40 }}>{card.icon}</Avatar>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: "bold", my: 1 }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default AgentSummaryCards
