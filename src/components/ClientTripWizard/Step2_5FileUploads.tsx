"use client"

import type React from "react"
import { useState, useEffect } from "react"
import UnifiedFileUploadStep from "../UnifiedFileUploadStep"

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
  tripId?: string 
}

const Step2_5FileUploads: React.FC<Step2_5Props> = ({ initialImages, initialDocuments, onSubmit, onBack, tripId }) => {
  const [newImages, setNewImages] = useState<File[]>([])
  const [newDocuments, setNewDocuments] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([])

  useEffect(() => {
    if (!window.__currentFileData || window.__currentFileData.tripId !== tripId) {

      window.__currentFileData = {
        tripId,
        newImages: [],
        newDocuments: [],
        imagesToDelete: [],
        documentsToDelete: [],
      }

      setNewImages(initialImages || [])
      setNewDocuments(initialDocuments || [])
      setImagesToDelete([])
      setDocumentsToDelete([])
    } else {
      setNewImages(window.__currentFileData.newImages || initialImages)
      setNewDocuments(window.__currentFileData.newDocuments || initialDocuments)
      setImagesToDelete(window.__currentFileData.imagesToDelete || [])
      setDocumentsToDelete(window.__currentFileData.documentsToDelete || [])
    }
  }, [tripId, initialImages, initialDocuments])

  useEffect(() => {
    if (!tripId) return

    window.__currentFileData = {
      tripId,
      newImages,
      newDocuments,
      imagesToDelete,
      documentsToDelete,
    }
    return () => {
    }
  }, [tripId, newImages, newDocuments, imagesToDelete, documentsToDelete])

  const handleFileUploadsSubmit = (
    updatedImages: File[],
    updatedDocuments: File[],
    updatedImagesToDelete?: string[],
    updatedDocumentsToDelete?: string[],
  ) => {

    setNewImages(updatedImages || [])
    setNewDocuments(updatedDocuments || [])

    if (updatedImagesToDelete) {
      setImagesToDelete(updatedImagesToDelete)
    }

    if (updatedDocumentsToDelete) {
      setDocumentsToDelete(updatedDocumentsToDelete)
    }

    window.__currentFileData = {
      tripId,
      newImages: updatedImages || [],
      newDocuments: updatedDocuments || [],
      imagesToDelete: updatedImagesToDelete || imagesToDelete,
      documentsToDelete: updatedDocumentsToDelete || documentsToDelete,
    }

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
