"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Button, Grid, IconButton, Typography, Alert } from "@mui/material"
import { Image as ImageIcon, Delete, Upload } from "@mui/icons-material"
import CustomSnackbar from "../../CustomSnackBar"
import type { AlertColor } from "@mui/material"

interface ImageUploadFormProps {
  images: File[]
  onImageChange: (files: File[]) => void
  existingImageUrls?: string[]
  onExistingImageDelete?: (imageId: string) => void
}

const MAX_FILE_SIZE_MB = 2 
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  images,
  onImageChange,
  existingImageUrls = [],
  onExistingImageDelete,
}) => {


  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  useEffect(() => {
  }, [existingImageUrls])

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: AlertColor
  }>({
    open: false,
    message: "",
    severity: "error",
  })

  const totalSizeMB = images.reduce((total, file) => total + file.size, 0) / (1024 * 1024)
  const isOverSizeLimit = totalSizeMB > MAX_FILE_SIZE_MB

  const showSnackbar = (message: string, severity: AlertColor = "error") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    const newTotalSize =
      images.reduce((total, file) => total + file.size, 0) + fileArray.reduce((total, file) => total + file.size, 0)

    if (newTotalSize > MAX_FILE_SIZE_BYTES) {
      showSnackbar(`Viršytas maksimalus dydis (${MAX_FILE_SIZE_MB}MB). Pasirinkite mažesnius failus.`)
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
      showSnackbar(`Kai kurie failai nebuvo įkelti: ${invalidFiles.join(", ")}`)
    }

    if (validFiles.length > 0) {
      onImageChange([...images, ...validFiles])
    }

    event.target.value = ""
  }

  const handleDeleteExistingImage = (imageUrl: string) => {
    if (onExistingImageDelete) {
      onExistingImageDelete(imageUrl)
    }
  }

  const handleImageError = (url: string) => {
    setFailedImages((prev) => ({
      ...prev,
      [url]: true,
    }))
  }

  const hasImages = images.length > 0 || (Array.isArray(existingImageUrls) && existingImageUrls.length > 0)

  const getFilenameFromUrl = (url: string) => {
    try {
      if (!url) return "Image"

      const urlParts = url.split("/")
      const filenameWithParams = urlParts[urlParts.length - 1]
      const filename = filenameWithParams.split("?")[0]
      return decodeURIComponent(filename)
    } catch (e) {
      return "Image"
    }
  }

  const totalImageCount = images.length + (Array.isArray(existingImageUrls) ? existingImageUrls.length : 0)
  const hasEvenNumberOfImages = totalImageCount % 2 === 0

  useEffect(() => {
    return () => {
      images.forEach((file) => {
        if (file && URL.createObjectURL) {
          URL.revokeObjectURL(URL.createObjectURL(file))
        }
      })
    }
  }, [images])

  const safeExistingImageUrls = Array.isArray(existingImageUrls) ? existingImageUrls.filter(Boolean) : []

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Leistini formatai: {ALLOWED_EXTENSIONS.join(", ").replace(/\./g, "").toUpperCase()}
          (max {MAX_FILE_SIZE_MB}MB vienai dienai)
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
          Patarimas: Geriausia įkelti lyginį skaičių nuotraukų, kad jos būtų gražiai išdėstytos.
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

      {!hasEvenNumberOfImages && totalImageCount > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Šiuo metu turite {totalImageCount} nuotraukų. Rekomenduojama įkelti lyginį skaičių nuotraukų.
        </Alert>
      )}

      {safeExistingImageUrls.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Esamos nuotraukos:
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {safeExistingImageUrls
              .filter((url) => !!url)
              .map((url, idx) => (
                <Grid item key={`existing-${idx}-${url ? url.substring(0, 8) : idx}`}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      overflow: "hidden",
                      position: "relative",
                      bgcolor: "rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {!failedImages[url] ? (
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Nuotrauka ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={() => handleImageError(url)}
                      />
                    ) : (
                      <>
                        <ImageIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                        <Typography variant="caption" align="center" sx={{ px: 1 }}>
                          {getFilenameFromUrl(url).substring(0, 15)}...
                        </Typography>
                      </>
                    )}
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
                        onClick={() => handleDeleteExistingImage(url)}
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

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </Box>
  )
}

export default ImageUploadForm
