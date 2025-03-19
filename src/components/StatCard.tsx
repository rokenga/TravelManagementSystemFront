import type React from "react"
import { Paper, Typography } from "@mui/material"

interface StatsCardProps {
  title: string
  value: number
  color?: string
}

// Consistent typography styles
const typographyStyles = {
  fontSize: "1rem",
  fontWeight: 400,
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, color = "primary.main" }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderTop: 3,
        borderColor: color,
      }}
    >
      <Typography align="center" color={color} sx={{ ...typographyStyles, fontSize: "2rem", fontWeight: 500 }}>
        {value}
      </Typography>
      <Typography align="center" color="text.secondary" sx={{ ...typographyStyles }}>
        {title}
      </Typography>
    </Paper>
  )
}

export default StatsCard

