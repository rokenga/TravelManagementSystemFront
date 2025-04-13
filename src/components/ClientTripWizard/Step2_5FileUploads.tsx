"use client"

import type React from "react"
import { useEffect } from "react"
import UnifiedFileUploadStep from "../UnifiedFileUploadStep"

interface Step2_5Props {
  initialImages: File[]
  initialDocuments: File[]
  onSubmit: (images: File[], documents: File[]) => void
  onBack: () => void
}

// Global variables to store the current files
let currentImages: File[] = []
let currentDocuments: File[] = []

// Export a function to get the current files
export function getStep2_5CurrentFilesData(): { images: File[]; documents: File[] } {
  // Get the latest data from UnifiedFileUploadStep
  const unifiedData = UnifiedFileUploadStep.getCurrentFilesData
    ? UnifiedFileUploadStep.getCurrentFilesData()
    : { images: [], documents: [] }

  // Use the unified data if available, otherwise use our local variables
  const images = unifiedData.images.length > 0 ? unifiedData.images : currentImages
  const documents = unifiedData.documents.length > 0 ? unifiedData.documents : currentDocuments

  console.log(
    "Step2_5FileUploads - Getting current files data - Images:",
    images?.length || 0,
    "Documents:",
    documents?.length || 0,
  )

  return {
    images: images ? [...images] : [],
    documents: documents ? [...documents] : [],
  }
}

const Step2_5FileUploads: React.FC<Step2_5Props> = ({ initialImages, initialDocuments, onSubmit, onBack }) => {
  // Initialize the global variables with the initial values
  useEffect(() => {
    // Only initialize if the arrays are empty (first load)
    if (currentImages.length === 0 && initialImages && initialImages.length > 0) {
      currentImages = [...initialImages]
    }

    if (currentDocuments.length === 0 && initialDocuments && initialDocuments.length > 0) {
      currentDocuments = [...initialDocuments]
    }

    console.log("Step2_5FileUploads - Initialized with:", {
      initialImages: initialImages?.length || 0,
      initialDocuments: initialDocuments?.length || 0,
      currentImages: currentImages.length,
      currentDocuments: currentDocuments.length,
    })
  }, [initialImages, initialDocuments])

  // Use the unified component
  return (
    <UnifiedFileUploadStep
      initialImages={currentImages.length > 0 ? currentImages : initialImages || []}
      initialDocuments={currentDocuments.length > 0 ? currentDocuments : initialDocuments || []}
      onSubmit={(images, documents) => {
        // Update the global variables
        currentImages = images ? [...images] : []
        currentDocuments = documents ? [...documents] : []

        console.log("Step2_5FileUploads - Submitting:", {
          images: images?.length || 0,
          documents: documents?.length || 0,
        })

        // Call the original onSubmit
        onSubmit(images || [], documents || [])
      }}
      onBack={() => {
        // Get the latest data from UnifiedFileUploadStep
        const latestData = getStep2_5CurrentFilesData()

        // Update our local variables
        currentImages = latestData.images
        currentDocuments = latestData.documents

        console.log(
          "Step2_5FileUploads - Going back with current files - Images:",
          currentImages?.length || 0,
          "Documents:",
          currentDocuments?.length || 0,
        )

        onBack()
      }}
    />
  )
}

export default Step2_5FileUploads
