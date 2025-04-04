"use client"
import { Container, Typography } from "@mui/material"
import CreateClientOfferWizardForm from "../components/ClientOfferWizard/CreateClientOfferWizardForm"

export default function SpecialOfferCreationForm() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Kelionės pasiūlymas klientui
      </Typography>
      <CreateClientOfferWizardForm />
      </Container>
  )
}
