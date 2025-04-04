import type React from "react"
import { Typography, Container } from "@mui/material"
import WizardForm from "../components/ClientTripWizard/CreateTripWizardForm"

const WizardFormPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nauja kliento kelionė
      </Typography>
      <WizardForm />
    </Container>
  )
}

export default WizardFormPage

