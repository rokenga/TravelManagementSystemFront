"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
} from "@mui/material"
import {
  ArrowBack,
  ArrowForward,
  Upload,
  Description,
  Image,
  Delete,
  PictureAsPdf,
  InsertDriveFile,
  Article,
  TableChart,
} from "@mui/icons-material"

import type { ExistingFile } from "./EditTripWizardForm" // The interface we declared there

interface Step2_5Props {
  existingImages: ExistingFile[]
  existingDocuments: ExistingFile[]
  onSubmit: (payload: {
    newImages: File[]
    newDocuments: File[]
    imagesToDelete: string[] // array of existing file IDs
    documentsToDelete: string[]
  }) => void
  onBack: () => void
}

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"]
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Declare global variables to store the current files and deletion lists
declare global {
  interface Window {
    globalNewImages?: File[]
    globalNewDocuments?: File[]
    globalImagesToDelete?: string[]
    globalDocumentsToDelete?: string[]
  }
}

// Initialize global variables if they don't exist
if (typeof window !== "undefined") {
  window.globalNewImages = window.globalNewImages || []
  window.globalNewDocuments = window.globalNewDocuments || []
  window.globalImagesToDelete = window.globalImagesToDelete || []
  window.globalDocumentsToDelete = window.globalDocumentsToDelete || []
}

// Export a function to get the current files
export function getCurrentFilesData(): {
  newImages: File[]
  newDocuments: File[]
  imagesToDelete: string[]
  documentsToDelete: string[]
} {
  return {
    newImages: window.globalNewImages || [],
    newDocuments: window.globalNewDocuments || [],
    imagesToDelete: window.globalImagesToDelete || [],
    documentsToDelete: window.globalDocumentsToDelete || [],
  }
}

/**
 * A specialized component for editing (vs creation).
 * We show "existing" images/documents so user can remove them,
 * and also allow them to pick brand-new files.
 */
