"use client"

import type React from "react"
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from "@mui/material"

const PublicSpecialOffers: React.FC = () => {
  const offers = [
    { id: 1, name: "Poilsis Maldyvuose", category: "Poilsio", price: 2000 },
    { id: 2, name: "Žygis Alpėse", category: "Nuotykių", price: 1200 },
    { id: 3, name: "Prabangus kruizas", category: "Prabangos", price: 3000 },
  ]

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Viešai skelbiami pasiūlymai
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {offers.map((offer) => (
              <Grid item xs={12} key={offer.id}>
                <Card>
                  <CardActionArea>
                    <CardContent>
                      <Typography variant="h6">{offer.name}</Typography>
                      <Typography variant="body2">Kategorija: {offer.category}</Typography>
                      <Typography variant="body2">Kaina: €{offer.price}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default PublicSpecialOffers

