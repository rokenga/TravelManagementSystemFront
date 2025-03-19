"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Typography, Box, Paper, Button, Grid, Divider, Alert } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import { FileUploadManager, type FileWithPreview, type ExistingFile } from "./FileUploadManager"

interface UnifiedFileUploadStepProps {
  // For new files
  initialImages: File[]
  initialDocuments: File[]
  // For existing files (edit mode)
  existingImages?: ExistingFile[]
  existingDocuments?: ExistingFile[]
  // Callbacks
  onSubmit: (images: File[], documents: File[], imagesToDelete?: string[], documentsToDelete?: string[]) => void
  onBack: () => void
  isEditMode?: boolean
}

// Global variables to store the current files
let currentImages: FileWithPreview[] = []
let currentDocuments: FileWithPreview[] = []
let currentImagesToDelete: string[] = []
let currentDocumentsToDelete: string[] = []

// Export a function to get the current files data
export function getCurrentFilesData(): {
  images: File[]
  documents: File[]
  imagesToDelete?: string[]
  documentsToDelete?: string[]
} {
  return {
    images: [...currentImages],
    documents: [...currentDocuments],
    imagesToDelete: currentImagesToDelete.length > 0 ? [...currentImagesToDelete] : undefined,
    documentsToDelete: currentDocumentsToDelete.length > 0 ? [...currentDocumentsToDelete] : undefined,
  }
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
  // Convert File[] to FileWithPreview[]
  const convertToFileWithPreview = (files: File[]): FileWithPreview[] => {
    return files.map((file) => ({ ...file }))
  }

  const [newImages, setNewImages] = useState<FileWithPreview[]>(convertToFileWithPreview(initialImages))
  const [newDocuments, setNewDocuments] = useState<FileWithPreview[]>(convertToFileWithPreview(initialDocuments))
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Update the global variables whenever the state changes
  useEffect(() => {
    currentImages = [...newImages]
    currentDocuments = [...newDocuments]
    currentImagesToDelete = [...imagesToDelete]
    currentDocumentsToDelete = [...documentsToDelete]
  }, [newImages, newDocuments, imagesToDelete, documentsToDelete])

  // Handle deleting existing images
  const handleDeleteExistingImage = (id: string) => {
    setImagesToDelete((prev) => [...prev, id])
    // Also remove from the displayed array if we're using the existingImages prop
    if (existingImages) {
      const updatedExistingImages = existingImages.filter((img) => img.id !== id)
      // If we had a setter for existingImages, we would use it here
    }
  }

  // Handle deleting existing documents
  const handleDeleteExistingDocument = (id: string) => {
    setDocumentsToDelete((prev) => [...prev, id])
    // Also remove from the displayed array if we're using the existingDocuments prop
    if (existingDocuments) {
      const updatedExistingDocuments = existingDocuments.filter((doc) => doc.id !== id)
      // If we had a setter for existingDocuments, we would use it here
    }
  }

  // Handle next button click
  const handleNext = () => {
    // Filter out existing images that are marked for deletion
    const filteredExistingImages = existingImages.filter((img) => !imagesToDelete.includes(img.id))
    const filteredExistingDocuments = existingDocuments.filter((doc) => !documentsToDelete.includes(doc.id))

    onSubmit(
      newImages as File[],
      newDocuments as File[],
      imagesToDelete.length > 0 ? imagesToDelete : undefined,
      documentsToDelete.length > 0 ? documentsToDelete : undefined,
    )
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4 }}>
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
          {/* Images Section */}
          <Grid item xs={12} md={6}>
            <FileUploadManager
              newFiles={newImages}
              setNewFiles={setNewImages}
              existingFiles={existingImages.filter((img) => !imagesToDelete.includes(img.id))}
              onDeleteExisting={handleDeleteExistingImage}
              fileType="image"
            />
          </Grid>

          {/* Documents Section */}
          <Grid item xs={12} md={6}>
            <FileUploadManager
              newFiles={newDocuments}
              setNewFiles={setNewDocuments}
              existingFiles={existingDocuments.filter((doc) => !documentsToDelete.includes(doc.id))}
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
  )
}

export default UnifiedFileUploadStep

