"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Box, Typography, Collapse, Paper, IconButton, CircularProgress, Alert, styled } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import axios from "axios"
import { type TripRequestResponse, TripRequestStatus } from "../types/TripRequest"
import TripRequestCard from "./TripRequestCard"
import TripRequestModal from "./TripRequestModal"
import { API_URL } from "../Utils/Configuration"

const CollapsibleHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
  cursor: "pointer",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
}))

// Consistent typography styles
const typographyStyles = {
  fontSize: "1rem",
  fontWeight: 400,
}

const TripRequestList: React.FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [requests, setRequests] = useState<TripRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Use refs to prevent UI glitches during polling
  const requestsRef = useRef<TripRequestResponse[]>([])
  const loadingRef = useRef(false)

  const fetchRequests = async () => {
    // Skip if already loading
    if (loadingRef.current) return

    loadingRef.current = true

    try {
      const response = await axios.get<TripRequestResponse[]>(`${API_URL}/TripRequest`)

      // Only update state if data has changed
      const newData = response.data
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(requestsRef.current)

      if (hasChanged) {
        setRequests(newData)
        requestsRef.current = newData

        // Auto-expand if there are new requests and it's the first load
        if (newData.some((req) => req.status === TripRequestStatus.New) && requestsRef.current.length === 0) {
          setExpanded(true)
        }
      }

      setError(null)
    } catch (err) {
      console.error("Klaida gaunant užklausas:", err)
      setError("Nepavyko gauti kelionių užklausų.")
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    setLoading(true)
    fetchRequests()

    // Set up polling every 60 seconds
    const interval = setInterval(fetchRequests, 60000)

    return () => clearInterval(interval)
  }, [])

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const handleCardClick = (id: string) => {
    setSelectedRequestId(id)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    // Refresh the list after modal is closed to get updated statuses
    fetchRequests()
  }

  const newRequestsCount = requests.filter((req) => req.status === TripRequestStatus.New).length

  return (
    <>
      <Paper sx={{ overflow: "hidden" }}>
        <CollapsibleHeader onClick={toggleExpanded}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography sx={{ ...typographyStyles }}>Kelionių užklausos</Typography>
            {newRequestsCount > 0 && (
              <Box
                sx={{
                  ml: 2,
                  backgroundColor: "error.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                {newRequestsCount}
              </Box>
            )}
          </Box>
          <IconButton size="small" sx={{ color: "inherit" }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </CollapsibleHeader>

        <Collapse in={expanded}>
          <Box sx={{ p: 2, maxHeight: "60vh", overflowY: "auto" }}>
            {loading && requests.length === 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && requests.length === 0 && (
              <Typography sx={{ ...typographyStyles, textAlign: "center", p: 2, color: "text.secondary" }}>
                Nėra kelionių užklausų.
              </Typography>
            )}

            {requests.length > 0 && (
              <Box>
                {requests.map((request) => (
                  <TripRequestCard key={request.id} request={request} onClick={handleCardClick} />
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      <TripRequestModal open={modalOpen} onClose={handleModalClose} requestId={selectedRequestId} />
    </>
  )
}

export default TripRequestList

