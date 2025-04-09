"use client"

import type React from "react"

import { useState } from "react"
import { Container, Typography, Box, TextField, Button, Paper } from "@mui/material"
import LeafletMapDisplay from "../components/LeafletMapDisplay"

export default function MapLocationPage() {
  const [address, setAddress] = useState("")
  const [displayAddress, setDisplayAddress] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDisplayAddress(address)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Žemėlapio vietos paieška
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
            <TextField
              fullWidth
              label="Įveskite adresą arba koordinates"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Pvz.: Vilnius, Lithuania arba 54.687157,25.279652"
              helperText="Galite įvesti adresą arba tikslias koordinates (platuma,ilguma)"
            />
            <Button type="submit" variant="contained" sx={{ minWidth: 120 }} disabled={!address.trim()}>
              Rodyti
            </Button>
          </Box>
        </form>

        {displayAddress ? (
          <Box sx={{ height: 500, width: "100%" }}>
            <LeafletMapDisplay address={displayAddress} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 10 }}>
            Įveskite adresą arba koordinates, kad pamatytumėte žemėlapį
          </Typography>
        )}
      </Paper>
    </Container>
  )
}

