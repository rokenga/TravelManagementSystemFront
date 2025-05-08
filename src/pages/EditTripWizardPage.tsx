"use client"

import { useState } from "react"
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
import { usePreventNavigation } from "../hooks/usePreventNavigation"
import EditTripWizardForm from "../components/ClientTripWizard/EditTripWizardForm"

function WizardEditFormPage() {
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

    if (window.saveEditFormAsDraft) {
      try {
        // Make sure we're passing the pendingLocation to the save function
        const saveResult = await window.saveEditFormAsDraft(pendingLocation)

        // Only proceed with navigation if the save was successful
        if (saveResult) {
          // Navigation will be handled by the save function
          console.log("Save successful, navigation handled by save function")
        } else {
          console.error("Save function returned false, not navigating")
          setIsSaving(false)
        }
      } catch (error) {
        console.error("Error saving draft:", error)
        setIsSaving(false)
      }
    } else {
      console.warn("saveEditFormAsDraft function not available")
      handleLeave(true)
    }
  }

  return (
    <>
      <EditTripWizardForm onDataChange={(changed) => setHasChanges(changed)} />

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
    </>
  )
}

export default WizardEditFormPage
