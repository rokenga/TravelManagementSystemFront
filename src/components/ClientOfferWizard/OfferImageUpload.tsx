"use client"

import type React from "react"
import { useState } from "react"
import { Box, Button, Grid, IconButton, Typography, Alert } from "@mui/material"
import { Image as ImageIcon, Delete, Upload } from "@mui/icons-material"
import CustomSnackbar from "../CustomSnackBar"
import type { AlertColor } from "@mui/material"

interface OfferImageUploadProps {
  images: File[]
  onImageChange: (files: File[]) => void
  existingImageUrls?: string[]
  onExistingImageDelete?: (imageId: string) => void
}

// Constants for file upload restrictions
const MAX_FILE_SIZE_MB = 5 // 5MB per offer step
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

const OfferImageUpload: React.FC<OfferImageUploadProps> = ({
  images,
  onImageChange,
  existingImageUrls = [],
  onExistingImageDelete,
}) => {
  // State for snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: AlertColor
  }>({
    open: false,
    message: "",
    severity: "error",
  })

  // Calculate total size of current images
  const totalSizeMB = images.reduce((total, file) => total + file.size, 0) / (1024 * 1024)
  const isOverSizeLimit = totalSizeMB > MAX_FILE_SIZE_MB

  // Show snackbar message
  const showSnackbar = (message: string, severity: AlertColor = "error") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }))
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Convert FileList to array
    const fileArray = Array.from(files)

    // Validate files
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Calculate new total size
    const newTotalSize =
      images.reduce((total, file) => total + file.size, 0) + fileArray.reduce((total, file) => total + file.size, 0)

    // Check if adding these files would exceed the limit
    if (newTotalSize > MAX_FILE_SIZE_BYTES) {
      showSnackbar(`Viršytas maksimalus dydis (${MAX_FILE_SIZE_MB}MB). Pasirinkite mažesnius failus.`)
      event.target.value = ""
      return
    }

    fileArray.forEach((file) => {
      // Check file extension
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        invalidFiles.push(`${file.name} (netinkamas formatas)`)
        return
      }

      // Check individual file size (optional additional check)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        invalidFiles.push(`${file.name} (per didelis failas, max ${MAX_FILE_SIZE_MB}MB)`)
        return
      }

      validFiles.push(file)
    })

    // Show error if there are invalid files
    if (invalidFiles.length > 0) {
      showSnackbar(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    }

    // Add valid files to state
    if (validFiles.length > 0) {
      onImageChange([...images, ...validFiles])
    }

    // Reset the input
    event.target.value = ""
  }

  // Check if we have any images (new or existing)
  const hasImages = images.length > 0 || existingImageUrls.length > 0

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Leistini formatai: {ALLOWED_EXTENSIONS.join(", ").replace(/\./g, "").toUpperCase()}
          (max {MAX_FILE_SIZE_MB}MB vienam pasiūlymui)
        </Typography>

        <Button
          variant="outlined"
          component="label"
          startIcon={<Upload />}
          fullWidth
          sx={{ mt: 1 }}
          disabled={isOverSizeLimit}
        >
          Įkelti nuotraukas
          <input hidden accept={ALLOWED_EXTENSIONS.join(",")} multiple type="file" onChange={handleFileSelect} />
        </Button>
      </Box>

      {isOverSizeLimit && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Viršytas maksimalus dydis ({MAX_FILE_SIZE_MB}MB). Ištrinkite kai kurias nuotraukas.
        </Alert>
      )}

      {existingImageUrls && existingImageUrls.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Esamos nuotraukos:
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {existingImageUrls.map((url, idx) => (
              <Grid item key={`existing-${idx}`}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Nuotrauka ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {onExistingImageDelete && (
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
                      onClick={() => onExistingImageDelete(url)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {images.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Naujos nuotraukos:
          </Typography>
          <Grid container spacing={2}>
            {images.map((file, index) => (
              <Grid item key={index}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt={file.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                    onClick={() => {
                      const newFiles = [...images]
                      newFiles.splice(index, 1)
                      onImageChange(newFiles)
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {!hasImages && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <ImageIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nėra įkeltų nuotraukų
          </Typography>
        </Box>
      )}

      {images.length > 0 && (
        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary">
            Bendras dydis: {totalSizeMB.toFixed(2)} MB / {MAX_FILE_SIZE_MB} MB
          </Typography>
        </Box>
      )}

      {/* Custom Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  )
}

export default OfferImageUpload

