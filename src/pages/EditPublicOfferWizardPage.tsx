"use client"

import { Container, Typography } from "@mui/material"
import { useParams } from "react-router-dom"
import EditPublicOfferWizardForm from "../components/PublicOfferWizard/EditPublicOfferWizardForm"

export default function EditPublicOfferWizardPage() {
  const { tripId } = useParams<{ tripId: string }>()

  console.log("Trip ID from params:", tripId) // Add this for debugging

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Redaguoti kelionės pasiūlymą
      </Typography>
      {tripId ? (
        <EditPublicOfferWizardForm tripId={tripId} />
      ) : (
        <Typography color="error">Nepavyko gauti pasiūlymo ID</Typography>
      )}
    </Container>
  )
}
