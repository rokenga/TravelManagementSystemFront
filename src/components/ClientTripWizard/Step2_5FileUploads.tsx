"use client"

import type React from "react"
import { useState, useEffect } from "react"
import UnifiedFileUploadStep from "../UnifiedFileUploadStep"

// Declare global window properties
declare global {
  interface Window {
    __currentFileData: {
      tripId?: string
      newImages: File[]
      newDocuments: File[]
      imagesToDelete: string[]
      documentsToDelete: string[]
    } | null
  }
}

// Export a function to get the current file data
export function getCurrentFileData() {
  return (
    window.__currentFileData || {
      newImages: [],
      newDocuments: [],
      imagesToDelete: [],
      documentsToDelete: [],
    }
  )
}

interface Step2_5Props {
  initialImages: File[]
  initialDocuments: File[]
  onSubmit: (images: File[], documents: File[]) => void
  onBack: () => void
  tripId?: string // Add tripId prop
}

const Step2_5FileUploads: React.FC<Step2_5Props> = ({ initialImages, initialDocuments, onSubmit, onBack, tripId }) => {
  // Use local state instead of global variables
  const [newImages, setNewImages] = useState<File[]>([])
  const [newDocuments, setNewDocuments] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([])

  // Initialize component state
  useEffect(() => {
    // Clear global state if this is a new trip or no tripId matches
    if (!window.__currentFileData || window.__currentFileData.tripId !== tripId) {
      console.log(`Step2_5FileUploads - Initializing new state for trip ${tripId}`)

      // Reset global state
      window.__currentFileData = {
        tripId,
        newImages: [],
        newDocuments: [],
        imagesToDelete: [],
        documentsToDelete: [],
      }

      // Initialize with props
      setNewImages(initialImages || [])
      setNewDocuments(initialDocuments || [])
      setImagesToDelete([])
      setDocumentsToDelete([])
    } else {
      // Use existing global state
      console.log(`Step2_5FileUploads - Using existing state for trip ${tripId}`)
      setNewImages(window.__currentFileData.newImages || initialImages)
      setNewDocuments(window.__currentFileData.newDocuments || initialDocuments)
      setImagesToDelete(window.__currentFileData.imagesToDelete || [])
      setDocumentsToDelete(window.__currentFileData.documentsToDelete || [])
    }
  }, [tripId, initialImages, initialDocuments])

  // Store the current file data in a global variable for access from outside
  useEffect(() => {
    if (!tripId) return

    window.__currentFileData = {
      tripId,
      newImages,
      newDocuments,
      imagesToDelete,
      documentsToDelete,
    }

    console.log(`Step2_5FileUploads - Updated global state for trip ${tripId}:`, {
      newImages: newImages.length,
      newDocuments: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
    })

    // Clean up when component unmounts
    return () => {
      // Don't clear global state on unmount to preserve between steps
    }
  }, [tripId, newImages, newDocuments, imagesToDelete, documentsToDelete])

  const handleFileUploadsSubmit = (
    updatedImages: File[],
    updatedDocuments: File[],
    updatedImagesToDelete?: string[],
    updatedDocumentsToDelete?: string[],
  ) => {
    console.log(`Step2_5FileUploads - Submitting for trip ${tripId}:`, {
      images: updatedImages?.length || 0,
      documents: updatedDocuments?.length || 0,
      imagesToDelete: updatedImagesToDelete?.length || 0,
      documentsToDelete: updatedDocumentsToDelete?.length || 0,
    })

    // Update local state
    setNewImages(updatedImages || [])
    setNewDocuments(updatedDocuments || [])

    // Only update deletion arrays if they were provided
    if (updatedImagesToDelete) {
      setImagesToDelete(updatedImagesToDelete)
    }

    if (updatedDocumentsToDelete) {
      setDocumentsToDelete(updatedDocumentsToDelete)
    }

    // Update global state before submitting
    window.__currentFileData = {
      tripId,
      newImages: updatedImages || [],
      newDocuments: updatedDocuments || [],
      imagesToDelete: updatedImagesToDelete || imagesToDelete,
      documentsToDelete: updatedDocumentsToDelete || documentsToDelete,
    }

    // Call the original onSubmit
    onSubmit(updatedImages || [], updatedDocuments || [])
  }

  return (
    <UnifiedFileUploadStep
      initialImages={newImages}
      initialDocuments={newDocuments}
      onSubmit={handleFileUploadsSubmit}
      onBack={onBack}
    />
  )
}

export default Step2_5FileUploads
