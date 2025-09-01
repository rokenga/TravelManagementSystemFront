"use client"

import type React from "react"
import { Card, CardContent, CardActionArea, Typography, Chip, Box } from "@mui/material"
import { People, Email, Phone } from "@mui/icons-material"
import type { CompanyResponse } from "../types/Company"

interface CompanyCardProps {
  company: CompanyResponse & { employeeCount?: number }
  onClick?: (companyId: string) => void
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(company.id)
    }
  }

  return (
    <Card
      sx={{
        width: "100%",
        height: 140, // Reduced height
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 6,
        },
        position: "relative",
      }}
    >
      <CardActionArea
        onClick={handleCardClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            textAlign: "left",
            py: 2,
            px: 2,
            height: "100%",
            width: "100%",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: "1rem" }}>
            {company.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.8rem" }}>
            Kodas: {company.companyCode}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1, flex: 1 }}>
            {company.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Email fontSize="small" sx={{ color: "text.secondary", fontSize: "14px" }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: "0.75rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {company.email}
                </Typography>
              </Box>
            )}
            {company.phoneNumber && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Phone fontSize="small" sx={{ color: "text.secondary", fontSize: "14px" }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  {company.phoneNumber}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: "auto" }}>
            {company.employeeCount !== undefined && (
              <Chip
                icon={<People />}
                label={`${company.employeeCount} darbuotojai`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default CompanyCard
