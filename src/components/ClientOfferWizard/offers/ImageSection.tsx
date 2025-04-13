"use client"

import type React from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Box,
  Button,
  Grid,
  Alert,
} from "@mui/material"
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Image, Upload } from "@mui/icons-material"

// Constants for file upload restrictions
const MAX_FILE_SIZE_MB = 3 // 3MB per offer step
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

interface ImageSectionProps {
  stepIndex: number
  stepImages?: File[]
  existingStepImages?: Array<{
    id: string
    url: string
    altText?: string
  }>
  onImageChange: (stepIndex: number, files: File[]) => void
  onRemoveImageSection: (stepIndex: number) => void
  onExistingImageDelete?: (stepIndex: number, imageId: string) => void
}

const ImageSection: React.FC<ImageSectionProps> = ({
  stepIndex,
  stepImages = [],
  existingStepImages = [],
  onImageChange,
  onRemoveImageSection,
  onExistingImageDelete,
}) => {
  // Calculate total size of current images
  const totalImageSizeMB = stepImages.reduce((total, file) => total + file.size, 0) / (1024 * 1024)
  const isOverSizeLimit = totalImageSizeMB > MAX_FILE_SIZE_MB

  // Handle file selection for images
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Convert FileList to array
    const fileArray = Array.from(files)

    // Validate files
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Calculate new total size
    const currentImages = stepImages || []
    const newTotalSize =
      currentImages.reduce((total, file) => total + file.size, 0) +
      fileArray.reduce((total, file) => total + file.size, 0)

    // Check if adding these files would exceed the limit
    if (newTotalSize > MAX_FILE_SIZE_BYTES) {
      alert(`Viršytas maksimalus dydis (${MAX_FILE_SIZE_MB}MB). Pasirinkite mažesnius failus.`)
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
      alert(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    }

    // Add valid files to state
    if (validFiles.length > 0) {
      onImageChange(stepIndex, [...stepImages, ...validFiles])
    }

    // Reset the input
    event.target.value = ""
  }

  return (
    <Accordion key="images-section" sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="images-content"
        id="images-header"
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Image sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              Nuotraukos
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
              {(stepImages?.length || 0) + (existingStepImages?.length || 0)} nuotraukos
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveImageSection(stepIndex)
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: "background.default" }}>
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

          {/* Display existing images from the server */}
          {existingStepImages && existingStepImages.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Esamos nuotraukos:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {existingStepImages.map((img, idx) => (
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
                        src={img.url || "/placeholder.svg"}
                        alt={img.altText || `Nuotrauka ${idx + 1}`}
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
                        onClick={() => {
                          if (onExistingImageDelete) {
                            onExistingImageDelete(stepIndex, img.id)
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Display newly added images */}
          {stepImages.length > 0 ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {existingStepImages && existingStepImages.length > 0 ? "Naujos nuotraukos:" : "Nuotraukos:"}
              </Typography>
              <Grid container spacing={2}>
                {stepImages.map((file, index) => (
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
                          const newFiles = [...stepImages]
                          newFiles.splice(index, 1)
                          onImageChange(stepIndex, newFiles)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            !existingStepImages?.length && (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Nėra įkeltų nuotraukų
                </Typography>
              </Box>
            )
          )}

          {stepImages.length > 0 && (
            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Typography variant="body2" color="text.secondary">
                Bendras dydis: {totalImageSizeMB.toFixed(2)} MB / {MAX_FILE_SIZE_MB} MB
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default ImageSection
