"use client"

import type React from "react"
import { useState, useRef } from "react"
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
  Chip,
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

interface Step2_5Props {
  initialImages: File[]
  initialDocuments: File[]
  onSubmit: (images: File[], documents: File[]) => void
  onBack: () => void
}

// Allowed file extensions
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"]

// Max file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

const Step2_5FileUploads: React.FC<Step2_5Props> = ({ initialImages, initialDocuments, onSubmit, onBack }) => {
  const [images, setImages] = useState<File[]>(initialImages || [])
  const [documents, setDocuments] = useState<File[]>(initialDocuments || [])
  const [error, setError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fileType: "image" | "document") => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const allowedExtensions = fileType === "image" ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_DOCUMENT_EXTENSIONS
    const fileTypeLabel = fileType === "image" ? "nuotraukos" : "dokumento"

    // Convert FileList to array for easier processing
    const fileArray = Array.from(files)

    // Validate each file
    const invalidFiles: string[] = []
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      // Check file extension
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!allowedExtensions.includes(extension)) {
        invalidFiles.push(`${file.name} (netinkamas formatas)`)
        return
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (per didelis failas, max 5MB)`)
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
    if (fileType === "image") {
      setImages((prev) => [...prev, ...validFiles])
    } else {
      setDocuments((prev) => [...prev, ...validFiles])
    }

    // Reset the input
    event.target.value = ""
  }

  // Remove a file
  const removeFile = (index: number, fileType: "image" | "document") => {
    if (fileType === "image") {
      setImages((prev) => prev.filter((_, i) => i !== index))
    } else {
      setDocuments((prev) => prev.filter((_, i) => i !== index))
    }
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

  // Handle next button click
  const handleNext = () => {
    onSubmit(images, documents)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
          Dokumentai ir nuotraukos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Pridėkite kelionės dokumentus ir nuotraukas. Galite pridėti kelis failus vienu metu.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Images Section */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Image color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Nuotraukos</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
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
              </Box>

              <Divider sx={{ mb: 2 }} />

              {images.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Nėra įkeltų nuotraukų
                </Typography>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                  {images.map((file, index) => (
                    <ListItem key={`image-${index}`}>
                      <ListItemIcon>
                        <Image />
                      </ListItemIcon>
                      <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => removeFile(index, "image")}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {images.length > 0 && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip label={`${images.length} nuotraukos`} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Bendras dydis: {(images.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Documents Section */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Dokumentai</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
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
              </Box>

              <Divider sx={{ mb: 2 }} />

              {documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Nėra įkeltų dokumentų
                </Typography>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                  {documents.map((file, index) => (
                    <ListItem key={`doc-${index}`}>
                      <ListItemIcon>{getDocumentIcon(file.name)}</ListItemIcon>
                      <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => removeFile(index, "document")}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {documents.length > 0 && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip label={`${documents.length} dokumentai`} color="primary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    Bendras dydis: {(documents.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 6 }}>
        <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }} size="large" startIcon={<ArrowBack />}>
          Atgal
        </Button>
        <Button variant="contained" onClick={handleNext} size="large" endIcon={<ArrowForward />}>
          Toliau
        </Button>
      </Box>
    </Box>
  )
}

export default Step2_5FileUploads

