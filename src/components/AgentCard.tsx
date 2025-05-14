import type React from "react"
import { Box, Typography, Avatar, Divider } from "@mui/material"
import { Email as EmailIcon, Person, Cake as CakeIcon } from "@mui/icons-material"
import type { Agent } from "../types/AdminsAgent"

interface AgentCardProps {
  agent: Agent
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getInitials = (firstName?: string, lastName?: string): string => {
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : ""
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : ""

    if (firstInitial || lastInitial) {
      return `${firstInitial}${lastInitial}`
    }
    return "?"
  }

  const getAvatarColor = (name?: string): string => {
    const colors = [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
      "#03A9F4",
      "#00BCD4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFC107",
      "#FF9800",
      "#FF5722",
    ]

    if (!name || name.length === 0) {
      return colors[0]
    }

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  const formatBirthdate = (birthday?: string) => {
    if (!birthday) return "Nenurodyta"

    try {
      return new Date(birthday).toLocaleDateString("lt-LT")
    } catch (error) {
      return "Neteisingas formatas"
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: getAvatarColor(`${agent.firstName || ""} ${agent.lastName || ""}`),
            width: 80,
            height: 80,
            fontSize: "2rem",
            mr: 3,
          }}
        >
          {agent.firstName || agent.lastName ? (
            getInitials(agent.firstName, agent.lastName)
          ) : (
            <Person fontSize="large" />
          )}
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {agent.firstName || agent.lastName
              ? `${agent.firstName || ""} ${agent.lastName || ""}`
              : "Nežinomas agentas"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            <EmailIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {agent.email || "Nėra el. pašto"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            <CakeIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {formatBirthdate(agent.birthday)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />
    </Box>
  )
}

export default AgentCard
