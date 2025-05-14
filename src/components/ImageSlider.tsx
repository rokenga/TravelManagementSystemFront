"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Box, useTheme, useMediaQuery, IconButton } from "@mui/material"
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material"
import type { ImageItem } from "./ImageGallery"

interface ImageSliderProps {
  images: ImageItem[]
  interval?: number
  height?: number
  onImageClick?: (index: number) => void
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, interval = 5000, height = 400, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const actualHeight = isMobile ? 300 : height

  useEffect(() => {
    if (images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images.length, interval])

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  if (!images.length) {
    return (
      <Box
        sx={{
          height: actualHeight,
          bgcolor: "grey.200",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No images available
      </Box>
    )
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          position: "relative",
          height: actualHeight,
          overflow: "hidden",
          cursor: onImageClick ? "pointer" : "default",
        }}
        onClick={() => onImageClick && onImageClick(currentIndex)}
      >
        {images.map((image, index) => (
          <Box
            key={image.id}
            component="img"
            src={image.url || "/placeholder.svg"}
            alt={image.altText || "Trip image"}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: index === currentIndex ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
              zIndex: index === currentIndex ? 1 : 0,
            }}
          />
        ))}

        <IconButton
          sx={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.3)",
            color: "common.white",
            zIndex: 2,
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.5)",
            },
          }}
          onClick={handlePrevious}
        >
          <ArrowBackIos />
        </IconButton>

        <IconButton
          sx={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255,255,255,0.3)",
            color: "common.white",
            zIndex: 2,
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.5)",
            },
          }}
          onClick={handleNext}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          gap: 1,
          p: 1,
          bgcolor: "rgba(0,0,0,0.03)",
          "&::-webkit-scrollbar": {
            height: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 3,
          },
        }}
      >
        {images.map((image, index) => (
          <Box
            key={image.id}
            component="img"
            src={image.url || "/placeholder.svg"}
            alt={image.altText || `Thumbnail ${index + 1}`}
            onClick={() => handleThumbnailClick(index)}
            sx={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: 1,
              cursor: "pointer",
              border: index === currentIndex ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
              opacity: index === currentIndex ? 1 : 0.7,
              transition: "all 0.2s ease",
              "&:hover": {
                opacity: 1,
              },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

export default ImageSlider

