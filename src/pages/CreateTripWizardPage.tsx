"use client"

import { useState } from "react"
import { Typography, Container } from "@mui/material"
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
import { usePreventNavigation } from "../hooks/usePreventNavigation"
import WizardForm from "../components/ClientTripWizard/CreateTripWizardForm"

const WizardFormPage = () => {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    showDialog: showNavigationDialog,
    handleStay,
    handleLeave,
    pendingLocation,
  } = usePreventNavigation(hasChanges)

  // Function to handle saving before leaving
  const handleLeaveWithSave = async () => {
    setIsSaving(true)

    if (window.saveCreateFormAsDraft) {
      try {
        // Make sure we're passing the pendingLocation to the save function
        const saveResult = await window.saveCreateFormAsDraft(pendingLocation)

        // Only proceed with navigation if the save was successful
        if (saveResult) {
          // The navigation is handled by the save function in CreateTripWizardForm
          handleLeave(true)
        } else {
          console.error("Save function returned false, not navigating")
          setIsSaving(false)
        }
      } catch (error) {
        console.error("Error saving draft:", error)
        setIsSaving(false)
      }
    } else {
      console.warn("saveCreateFormAsDraft function not available")
      handleLeave(true)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nauja kliento kelionė
      </Typography>
      <WizardForm onDataChange={(changed) => setHasChanges(changed)} />

      {/* Navigation confirmation dialog */}
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
