"use client"

import type React from "react"
import UnifiedFileUploadStep from "./UnifiedFileUploadStep"

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
export function getCurrentFilesData(): { images: File[]; documents: File[] } {
  console.log("Getting current files data - Images:", currentImages.length, "Documents:", currentDocuments.length)
  return {
    images: [...currentImages],
    documents: [...currentDocuments],
  }
}

const Step2_5FileUploads: React.FC<Step2_5Props> = ({ initialImages, initialDocuments, onSubmit, onBack }) => {
  // Use the unified component
  return (
    <UnifiedFileUploadStep
      initialImages={initialImages}
      initialDocuments={initialDocuments}
      onSubmit={(images, documents) => {
        // Update the global variables
        currentImages = [...images]
        currentDocuments = [...documents]
        // Call the original onSubmit
        onSubmit(images, documents)
      }}
      onBack={onBack}
    />
  )
}

export default Step2_5FileUploads

