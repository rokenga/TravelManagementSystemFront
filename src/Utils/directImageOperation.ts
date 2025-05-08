/**
 * Direct image operations utility
 * This bypasses the complex state tracking and directly communicates with the backend
 */

// Store images to delete by step index and step ID
interface DeleteTracker {
    byStepIndex: Record<number, string[]>
    byStepId: Record<string, string[]>
    removedSections: number[]
    removedSectionIds: string[]
  }
  
  // Global singleton to track deletions
  const deleteTracker: DeleteTracker = {
    byStepIndex: {},
    byStepId: {},
    removedSections: [],
    removedSectionIds: [],
  }
  
  /**
   * Mark an image for deletion
   */
  export function markImageForDeletion(stepIndex: number, stepId: string, imageId: string) {
    console.log(`[DirectOp] Marking image ${imageId} for deletion in step ${stepIndex} (${stepId})`)
  
    // Track by index
    if (!deleteTracker.byStepIndex[stepIndex]) {
      deleteTracker.byStepIndex[stepIndex] = []
    }
    if (!deleteTracker.byStepIndex[stepIndex].includes(imageId)) {
      deleteTracker.byStepIndex[stepIndex].push(imageId)
    }
  
    // Track by ID
    if (!deleteTracker.byStepId[stepId]) {
      deleteTracker.byStepId[stepId] = []
    }
    if (!deleteTracker.byStepId[stepId].includes(imageId)) {
      deleteTracker.byStepId[stepId].push(imageId)
    }
  }
  
  /**
   * Mark a section for complete removal
   */
  export function markSectionForRemoval(stepIndex: number, stepId: string) {
    console.log(`[DirectOp] Marking section ${stepIndex} (${stepId}) for removal`)
  
    if (!deleteTracker.removedSections.includes(stepIndex)) {
      deleteTracker.removedSections.push(stepIndex)
    }
  
    if (!deleteTracker.removedSectionIds.includes(stepId)) {
      deleteTracker.removedSectionIds.push(stepId)
    }
  }
  
  /**
   * Get all images to delete for a step
   */
  export function getImagesToDeleteForStep(stepIndex: number): string[] {
    return deleteTracker.byStepIndex[stepIndex] || []
  }
  
  /**
   * Get all images to delete for a step by ID
   */
  export function getImagesToDeleteForStepById(stepId: string): string[] {
    return deleteTracker.byStepId[stepId] || []
  }
  
  /**
   * Check if a section is marked for removal
   */
  export function isSectionMarkedForRemoval(stepIndex: number): boolean {
    return deleteTracker.removedSections.includes(stepIndex)
  }
  
  /**
   * Check if a section is marked for removal by ID
   */
  export function isSectionMarkedForRemovalById(stepId: string): boolean {
    return deleteTracker.removedSectionIds.includes(stepId)
  }
  
  /**
   * Get all tracking data
   */
  export function getAllTrackingData(): DeleteTracker {
    return { ...deleteTracker }
  }
  
  /**
   * Apply tracking data to FormData for submission
   */
  export function applyTrackingToFormData(formData: FormData, originalStepIds: Record<number, string>): void {
    // Add images to delete by step index
    Object.entries(deleteTracker.byStepIndex).forEach(([stepIndex, imageIds]) => {
      if (imageIds && imageIds.length > 0) {
        const stepId = originalStepIds[Number.parseInt(stepIndex)]
        console.log(`[DirectOp] Adding ${imageIds.length} images to delete for step ${stepIndex} (${stepId})`)
  
        // Add as a string array for the backend
        formData.append(`StepImagesToDelete_${stepIndex}`, JSON.stringify(imageIds))
      }
    })
  
    // Add removed sections
    deleteTracker.removedSections.forEach((stepIndex) => {
      const stepId = originalStepIds[stepIndex]
      if (stepId) {
        console.log(`[DirectOp] Adding removed section flag for step ${stepIndex} (${stepId})`)
        formData.append(`RemoveAllImagesForStep_${stepIndex}`, "true")
      }
    })
  
    // Log the complete tracking state
    console.log("[DirectOp] Complete tracking state:", JSON.stringify(deleteTracker, null, 2))
  }
  
  /**
   * Reset the tracker
   */
  export function resetTracker(): void {
    deleteTracker.byStepIndex = {}
    deleteTracker.byStepId = {}
    deleteTracker.removedSections = []
    deleteTracker.removedSectionIds = []
  }
  