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

export interface FileWithPreview extends File {
  preview?: string
}

export interface ExistingFile {
  id: string
  url: string
  fileName: string
}

interface FileUploadManagerProps {
  newFiles: File[]
  setNewFiles: (files: File[]) => void
  existingFiles?: ExistingFile[]
  onDeleteExisting?: (id: string) => void
  fileType: "image" | "document"
  maxSize?: number 
  allowedExtensions?: string[]
}

const DEFAULT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
const DEFAULT_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"]
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 

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
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extensions =
    allowedExtensions || (fileType === "image" ? DEFAULT_IMAGE_EXTENSIONS : DEFAULT_DOCUMENT_EXTENSIONS)

  useEffect(() => {
    if (fileType === "image") {
      const newPreviews: Record<string, string> = {}

      newFiles.forEach((file, index) => {
        const key = `${file.name}-${index}`
        if (!previews[key]) {
          newPreviews[key] = URL.createObjectURL(file)
        }
      })

      if (Object.keys(newPreviews).length > 0) {
        setPreviews((prev) => ({ ...prev, ...newPreviews }))
      }
    }

    return () => {
      Object.values(previews).forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [newFiles, fileType])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    const invalidFiles: string[] = []
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      const fileName = file.name || ""
      const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : ""

      if (!extension || !extensions.includes(extension)) {
        invalidFiles.push(`${fileName} (netinkamas formatas)`)
        return
      }

      if (file.size > maxSize) {
        invalidFiles.push(`${fileName} (per didelis failas, max ${maxSize / 1024 / 1024}MB)`)
        return
      }

      validFiles.push(file)
    })

    if (invalidFiles.length > 0) {
      setError(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    } else {
      setError(null)
    }

    setNewFiles([...newFiles, ...validFiles])

    event.target.value = ""
  }

  const removeNewFile = (index: number) => {
    const updatedFiles = [...newFiles]
    updatedFiles.splice(index, 1)
    setNewFiles(updatedFiles)
  }

  const handleImageError = (url: string) => {
    console.error(`Image failed to load:`, url)
    setFailedImages((prev) => ({
      ...prev,
      [url]: true,
    }))
  }

  const getDocumentIcon = (fileName: string | undefined) => {
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

  const getFileTypeLabel = () => {
    if (fileType === "image") {
      const count = existingFiles.length + newFiles.length
      if (count === 0) return "nuotraukų"
      if (count === 1) return "nuotrauka"
      if (count % 10 === 0 || (count % 100 >= 11 && count % 100 <= 19)) return "nuotraukų"
      if (count % 10 === 1) return "nuotrauka"
      return "nuotraukos"
    } else {
      const count = existingFiles.length + newFiles.length
      if (count === 0) return "dokumentų"
      if (count === 1) return "dokumentas"
      if (count % 10 === 0 || (count % 100 >= 11 && count % 100 <= 19)) return "dokumentų"
      if (count % 10 === 1) return "dokumentas"
      return "dokumentai"
    }
  }

  const getAllowedExtensionsString = () => {
    return extensions.join(", ").replace(/\./g, "").toUpperCase()
  }

  const formatFileSize = (size: number | undefined) => {
    if (typeof size !== "number" || isNaN(size)) {
      return "0 KB"
    }
    return `${(size / 1024).toFixed(1)} KB`
  }

  const getFilenameFromUrl = (url: string) => {
    try {
      const urlParts = url.split("/")
      const filenameWithParams = urlParts[urlParts.length - 1]
      const filename = filenameWithParams.split("?")[0]
      return decodeURIComponent(filename)
    } catch (e) {
      return fileType === "image" ? "Nuotrauka" : "Dokumentas"
    }
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
          Įkelti {fileType === "image" ? "nuotraukas" : "dokumentus"}
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
        <>
          {existingFiles.length === 0 && newFiles.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Image sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nėra įkeltų nuotraukų
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {existingFiles.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {!failedImages[file.url] ? (
                    <img
                      src={file.url || "/placeholder.svg"}
                      alt={file.fileName || "Nuotrauka"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={() => handleImageError(file.url)}
                    />
                  ) : (
                    <>
                      <Image sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                      <Typography variant="caption" align="center" sx={{ px: 1 }}>
                        {getFilenameFromUrl(file.url).substring(0, 15)}...
                      </Typography>
                    </>
                  )}
                  {onDeleteExisting && (
                    <IconButton
                      size="small"
                      color="error"
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

              {newFiles.map((file, index) => (
                <Box
                  key={`new-img-${index}`}
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={previews[`${file.name || "/placeholder.svg"}-${index}`] || "/placeholder.svg"}
                    alt={file.name || "Nauja nuotrauka"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
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
            </Box>
          )}
        </>
      ) : (
        <>
          {existingFiles.length === 0 && newFiles.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Description sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nėra įkeltų dokumentų
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
              {existingFiles.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>{getDocumentIcon(file.fileName)}</ListItemIcon>
                  <ListItemText
                    primary={file.fileName || "Dokumentas"}
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

              {newFiles.map((file, index) => (
                <ListItem key={`new-doc-${index}`}>
                  <ListItemIcon>{getDocumentIcon(file.name)}</ListItemIcon>
                  <ListItemText primary={file.name || "Dokumentas"} secondary={formatFileSize(file.size)} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => removeNewFile(index)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </>
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
              Nauji failai:{" "}
              {(
                newFiles.reduce((acc, file) => acc + (typeof file.size === "number" ? file.size : 0), 0) /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  )
}
