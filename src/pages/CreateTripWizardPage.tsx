"use client"

import { useState } from "react"
import { Typography, Container, CircularProgress } from "@mui/material"
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
import { usePreventNavigation } from "../hooks/usePreventNavigation"
import WizardForm from "../components/ClientTripWizard/CreateTripWizardForm"

const WizardFormPage = () => {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    showDialog: showNavigationDialog,
    handleStay,
    handleLeave,
    pendingLocation,
  } = usePreventNavigation(hasChanges)

  const handleLeaveWithSave = async () => {
    setIsSaving(true)
    setIsLoading(true)

    if (window.saveCreateFormAsDraft) {
      try {
        const saveResult = await window.saveCreateFormAsDraft(pendingLocation)

        if (saveResult) {
          handleLeave(true)
        } else {
          setIsSaving(false)
          setIsLoading(false)
        }
      } catch (error) {
        setIsSaving(false)
        setIsLoading(false)
      }
    } else {
      handleLeave(true)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nauja kliento kelionė
      </Typography>
      <WizardForm onDataChange={(hasData: boolean) => setHasChanges(hasData)} />

      <Dialog
        open={showNavigationDialog}
        onClose={handleStay}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
      >
        <DialogTitle id="leave-dialog-title">Išsaugoti kaip juodraštį?</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Ar norite išsaugoti šią kelionę kaip juodraštį prieš išeidami? Jei ne, pakeitimai bus prarasti.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStay} color="primary" disabled={isSaving}>
            Likti
          </Button>
          <Button onClick={() => handleLeave(true)} color="error" disabled={isSaving}>
            Išeiti be išsaugojimo
          </Button>
          <Button onClick={handleLeaveWithSave} color="primary" variant="contained" disabled={isSaving}>
            {isSaving ? "Saugoma..." : "Išsaugoti ir išeiti"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default WizardFormPage
