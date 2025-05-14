"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"
import { Typography, Box, Paper, Button, Grid, Divider, Alert } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import { FileUploadManager, type ExistingFile } from "./FileUploadManager"

declare global {
  interface Window {
    __currentFileData: {
      newImages: File[]
      newDocuments: File[]
      imagesToDelete: string[]
      documentsToDelete: string[]
    } | null

    globalNewImages?: File[]
    globalNewDocuments?: File[]
    globalImagesToDelete?: string[]
    globalDocumentsToDelete?: string[]
  }
}

const FileDataContext = createContext<{
  newImages: File[]
  newDocuments: File[]
  imagesToDelete: string[]
  documentsToDelete: string[]
} | null>(null)

export function getCurrentFileData() {
  if (window.__currentFileData) {
    return window.__currentFileData
  }

  if (typeof window.globalNewImages !== "undefined") {
    return {
      newImages: window.globalNewImages || [],
      newDocuments: window.globalNewDocuments || [],
      imagesToDelete: window.globalImagesToDelete || [],
      documentsToDelete: window.globalDocumentsToDelete || [],
    }
  }

  return {
    newImages: [],
    newDocuments: [],
    imagesToDelete: [],
    documentsToDelete: [],
  }
}

interface UnifiedFileUploadStepProps {
  initialImages: File[]
  initialDocuments: File[]
  existingImages?: ExistingFile[]
  existingDocuments?: ExistingFile[]
  onSubmit: (images: File[], documents: File[], imagesToDelete?: string[], documentsToDelete?: string[]) => void
  onBack: () => void
  isEditMode?: boolean
}

const UnifiedFileUploadStep: React.FC<UnifiedFileUploadStepProps> = ({
  initialImages,
  initialDocuments,
  existingImages = [],
  existingDocuments = [],
  onSubmit,
  onBack,
  isEditMode = false,
}) => {
  const [newImages, setNewImages] = useState<File[]>(() => {
    if (isEditMode && window.globalNewImages) {
      return window.globalNewImages
    }
    return initialImages || []
  })

  const [newDocuments, setNewDocuments] = useState<File[]>(() => {
    if (isEditMode && window.globalNewDocuments) {
      return window.globalNewDocuments
    }
    return initialDocuments || []
  })

  const [imagesToDelete, setImagesToDelete] = useState<string[]>(() => {
    if (isEditMode && window.globalImagesToDelete) {
      return window.globalImagesToDelete
    }
    return []
  })

  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>(() => {
    if (isEditMode && window.globalDocumentsToDelete) {
      return window.globalDocumentsToDelete
    }
    return []
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.__currentFileData = {
      newImages,
      newDocuments,
      imagesToDelete,
      documentsToDelete,
    }

    if (isEditMode) {
      window.globalNewImages = newImages
      window.globalNewDocuments = newDocuments
      window.globalImagesToDelete = imagesToDelete
      window.globalDocumentsToDelete = documentsToDelete
    }

    return () => {
      if (!isEditMode) {
        window.__currentFileData = null
      }
    }
  }, [newImages, newDocuments, imagesToDelete, documentsToDelete, isEditMode])

  const handleDeleteExistingImage = (id: string) => {
    setImagesToDelete((prev) => [...prev, id])
  }

  const handleDeleteExistingDocument = (id: string) => {
    setDocumentsToDelete((prev) => [...prev, id])
  }

  const handleNext = () => {
    onSubmit(
      newImages,
      newDocuments,
      imagesToDelete.length > 0 ? imagesToDelete : undefined,
      documentsToDelete.length > 0 ? documentsToDelete : undefined,
    )
  }

  const filteredExistingImages = existingImages.filter((img) => !imagesToDelete.includes(img.id))
  const filteredExistingDocuments = existingDocuments.filter((doc) => !documentsToDelete.includes(doc.id))

  return (
    <FileDataContext.Provider
      value={{
        newImages,
        newDocuments,
        imagesToDelete,
        documentsToDelete,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4, bgcolor: "background.paper" }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
            Dokumentai ir nuotraukos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isEditMode
              ? "Čia galite ištrinti esamas nuotraukas ir dokumentus arba pridėti naujų."
              : "Pridėkite kelionės dokumentus ir nuotraukas. Galite pridėti kelis failus vienu metu."}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FileUploadManager
                newFiles={newImages}
                setNewFiles={setNewImages}
                existingFiles={filteredExistingImages}
                onDeleteExisting={handleDeleteExistingImage}
                fileType="image"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FileUploadManager
                newFiles={newDocuments}
                setNewFiles={setNewDocuments}
                existingFiles={filteredExistingDocuments}
                onDeleteExisting={handleDeleteExistingDocument}
                fileType="document"
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 6 }}>
          <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
            Atgal
          </Button>
          <Button variant="contained" onClick={handleNext} size="large" endIcon={<ArrowForward />}>
            Toliau
          </Button>
        </Box>
      </Box>
    </FileDataContext.Provider>
  )
}

export default UnifiedFileUploadStep
