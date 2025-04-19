"use client"

import type React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from "@mui/material"
import { Email as EmailIcon, Phone as PhoneIcon } from "@mui/icons-material"
import type { ClientResponse } from "../types/Client"

interface ClientsTableProps {
  clients: ClientResponse[]
  onClientClick: (clientId: string) => void
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onClientClick }) => {
  // Function to format birthday
  const formatBirthday = (birthday: string): string => {
    return new Date(birthday).toLocaleDateString("lt-LT")
  }

  // Function to determine if a client is new (created in the last 30 days)
  const isNewClient = (createdAt: string): boolean => {
    const creationDate = new Date(createdAt)
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    return creationDate >= thirtyDaysAgo
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Vardas</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Pavardė</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>El. paštas</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Telefono nr.</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Gimimo data</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Sukurta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Klientų nerasta
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client, index) => (
                <TableRow
                  key={client.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "background.default" : "background.paper",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => onClientClick(client.id)}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {client.name}
                      {isNewClient(client.createdAt.toString()) && (
                        <Chip
                          label="Naujas"
                          color="success"
                          size="small"
                          sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                      {client.isTransferred && client.transferredFromAgentName && (
                        <Chip
                          label="Perkeltas"
                          color="info"
                          size="small"
                          sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                          title={`Perkeltas nuo: ${client.transferredFromAgentName}`}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{client.surname}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                      {client.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                      {client.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell>{formatBirthday(client.birthday.toString())}</TableCell>
                  <TableCell>{new Date(client.createdAt).toLocaleDateString("lt-LT")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ClientsTable
