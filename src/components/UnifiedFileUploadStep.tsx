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
let globalImages: FileWithPreview[] = []
let globalDocuments: FileWithPreview[] = []
let globalImagesToDelete: string[] = []
let globalDocumentsToDelete: string[] = []

// Export a function to get the current files data
export function getCurrentFilesData(): {
  images: File[]
  documents: File[]
  imagesToDelete?: string[]
  documentsToDelete?: string[]
} {
  return {
    images: globalImages || [],
    documents: globalDocuments || [],
    imagesToDelete: globalImagesToDelete?.length > 0 ? [...globalImagesToDelete] : undefined,
    documentsToDelete: globalDocumentsToDelete?.length > 0 ? [...globalDocumentsToDelete] : undefined,
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
    if (!files || !Array.isArray(files)) return []
    return files.map((file) => {
      // Ensure file has size property
      if (typeof file.size !== "number") {
        Object.defineProperty(file, "size", {
          value: 0,
          writable: true,
        })
      }
      return file as FileWithPreview
    })
  }

  // Initialize state with global values if they exist, otherwise use initialImages/initialDocuments
  const [newImages, setNewImages] = useState<FileWithPreview[]>(
    globalImages.length > 0 ? [...globalImages] : convertToFileWithPreview(initialImages || []),
  )

  const [newDocuments, setNewDocuments] = useState<FileWithPreview[]>(
    globalDocuments.length > 0 ? [...globalDocuments] : convertToFileWithPreview(initialDocuments || []),
  )

  const [imagesToDelete, setImagesToDelete] = useState<string[]>(
    globalImagesToDelete.length > 0 ? [...globalImagesToDelete] : [],
  )

  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>(
    globalDocumentsToDelete.length > 0 ? [...globalDocumentsToDelete] : [],
  )

  const [error, setError] = useState<string | null>(null)

  // Update the global variables whenever the state changes
  useEffect(() => {
    globalImages = [...newImages]
    globalDocuments = [...newDocuments]
    globalImagesToDelete = [...imagesToDelete]
    globalDocumentsToDelete = [...documentsToDelete]

    // Log the current state for debugging
    console.log("UnifiedFileUploadStep - Current state updated:", {
      images: globalImages.length,
      documents: globalDocuments.length,
      imagesToDelete: globalImagesToDelete.length,
      documentsToDelete: globalDocumentsToDelete.length,
    })
  }, [newImages, newDocuments, imagesToDelete, documentsToDelete])

  // Handle deleting existing images
  const handleDeleteExistingImage = (id: string) => {
    setImagesToDelete((prev) => [...prev, id])
  }

  // Handle deleting existing documents
  const handleDeleteExistingDocument = (id: string) => {
    setDocumentsToDelete((prev) => [...prev, id])
  }

  // Handle next button click
  const handleNext = () => {
    // Save current state to globals before submitting
    globalImages = [...newImages]
    globalDocuments = [...newDocuments]
    globalImagesToDelete = [...imagesToDelete]
    globalDocumentsToDelete = [...documentsToDelete]

    console.log("UnifiedFileUploadStep - Submitting:", {
      images: newImages.length,
      documents: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
    })

    onSubmit(
      newImages as File[],
      newDocuments as File[],
      imagesToDelete.length > 0 ? imagesToDelete : undefined,
      documentsToDelete.length > 0 ? documentsToDelete : undefined,
    )
  }

  // Handle back button click
  const handleBackClick = () => {
    // Save current state to globals before going back
    globalImages = [...newImages]
    globalDocuments = [...newDocuments]
    globalImagesToDelete = [...imagesToDelete]
    globalDocumentsToDelete = [...documentsToDelete]

    console.log("UnifiedFileUploadStep - Going back with:", {
      images: globalImages.length,
      documents: globalDocuments.length,
      imagesToDelete: globalImagesToDelete.length,
      documentsToDelete: globalDocumentsToDelete.length,
    })

    onBack()
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
        <Button variant="outlined" onClick={handleBackClick} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
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
