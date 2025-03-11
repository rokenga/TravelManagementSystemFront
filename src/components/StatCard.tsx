import type React from "react"
import { Paper, Typography } from "@mui/material"

interface StatsCardProps {
  title: string
  value: number
  color?: string
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
      <Typography variant="h4" align="center" color={color}>
        {value}
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  )
}

export default StatsCard

