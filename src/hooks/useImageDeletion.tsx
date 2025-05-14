"use client"

import { useState, useCallback, useEffect } from "react"

interface UseImageDeletionProps {
  onImageDelete?: (stepIndex: number, imageId: string) => void
  onSectionRemove?: (stepIndex: number) => void
}

export function useImageDeletion({ onImageDelete, onSectionRemove }: UseImageDeletionProps) {
  const [deletedImages, setDeletedImages] = useState<Record<number, string[]>>({})
  const [removedSections, setRemovedSections] = useState<number[]>([])
  const [deletionErrors, setDeletionErrors] = useState<string[]>([])

  const handleImageDelete = useCallback(
    (stepIndex: number, imageId: string) => {
      try {
        setDeletedImages((prev) => {
          const newDeletedImages = { ...prev }
          if (!newDeletedImages[stepIndex]) {
            newDeletedImages[stepIndex] = []
          }

          if (imageId && typeof imageId === "string" && !newDeletedImages[stepIndex].includes(imageId)) {
            newDeletedImages[stepIndex] = [...newDeletedImages[stepIndex], imageId]
          }

          return newDeletedImages
        })

        if (onImageDelete) {
          onImageDelete(stepIndex, imageId)
        }
      } catch (error) {
        setDeletionErrors((prev) => [
          ...prev,
          `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
    },
    [onImageDelete],
  )

  const handleSectionRemove = useCallback(
    (stepIndex: number) => {
      try {
        setRemovedSections((prev) => {
          if (!prev.includes(stepIndex)) {
            return [...prev, stepIndex]
          }
          return prev
        })

        if (onSectionRemove) {
          onSectionRemove(stepIndex)
        }
      } catch (error) {
        setDeletionErrors((prev) => [
          ...prev,
          `Failed to remove section: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
    },
    [onSectionRemove],
  )

  const clearErrors = useCallback(() => {
    setDeletionErrors([])
  }, [])

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
