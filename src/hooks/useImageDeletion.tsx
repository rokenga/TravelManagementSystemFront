"use client"

import { useState, useCallback, useEffect } from "react"

interface UseImageDeletionProps {
  onImageDelete?: (stepIndex: number, imageId: string) => void
  onSectionRemove?: (stepIndex: number) => void
}

export function useImageDeletion({ onImageDelete, onSectionRemove }: UseImageDeletionProps) {
  // Track deleted images by step index
  const [deletedImages, setDeletedImages] = useState<Record<number, string[]>>({})
  // Track completely removed sections
  const [removedSections, setRemovedSections] = useState<number[]>([])
  // Track deletion errors
  const [deletionErrors, setDeletionErrors] = useState<string[]>([])

  // Log deletion activity for debugging
  useEffect(() => {
    console.log("Current deleted images state:", deletedImages)
    console.log("Current removed sections state:", removedSections)
  }, [deletedImages, removedSections])

  // Handle individual image deletion
  const handleImageDelete = useCallback(
    (stepIndex: number, imageId: string) => {
      console.log(`useImageDeletion: Deleting image ${imageId} from step ${stepIndex}`)

      try {
        // Update local state
        setDeletedImages((prev) => {
          const newDeletedImages = { ...prev }
          if (!newDeletedImages[stepIndex]) {
            newDeletedImages[stepIndex] = []
          }

          // Only add if not already in the array and it's a valid ID
          if (imageId && typeof imageId === "string" && !newDeletedImages[stepIndex].includes(imageId)) {
            newDeletedImages[stepIndex] = [...newDeletedImages[stepIndex], imageId]
          }

          return newDeletedImages
        })

        // Call parent handler if provided
        if (onImageDelete) {
          onImageDelete(stepIndex, imageId)
        }
      } catch (error) {
        console.error(`Error deleting image ${imageId} from step ${stepIndex}:`, error)
        setDeletionErrors((prev) => [
          ...prev,
          `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
    },
    [onImageDelete],
  )

  // Handle section removal
  const handleSectionRemove = useCallback(
    (stepIndex: number) => {
      console.log(`useImageDeletion: Removing image section for step ${stepIndex}`)

      try {
        // Update local state
        setRemovedSections((prev) => {
          if (!prev.includes(stepIndex)) {
            return [...prev, stepIndex]
          }
          return prev
        })

        // Call parent handler if provided
        if (onSectionRemove) {
          onSectionRemove(stepIndex)
        }
      } catch (error) {
        console.error(`Error removing section for step ${stepIndex}:`, error)
        setDeletionErrors((prev) => [
          ...prev,
          `Failed to remove section: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
    },
    [onSectionRemove],
  )

  // Clear errors
  const clearErrors = useCallback(() => {
    setDeletionErrors([])
  }, [])

  // Reset state
  const resetState = useCallback(() => {
    setDeletedImages({})
    setRemovedSections([])
    setDeletionErrors([])
  }, [])

  return {
    deletedImages,
    removedSections,
    deletionErrors,
    handleImageDelete,
    handleSectionRemove,
    clearErrors,
    resetState,
  }
}
