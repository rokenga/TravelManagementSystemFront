
interface DeleteTracker {
    byStepIndex: Record<number, string[]>
    byStepId: Record<string, string[]>
    removedSections: number[]
    removedSectionIds: string[]
  }
  
  const deleteTracker: DeleteTracker = {
    byStepIndex: {},
    byStepId: {},
    removedSections: [],
    removedSectionIds: [],
  }
  
  export function markImageForDeletion(stepIndex: number, stepId: string, imageId: string) {
    console.log(`[DirectOp] Marking image ${imageId} for deletion in step ${stepIndex} (${stepId})`)
  
    if (!deleteTracker.byStepIndex[stepIndex]) {
      deleteTracker.byStepIndex[stepIndex] = []
    }
    if (!deleteTracker.byStepIndex[stepIndex].includes(imageId)) {
      deleteTracker.byStepIndex[stepIndex].push(imageId)
    }
  
    if (!deleteTracker.byStepId[stepId]) {
      deleteTracker.byStepId[stepId] = []
    }
    if (!deleteTracker.byStepId[stepId].includes(imageId)) {
      deleteTracker.byStepId[stepId].push(imageId)
    }
  }
  export function markSectionForRemoval(stepIndex: number, stepId: string) {
    console.log(`[DirectOp] Marking section ${stepIndex} (${stepId}) for removal`)
  
    if (!deleteTracker.removedSections.includes(stepIndex)) {
      deleteTracker.removedSections.push(stepIndex)
    }
  
    if (!deleteTracker.removedSectionIds.includes(stepId)) {
      deleteTracker.removedSectionIds.push(stepId)
    }
  }
  
  export function getImagesToDeleteForStep(stepIndex: number): string[] {
    return deleteTracker.byStepIndex[stepIndex] || []
  }
  
  export function getImagesToDeleteForStepById(stepId: string): string[] {
    return deleteTracker.byStepId[stepId] || []
  }
  
  export function isSectionMarkedForRemoval(stepIndex: number): boolean {
    return deleteTracker.removedSections.includes(stepIndex)
  }
  
  export function isSectionMarkedForRemovalById(stepId: string): boolean {
    return deleteTracker.removedSectionIds.includes(stepId)
  }
  export function getAllTrackingData(): DeleteTracker {
    return { ...deleteTracker }
  }
  
  export function applyTrackingToFormData(formData: FormData, originalStepIds: Record<number, string>): void {
    Object.entries(deleteTracker.byStepIndex).forEach(([stepIndex, imageIds]) => {
      if (imageIds && imageIds.length > 0) {
        const stepId = originalStepIds[Number.parseInt(stepIndex)]
        console.log(`[DirectOp] Adding ${imageIds.length} images to delete for step ${stepIndex} (${stepId})`)
  
        formData.append(`StepImagesToDelete_${stepIndex}`, JSON.stringify(imageIds))
      }
    })
  
    deleteTracker.removedSections.forEach((stepIndex) => {
      const stepId = originalStepIds[stepIndex]
      if (stepId) {
        console.log(`[DirectOp] Adding removed section flag for step ${stepIndex} (${stepId})`)
        formData.append(`RemoveAllImagesForStep_${stepIndex}`, "true")
      }
    })
  
    console.log("[DirectOp] Complete tracking state:", JSON.stringify(deleteTracker, null, 2))
  }
  
  export function resetTracker(): void {
    deleteTracker.byStepIndex = {}
    deleteTracker.byStepId = {}
    deleteTracker.removedSections = []
    deleteTracker.removedSectionIds = []
  }
  