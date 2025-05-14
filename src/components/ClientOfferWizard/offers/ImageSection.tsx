"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

const MAX_FILE_SIZE_MB = 3 
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

interface ImageSectionProps {
  stepIndex: number
  stepImages?: File[]
  existingStepImages?: Array<{
    id: string
    url: string
    altText?: string
    fileName?: string
    urlInline?: string 
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
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const totalImageSizeMB = stepImages.reduce((total, file) => total + file.size, 0) / (1024 * 1024)
  const isOverSizeLimit = totalImageSizeMB > MAX_FILE_SIZE_BYTES

  const filteredExistingImages = existingStepImages.filter((img) => !deletedImageIds.includes(img.id))

  useEffect(() => {
  }, [existingStepImages, stepIndex])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    const currentImages = stepImages || []
    const newTotalSize =
      currentImages.reduce((total, file) => total + file.size, 0) +
      fileArray.reduce((total, file) => total + file.size, 0)

    if (newTotalSize > MAX_FILE_SIZE_BYTES) {
      alert(`Viršytas maksimalus dydis (${MAX_FILE_SIZE_MB}MB). Pasirinkite mažesnius failus.`)
      event.target.value = ""
      return
    }

    fileArray.forEach((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        invalidFiles.push(`${file.name} (netinkamas formatas)`)
        return
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        invalidFiles.push(`${file.name} (per didelis failas, max ${MAX_FILE_SIZE_MB}MB)`)
        return
      }

      validFiles.push(file)
    })

    if (invalidFiles.length > 0) {
      alert(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    }

    if (validFiles.length > 0) {
      onImageChange(stepIndex, [...stepImages, ...validFiles])
    }

    event.target.value = ""
  }

  const handleExistingImageDelete = (imageId: string) => {

    setDeletedImageIds((prev) => [...prev, imageId])

    if (onExistingImageDelete) {
      onExistingImageDelete(stepIndex, imageId)
    }
  }

  const handleImageError = (imageId: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [imageId]: true,
    }))
  }

  const getImageUrl = (img: any) => {
    if (img.urlInline) return img.urlInline
    if (img.url) return img.url
    return "/placeholder.svg"
  }

  return (
    <Accordion key="images-section" sx={{ mb: 2 }} defaultExpanded>
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
              {(stepImages?.length || 0) + (filteredExistingImages?.length || 0)} nuotraukos
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

            <>
              <Typography variant="subtitle2" gutterBottom>
                Esamos nuotraukos:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {filteredExistingImages.map((img, idx) => (
                  <Grid item key={`existing-${img.id}`}>
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
                      {imageErrors[img.id] ? (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "#f5f5f5",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Nepavyko įkelti
                          </Typography>
                        </Box>
                      ) : (
                        <img
                          src={getImageUrl(img) || "/placeholder.svg"}
                          alt={img.altText || img.fileName || `Nuotrauka ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={() => handleImageError(img.id)}
                        />
                      )}
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
                        onClick={() => handleExistingImageDelete(img.id)}
                        data-image-delete-button="true"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>

          {stepImages.length > 0 ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {filteredExistingImages.length > 0 ? "Naujos nuotraukos:" : "Nuotraukos:"}
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
                        data-image-delete-button="true"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            !filteredExistingImages.length && (
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
