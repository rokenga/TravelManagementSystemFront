declare global {
    interface Window {
      __currentFileData: {
        newImages: File[]
        newDocuments: File[]
        imagesToDelete: string[]
        documentsToDelete: string[]
      } | null
  
      // Global variables from edit mode
      globalNewImages?: File[]
      globalNewDocuments?: File[]
      globalImagesToDelete?: string[]
      globalDocumentsToDelete?: string[]
    }
  }
  
  export {}
  