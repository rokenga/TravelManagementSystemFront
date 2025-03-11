import React from "react"
import { Container, Typography } from "@mui/material"
import WizardEditForm from "../components/WizardEditForm"

const WizardEditFormPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Redaguoti kliento kelionę
      </Typography>
      <WizardEditForm />
    </Container>
  )
}

export default WizardEditFormPage
