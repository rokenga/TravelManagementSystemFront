"use client"
import { Container, Typography } from "@mui/material"
import CreatePublicOfferWizardForm from "../components/PublicOfferWizard/CreatePublicOfferWizardForm"

export default function PublicOfferCreationForm() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Viešas kelionės pasiūlymas
      </Typography>
      <CreatePublicOfferWizardForm />
    </Container>
  )
}
