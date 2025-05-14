"use client"

import { useState, useRef, useEffect } from "react"
import {
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material"
import { useParams } from "react-router-dom"
import EditClientOfferWizardForm from "../components/ClientOfferWizard/EditClientOfferWizardForm"
import { usePreventNavigation } from "../hooks/usePreventNavigation"
import { getCurrentFormData } from "../components/ClientOfferWizard/CreateClientOfferWizardForm"
import { getCurrentStepData } from "../components/ClientOfferWizard/Step2Offers"

export default function EditClientOfferWizardPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<any>(null)

  const {
    showDialog: showNavigationDialog,
    handleStay,
    handleLeave,
    pendingLocation,
  } = usePreventNavigation(hasChanges)

  useEffect(() => {
    setHasChanges(true)
  }, [])

  const handleDataChange = (hasData: boolean) => {
    setHasChanges(true)
  }

  const handleLeaveWithSave = async () => {
    setIsSaving(true)

    try {
      if (formRef.current && formRef.current.saveAsDraft) {
        const saveResult = await formRef.current.saveAsDraft(pendingLocation)

        if (saveResult) {
          handleLeave(true)
        } else {
          setIsSaving(false)
        }
      } else {
        if (window.saveClientOfferAsDraft) {
          const latestFormData = getCurrentFormData()
          const latestStepData = getCurrentStepData()

          if (formRef.current && formRef.current.collectCurrentFormData) {
            await formRef.current.collectCurrentFormData()
          }

          const saveResult = await window.saveClientOfferAsDraft(pendingLocation)

          if (saveResult) {
            handleLeave(true)
          } else {
            setIsSaving(false)
          }
        } else {
          handleLeave(true)
        }
      }
    } catch (error) {
      setIsSaving(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Redaguoti kelionės pasiūlymą
      </Typography>
      {tripId && <EditClientOfferWizardForm tripId={tripId} onDataChange={handleDataChange} ref={formRef} />}

      <Dialog
        open={showNavigationDialog}
        onClose={handleStay}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-description"
      >
        <DialogTitle id="leave-dialog-title">Išsaugoti kaip juodraštį?</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-dialog-description">
            Ar norite išsaugoti šį pasiūlymą kaip juodraštį prieš išeidami? Jei ne, pakeitimai bus prarasti.
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
            {isSaving ? <CircularProgress size={24} color="inherit" /> : "Išsaugoti ir išeiti"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
