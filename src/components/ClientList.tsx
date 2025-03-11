import type React from "react"
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { mockClients } from "../pages/Workspace"

interface ClientListProps {
  filter: string
}

const ClientList: React.FC<ClientListProps> = ({ filter }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const filteredClients = mockClients.filter((client) => {
    switch (filter) {
      case "traveling":
        return client.status === "Keliauja"
      case "reviews":
        return client.status === "Laukia peržiūros"
      case "upcoming":
        return client.status === "Būsima"
      case "completed":
        return client.status === "Užbaigta"
      default:
        return true
    }
  })

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Kliento vardas</TableCell>
            {!isMobile && <TableCell>Kelionės tikslas</TableCell>}
            <TableCell>Pradžios data</TableCell>
            {!isMobile && <TableCell>Pabaigos data</TableCell>}
            <TableCell>Būsena</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.name}</TableCell>
              {!isMobile && <TableCell>{client.destination}</TableCell>}
              <TableCell>{client.startDate}</TableCell>
              {!isMobile && <TableCell>{client.endDate}</TableCell>}
              <TableCell>{client.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ClientList

