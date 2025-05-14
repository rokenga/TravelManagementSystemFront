declare global {
    interface Window {
      __currentFileData: {
        newImages: File[]
        newDocuments: File[]
        imagesToDelete: string[]
        documentsToDelete: string[]
      } | null
  
      globalNewImages?: File[]
      globalNewDocuments?: File[]
      globalImagesToDelete?: string[]
      globalDocumentsToDelete?: string[]
    }
  }
  
  export {}
  