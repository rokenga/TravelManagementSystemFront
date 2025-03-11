"use client"

import type React from "react"
import { useState } from "react"
import { Box, Dialog, DialogContent, IconButton, Typography, Paper, useTheme, useMediaQuery } from "@mui/material"
import {
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Close as CloseIcon,
} from "@mui/icons-material"

export interface ImageItem {
  id: string
  url: string
  altText?: string
}

interface ImageGalleryProps {
  images: ImageItem[]
  title?: string
  thumbnailSize?: number
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title = "Nuotraukos", thumbnailSize = 100 }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const handleOpenPreview = (index: number) => {
    setCurrentImageIndex(index)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      handlePrevImage()
    } else if (event.key === "ArrowRight") {
      handleNextImage()
    } else if (event.key === "Escape") {
      handleClosePreview()
    }
  }

  if (images.length === 0) {
    return <Typography variant="body1">Nėra nuotraukų.</Typography>
  }

  return (
    <Box>
      {title && (
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        {images.map((image, index) => (
          <Paper
            key={image.id}
            elevation={3}
            sx={{
              overflow: "hidden",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
                cursor: "pointer",
              },
            }}
            onClick={() => handleOpenPreview(index)}
          >
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.altText || "Nuotrauka"}
              style={{
                width: thumbnailSize,
                height: thumbnailSize,
                objectFit: "cover",
                display: "block",
              }}
            />
          </Paper>
        ))}
      </Box>

      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="xl"
        fullScreen={isMobile}
        onKeyDown={handleKeyDown}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            bgcolor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <IconButton
            onClick={handleClosePreview}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              bgcolor: "rgba(0, 0, 0, 0.3)",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            {images.length > 0 && (
              <img
                src={images[currentImageIndex].url || "/placeholder.svg"}
                alt={images[currentImageIndex].altText || "Nuotrauka"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            )}

            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.3)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.3)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                },
              }}
            >
              <ArrowForwardIcon />
            </IconButton>

            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                px: 2,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {currentImageIndex + 1} / {images.length}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ImageGallery