const Step2_5FileUploadsEdit: React.FC<Step2_5Props> = ({ existingImages, existingDocuments, onSubmit, onBack }) => {
  // 1) Keep track of existing items the user *wants to delete*:
  const [imagesToDelete, setImagesToDelete] = useState<string[]>(
    window.globalImagesToDelete?.length ? [...window.globalImagesToDelete] : [],
  )

  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>(
    window.globalDocumentsToDelete?.length ? [...window.globalDocumentsToDelete] : [],
  )

  // 2) Show the existing items that are *still active* (not deleted yet)
  //    We'll remove them from these arrays if the user decides to delete.
  const [activeExistingImages, setActiveExistingImages] = useState<ExistingFile[]>([])
  const [activeExistingDocuments, setActiveExistingDocuments] = useState<ExistingFile[]>([])

  // 3) For brand-new uploads
  const [newImages, setNewImages] = useState<File[]>(window.globalNewImages?.length ? [...window.globalNewImages] : [])

  const [newDocuments, setNewDocuments] = useState<File[]>(
    window.globalNewDocuments?.length ? [...window.globalNewDocuments] : [],
  )

  const [error, setError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // Update global variables when state changes
  useEffect(() => {
    window.globalNewImages = [...newImages]
    window.globalNewDocuments = [...newDocuments]
    window.globalImagesToDelete = [...imagesToDelete]
    window.globalDocumentsToDelete = [...documentsToDelete]

    console.log("Step2_5FileUploadsEdit - Updated globals:", {
      newImages: window.globalNewImages.length,
      newDocuments: window.globalNewDocuments.length,
      imagesToDelete: window.globalImagesToDelete.length,
      documentsToDelete: window.globalDocumentsToDelete.length,
    })
  }, [newImages, newDocuments, imagesToDelete, documentsToDelete])

  useEffect(() => {
    // Filter out the images that are marked for deletion
    const filteredImages = existingImages.filter((img) => !imagesToDelete.includes(img.id))
    const filteredDocuments = existingDocuments.filter((doc) => !documentsToDelete.includes(doc.id))

    setActiveExistingImages(filteredImages || [])
    setActiveExistingDocuments(filteredDocuments || [])
  }, [existingImages, existingDocuments, imagesToDelete, documentsToDelete])

  // Handle selecting brand-new files
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fileType: "image" | "document") => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const allowedExtensions = fileType === "image" ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_DOCUMENT_EXTENSIONS
    const fileArray = Array.from(files)

    const invalidFiles: string[] = []
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      const fileName = file.name || ""
      const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : ""

      if (!extension || !allowedExtensions.includes(extension)) {
        invalidFiles.push(`${fileName} (netinkamas formatas)`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${fileName} (per didelis failas, max 5MB)`)
        return
      }

      validFiles.push(file)
    })

    if (invalidFiles.length > 0) {
      setError(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    } else {
      setError(null)
    }

    if (fileType === "image") {
      setNewImages((prev) => [...prev, ...validFiles])
      window.globalNewImages = [...(window.globalNewImages || []), ...validFiles]
    } else {
      setNewDocuments((prev) => [...prev, ...validFiles])
      window.globalNewDocuments = [...(window.globalNewDocuments || []), ...validFiles]
    }

    event.target.value = ""
  }

  // Remove a brand-new file from the local array
  const removeNewFile = (index: number, fileType: "image" | "document") => {
    if (fileType === "image") {
      setNewImages((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        window.globalNewImages = [...updated]
        return updated
      })
    } else {
      setNewDocuments((prev) => {
        const updated = prev.filter((_, i) => i !== index)
        window.globalNewDocuments = [...updated]
        return updated
      })
    }
  }

  // "Delete" an existing image: add it to imagesToDelete + remove from activeExistingImages
  const deleteExistingImage = (fileId: string) => {
    setImagesToDelete((prev) => {
      const updated = [...prev, fileId]
      window.globalImagesToDelete = [...updated]
      return updated
    })

    setActiveExistingImages((prev) => prev.filter((img) => img.id !== fileId))
  }

  // "Delete" an existing doc
  const deleteExistingDocument = (fileId: string) => {
    setDocumentsToDelete((prev) => {
      const updated = [...prev, fileId]
      window.globalDocumentsToDelete = [...updated]
      return updated
    })

    setActiveExistingDocuments((prev) => prev.filter((doc) => doc.id !== fileId))
  }

  // Document icon for existing doc - FIX: Add null/undefined check
  const getDocumentIcon = (fileName: string | undefined) => {
    // If fileName is undefined or null, return default icon
    if (!fileName) {
      return <Description />
    }

    const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : ""

    switch (extension) {
      case ".pdf":
        return <PictureAsPdf color="error" />
      case ".docx":
      case ".doc":
        return <Article color="primary" />
      case ".txt":
        return <InsertDriveFile color="action" />
      case ".xlsx":
      case ".xls":
        return <TableChart color="success" />
      default:
        return <Description />
    }
  }

  // Format file size to KB with proper handling
  const formatFileSize = (size: number | undefined) => {
    if (typeof size !== "number" || isNaN(size)) {
      return "0 KB"
    }
    return `${(size / 1024).toFixed(1)} KB`
  }

  const handleNext = () => {
    // Update global variables before submitting
    window.globalNewImages = [...newImages]
    window.globalNewDocuments = [...newDocuments]
    window.globalImagesToDelete = [...imagesToDelete]
    window.globalDocumentsToDelete = [...documentsToDelete]

    console.log("Step2_5FileUploadsEdit - Submitting:", {
      newImages: newImages.length,
      newDocuments: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
    })

    onSubmit({
      newImages: newImages || [],
      newDocuments: newDocuments || [],
      imagesToDelete: imagesToDelete || [],
      documentsToDelete: documentsToDelete || [],
    })
  }

  const handleBackClick = () => {
    // Update global variables before going back
    window.globalNewImages = [...newImages]
    window.globalNewDocuments = [...newDocuments]
    window.globalImagesToDelete = [...imagesToDelete]
    window.globalDocumentsToDelete = [...documentsToDelete]

    console.log("Step2_5FileUploadsEdit - Going back with:", {
      newImages: newImages.length,
      newDocuments: newDocuments.length,
      imagesToDelete: imagesToDelete.length,
      documentsToDelete: documentsToDelete.length,
    })

    onBack()
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
          Dokumentai ir nuotraukos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Čia galite ištrinti esamas bylas arba pridėti naujų.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* ====================== IMAGES ====================== */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Image color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Esamos nuotraukos</Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {activeExistingImages.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Nėra įkeltų nuotraukų
                </Typography>
              ) : (
                <List dense sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                  {activeExistingImages.map((file) => (
                    <ListItem key={file.id}>
                      <ListItemIcon>
                        <Image />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.fileName || "Image"}
                        secondary={
                          file.url ? (
                            // Link to actual image
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              Peržiūrėti
                            </a>
                          ) : (
                            ""
                          )
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => deleteExistingImage(file.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Image color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pridėti naujų nuotraukų</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Leistini formatai: JPG, JPEG, PNG, GIF, WEBP (max 5MB)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => imageInputRef.current?.click()}
                fullWidth
                sx={{ mt: 1 }}
              >
                Įkelti nuotraukas
              </Button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileSelect(e, "image")}
                style={{ display: "none" }}
                accept={ALLOWED_IMAGE_EXTENSIONS.join(",")}
                multiple
              />

              {/* List of newly added images */}
              {newImages.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {newImages.map((file, idx) => (
                      <ListItem key={`newimg-${idx}`}>
                        <ListItemIcon>
                          <Image />
                        </ListItemIcon>
                        <ListItemText primary={file.name || "New image"} secondary={formatFileSize(file.size)} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeNewFile(idx, "image")}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Grid>

          {/* ====================== DOCUMENTS ====================== */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Esami dokumentai</Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {activeExistingDocuments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Nėra įkeltų dokumentų
                </Typography>
              ) : (
                <List dense sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                  {activeExistingDocuments.map((file) => (
                    <ListItem key={file.id}>
                      <ListItemIcon>{getDocumentIcon(file.fileName)}</ListItemIcon>
                      <ListItemText
                        primary={file.fileName || "Document"}
                        secondary={
                          file.url ? (
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              Peržiūrėti
                            </a>
                          ) : null
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => deleteExistingDocument(file.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pridėti naujų dokumentų</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Leistini formatai: PDF, DOCX, TXT, XLSX (max 5MB)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => documentInputRef.current?.click()}
                fullWidth
                sx={{ mt: 1 }}
              >
                Įkelti dokumentus
              </Button>
              <input
                type="file"
                ref={documentInputRef}
                onChange={(e) => handleFileSelect(e, "document")}
                style={{ display: "none" }}
                accept={ALLOWED_DOCUMENT_EXTENSIONS.join(",")}
                multiple
              />

              {/* List newly added docs */}
              {newDocuments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {newDocuments.map((file, idx) => (
                      <ListItem key={`newdoc-${idx}`}>
                        <ListItemIcon>{getDocumentIcon(file.name)}</ListItemIcon>
                        <ListItemText primary={file.name || "Document"} secondary={formatFileSize(file.size)} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeNewFile(idx, "document")}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 6 }}>
        <Button variant="outlined" onClick={handleBackClick} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
          Atgal
        </Button>
        <Button variant="contained" onClick={handleNext} size="large" endIcon={<ArrowForward />}>
          Toliau
        </Button>
      </Box>
    </Box>
  )
}

export default Step2_5FileUploadsEdit
