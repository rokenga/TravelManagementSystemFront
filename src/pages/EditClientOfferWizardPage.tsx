"use client"

import { Container, Typography } from "@mui/material"
import { useParams } from "react-router-dom"
import EditClientOfferWizardForm from "../components/ClientOfferWizard/EditClientOfferWizardForm"

export default function EditClientOfferWizardPage() {
  const { tripId } = useParams<{ tripId: string }>()

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Redaguoti kelionės pasiūlymą
      </Typography>
      {tripId && <EditClientOfferWizardForm tripId={tripId} />}
    </Container>
  )
}

