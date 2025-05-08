"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"
import { Typography, Box, Paper, Button, Grid, Divider, Alert } from "@mui/material"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import { FileUploadManager, type ExistingFile } from "./FileUploadManager"

// Declare global window properties
declare global {
  interface Window {
    __currentFileData: {
      newImages: File[]
      newDocuments: File[]
      imagesToDelete: string[]
      documentsToDelete: string[]
    } | null

    // Global variables for edit mode
    globalNewImages?: File[]
    globalNewDocuments?: File[]
    globalImagesToDelete?: string[]
    globalDocumentsToDelete?: string[]
  }
}

// Create a context to store the current file data
const FileDataContext = createContext<{
  newImages: File[]
  newDocuments: File[]
  imagesToDelete: string[]
  documentsToDelete: string[]
} | null>(null)

// Export a function to get the current file data
export function getCurrentFileData() {
  // First try to get from window.__currentFileData
  if (window.__currentFileData) {
    return window.__currentFileData
  }

  // If not available, try to get from global variables (edit mode)
  if (typeof window.globalNewImages !== "undefined") {
    return {
      newImages: window.globalNewImages || [],
      newDocuments: window.globalNewDocuments || [],
      imagesToDelete: window.globalImagesToDelete || [],
      documentsToDelete: window.globalDocumentsToDelete || [],
    }
  }

  // If nothing is available, return empty arrays
  return {
    newImages: [],
    newDocuments: [],
    imagesToDelete: [],
    documentsToDelete: [],
  }
}

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

const UnifiedFileUploadStep: React.FC<UnifiedFileUploadStepProps> = ({
  initialImages,
  initialDocuments,
  existingImages = [],
  existingDocuments = [],
  onSubmit,
  onBack,
  isEditMode = false,
}) => {
  // Initialize state with values from global variables if in edit mode
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

  // State for tracking files to delete
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

  // Store the current file data in global variables
  useEffect(() => {
    // Store in window.__currentFileData for create mode
    window.__currentFileData = {
      newImages,
      newDocuments,
      imagesToDelete,
      documentsToDelete,
    }

    // Also store in global variables for edit mode
    if (isEditMode) {
      window.globalNewImages = newImages
      window.globalNewDocuments = newDocuments
      window.globalImagesToDelete = imagesToDelete
      window.globalDocumentsToDelete = documentsToDelete
    }

    console.log("UnifiedFileUploadStep - Updated global state:", {
      newImages: newImages.length,
      newDocuments: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
      isEditMode,
    })

    // Clean up when component unmounts
    return () => {
      // Don't clear global variables in edit mode to preserve state between steps
      if (!isEditMode) {
        window.__currentFileData = null
      }
    }
  }, [newImages, newDocuments, imagesToDelete, documentsToDelete, isEditMode])

  // Handle deleting existing images
  const handleDeleteExistingImage = (id: string) => {
    console.log("UnifiedFileUploadStep - Deleting existing image:", id)
    setImagesToDelete((prev) => [...prev, id])
  }

  // Handle deleting existing documents
  const handleDeleteExistingDocument = (id: string) => {
    console.log("UnifiedFileUploadStep - Deleting existing document:", id)
    setDocumentsToDelete((prev) => [...prev, id])
  }

  // Handle next button click
  const handleNext = () => {
    console.log("UnifiedFileUploadStep - Submitting:", {
      images: newImages.length,
      documents: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
    })

    onSubmit(
      newImages,
      newDocuments,
      imagesToDelete.length > 0 ? imagesToDelete : undefined,
      documentsToDelete.length > 0 ? documentsToDelete : undefined,
    )
  }

  // Filter out existing files that are marked for deletion
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
            {/* Images Section */}
            <Grid item xs={12} md={6}>
              <FileUploadManager
                newFiles={newImages}
                setNewFiles={setNewImages}
                existingFiles={filteredExistingImages}
                onDeleteExisting={handleDeleteExistingImage}
                fileType="image"
              />
            </Grid>

            {/* Documents Section */}
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
