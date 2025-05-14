"use client"
import {
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from "@mui/material"
import CreateClientOfferWizardForm from "../components/ClientOfferWizard/CreateClientOfferWizardForm"
import { usePreventNavigation } from "../hooks/usePreventNavigation"
import { useState, useRef, useEffect } from "react"
import { getCurrentFormData } from "../components/ClientOfferWizard/CreateClientOfferWizardForm"
import { getCurrentStepData } from "../components/ClientOfferWizard/Step2Offers"

export default function SpecialOfferCreationForm() {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const formRef = useRef<any>(null)

  const {
    showDialog: showNavigationDialog,
    handleStay,
    handleLeave,
    pendingLocation,
  } = usePreventNavigation(hasChanges)

  useEffect(() => {
    setHasChanges(true)
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleDataChange = (hasData: boolean) => {
    setHasChanges(true)
  }

  const handleLeaveWithSave = async () => {
    setIsSaving(true)

    if (window.saveClientOfferAsDraft) {
      try {
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
      } catch (error) {
        setIsSaving(false)
      }
    } else {
      handleLeave(true)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Kelionės pasiūlymas klientui
      </Typography>
      {isInitialLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <CreateClientOfferWizardForm onDataChange={handleDataChange} ref={formRef} />
      )}

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
            {isSaving ? "Saugoma..." : "Išsaugoti ir išeiti"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
