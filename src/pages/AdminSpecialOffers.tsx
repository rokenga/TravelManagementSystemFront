"use client"

import type React from "react"
import { useState } from "react"
import { Box, Tabs, Tab, useTheme, Paper, alpha } from "@mui/material"
import { PersonOutlined, PublicOutlined } from "@mui/icons-material"
import ClientSpecialOffers from "../components/ClientSpecialOffers"
import PublicSpecialOffers from "../components/PublicSpecialOffers"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{
        animation: value === index ? "fadeIn 0.5s ease-in-out" : "none",
      }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const AdminSpecialOffers: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const theme = useTheme()

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Box sx={{ width: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          mb: 3,
          "@keyframes fadeIn": {
            "0%": {
              opacity: 0,
              transform: "translateY(10px)",
            },
            "100%": {
              opacity: 1,
              transform: "translateY(0)",
            },
          },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px",
              backgroundColor: theme.palette.primary.main,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              minHeight: 64,
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: "1rem",
              },
            },
          }}
        >
          <Tab
            icon={<PersonOutlined />}
            iconPosition="start"
            label="Klientams skirti pasiūlymai"
            sx={{
              borderBottom: activeTab === 0 ? `3px solid ${theme.palette.primary.main}` : "none",
              backgroundColor: activeTab === 0 ? alpha(theme.palette.primary.main, 0.08) : "transparent",
            }}
          />
          <Tab
            icon={<PublicOutlined />}
            iconPosition="start"
            label="Viešai skelbiami pasiūlymai"
            sx={{
              borderBottom: activeTab === 1 ? `3px solid ${theme.palette.primary.main}` : "none",
              backgroundColor: activeTab === 1 ? alpha(theme.palette.primary.main, 0.08) : "transparent",
            }}
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <ClientSpecialOffers />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <PublicSpecialOffers />
      </TabPanel>
    </Box>
  )
}

export default AdminSpecialOffers

