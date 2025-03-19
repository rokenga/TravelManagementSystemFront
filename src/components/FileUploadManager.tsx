"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
} from "@mui/material"
import {
  Upload,
  Description,
  Image,
  Delete,
  PictureAsPdf,
  InsertDriveFile,
  Article,
  TableChart,
} from "@mui/icons-material"

// File types
export interface FileWithPreview extends File {
  preview?: string
}

export interface ExistingFile {
  id: string
  url: string
  fileName: string
  preview?: string
}

interface FileUploadManagerProps {
  newFiles: FileWithPreview[]
  setNewFiles: (files: FileWithPreview[]) => void
  existingFiles?: ExistingFile[]
  onDeleteExisting?: (id: string) => void
  fileType: "image" | "document"
  maxSize?: number // in bytes
  allowedExtensions?: string[]
}

// Default allowed extensions and max file size
const DEFAULT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
const DEFAULT_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"]
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  newFiles,
  setNewFiles,
  existingFiles = [],
  onDeleteExisting,
  fileType,
  maxSize = DEFAULT_MAX_SIZE,
  allowedExtensions,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [/*previewDialogOpen*/ /*setPreviewDialogOpen*/ ,] = useState(false)
  const [/*previewUrl*/ /*setPreviewUrl*/ ,] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine allowed extensions based on file type
  const extensions =
    allowedExtensions || (fileType === "image" ? DEFAULT_IMAGE_EXTENSIONS : DEFAULT_DOCUMENT_EXTENSIONS)

  // Create object URLs for previews
  useEffect(() => {
    // Generate previews for new files that are images
    if (fileType === "image") {
      newFiles.forEach((file) => {
        if (!file.preview) {
          const objectUrl = URL.createObjectURL(file)
          file.preview = objectUrl
        }
      })
    }

    // Cleanup function to revoke object URLs
    return () => {
      newFiles.forEach((file) => {
        if (file.preview && !file.preview.startsWith("http")) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [newFiles, fileType])

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Convert FileList to array
    const fileArray = Array.from(files)

    // Validate each file
    const invalidFiles: string[] = []
    const validFiles: FileWithPreview[] = []

    fileArray.forEach((file) => {
      // Check file extension
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!extensions.includes(extension)) {
        invalidFiles.push(`${file.name} (netinkamas formatas)`)
        return
      }

      // Check file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (per didelis failas, max ${maxSize / 1024 / 1024}MB)`)
        return
      }

      validFiles.push(file)
    })

    // Show error if there are invalid files
    if (invalidFiles.length > 0) {
      setError(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    } else {
      setError(null)
    }

    // Add valid files to state
    setNewFiles([...newFiles, ...validFiles])

    // Reset the input
    event.target.value = ""
  }

  // Remove a new file
  const removeNewFile = (index: number) => {
    const updatedFiles = [...newFiles]
    updatedFiles.splice(index, 1)
    setNewFiles(updatedFiles)
  }

  // Get icon for document type
  const getDocumentIcon = (fileName: string) => {
    const extension = `.${fileName.split(".").pop()?.toLowerCase()}`

    switch (extension) {
      case ".pdf":
        return <PictureAsPdf color="error" />
      case ".docx":
        return <Article color="primary" />
      case ".txt":
        return <InsertDriveFile color="action" />
      case ".xlsx":
        return <TableChart color="success" />
      default:
        return <Description />
    }
  }

  // Open preview dialog
  /*const openPreview = (url: string) => {
    setPreviewUrl(url)
    setPreviewDialogOpen(true)
  }*/

  // Get the appropriate icon based on file type
  const getFileIcon = (fileName: string) => {
    return fileType === "image" ? <Image /> : getDocumentIcon(fileName)
  }

  // Get the appropriate label for the file type
  const getFileTypeLabel = () => {
    return fileType === "image" ? "Nuotraukos" : "Dokumentai"
  }

  // Get the allowed extensions as a string
  const getAllowedExtensionsString = () => {
    return extensions.join(", ").replace(/\./g, "").toUpperCase()
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {fileType === "image" ? (
          <Image color="primary" sx={{ mr: 1 }} />
        ) : (
          <Description color="primary" sx={{ mr: 1 }} />
        )}
        <Typography variant="h6">{fileType === "image" ? "Nuotraukos" : "Dokumentai"}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Leistini formatai: {getAllowedExtensionsString()} (max {maxSize / 1024 / 1024}MB)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          sx={{ mt: 1 }}
        >
          Įkelti
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept={extensions.join(",")}
          multiple
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />


      {fileType === "image" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {/* Display existing images */}
          {existingFiles.map((file) => (
            <Box
              key={file.id}
              sx={{
                position: "relative",
                width: 80,
                height: 80,
                border: "1px solid #ddd",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <img
                src={file.url || "/placeholder.svg"}
                alt={file.fileName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {onDeleteExisting && (
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "rgba(255,255,255,0.7)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                  }}
                  onClick={() => onDeleteExisting(file.id)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}

          {/* Display new images */}
          {newFiles.map((file, index) => (
            <Box
              key={`new-img-${index}`}
              sx={{
                position: "relative",
                width: 80,
                height: 80,
                border: "1px solid #ddd",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <img
                src={file.preview || "/placeholder.svg"}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <IconButton
                size="small"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
                onClick={() => removeNewFile(index)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {existingFiles.length === 0 && newFiles.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ width: "100%", py: 2 }}>
              Nėra įkeltų {getFileTypeLabel()}
            </Typography>
          )}
        </Box>
      ) : (
        <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
          {/* Display existing documents */}
          {existingFiles.map((file) => (
            <ListItem key={file.id}>
              <ListItemIcon>{getDocumentIcon(file.fileName)}</ListItemIcon>
              <ListItemText
                primary={file.fileName}
                secondary={
                  <a href={file.url} target="_blank" rel="noreferrer">
                    Peržiūrėti
                  </a>
                }
              />
              {onDeleteExisting && (
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => onDeleteExisting(file.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}

          {/* Display new documents */}
          {newFiles.map((file, index) => (
            <ListItem key={`new-doc-${index}`}>
              <ListItemIcon>{getDocumentIcon(file.name)}</ListItemIcon>
              <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => removeNewFile(index)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}

          {existingFiles.length === 0 && newFiles.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              Nėra įkeltų {getFileTypeLabel()}
            </Typography>
          )}
        </List>
      )}

      {(existingFiles.length > 0 || newFiles.length > 0) && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip
            label={`${existingFiles.length + newFiles.length} ${getFileTypeLabel()}`}
            color="primary"
            size="small"
          />
          {newFiles.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Nauji failai: {(newFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  )
}

