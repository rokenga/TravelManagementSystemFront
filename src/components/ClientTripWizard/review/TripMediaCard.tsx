"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Typography, Paper, Box, Divider, Chip } from "@mui/material"
import { Image, Description, AttachFile } from "@mui/icons-material"

// Import the getCurrentFileData function
import { getCurrentFileData as getCreateFileData } from "../Step2_5FileUploads"

// Define the props interface
interface TripMediaCardProps {
  // Add props for existing images and documents
  existingStepImages?: { [key: number]: Array<{ id: string; url: string; urlInline?: string }> }
  tripImages?: File[] | Array<{ id: string; url: string; fileName?: string }>
  tripDocuments?: File[] | Array<{ id: string; url: string; fileName: string }>
  existingTripImages?: Array<{ id: string; url: string; fileName?: string }>
  existingTripDocuments?: Array<{ id: string; url: string; fileName: string }>
  tripId?: string // Add tripId prop
}

const TripMediaCard: React.FC<TripMediaCardProps> = ({
  existingStepImages = {},
  tripImages = [],
  tripDocuments = [],
  existingTripImages = [],
  existingTripDocuments = [],
  tripId,
}) => {
  // State to store file data
  const [fileData, setFileData] = useState<{
    newImages: File[]
    newDocuments: File[]
    existingImages: Array<{ id: string; url: string; fileName?: string }>
    existingDocuments: Array<{ id: string; url: string; fileName: string }>
    imagesToDelete: string[]
    documentsToDelete: string[]
  }>({
    newImages: [],
    newDocuments: [],
    existingImages: [],
    existingDocuments: [],
    imagesToDelete: [],
    documentsToDelete: [],
  })

  // Add a function to deduplicate documents by id and name
  function deduplicateDocuments(
    documents: Array<{ id: string; url: string; fileName: string }>,
  ): Array<{ id: string; url: string; fileName: string }> {
    const uniqueDocuments: Array<{ id: string; url: string; fileName: string }> = []
    const seenIds = new Set<string>()
    const seenFileNames = new Set<string>()

    documents.forEach((doc) => {
      // Skip if we've seen this ID or fileName before
      if (doc.id && seenIds.has(doc.id)) return
      if (doc.fileName && seenFileNames.has(doc.fileName)) return

      // Add to our tracking sets
      if (doc.id) seenIds.add(doc.id)
      if (doc.fileName) seenFileNames.add(doc.fileName)

      // Add to our result array
      uniqueDocuments.push(doc)
    })

    return uniqueDocuments
  }

  // Modify the useEffect hook to properly handle new images and respect deletions
  useEffect(() => {
    // Try to get data from create mode
    const createData = getCreateFileData()
    console.log("TripMediaCard - Retrieved create file data:", createData)

    // Initialize combined data
    const combinedData = {
      newImages: [] as File[],
      newDocuments: [] as File[],
      existingImages: [] as Array<{ id: string; url: string; fileName?: string }>,
      existingDocuments: [] as Array<{ id: string; url: string; fileName: string }>,
      imagesToDelete: [] as string[],
      documentsToDelete: [] as string[],
    }

    // Use Set to prevent duplicates in deletion arrays
    const imagesToDeleteSet = new Set<string>()
    const documentsToDeleteSet = new Set<string>()

    // Add data from create mode if available
    if (createData) {
      combinedData.newImages = [...combinedData.newImages, ...(createData.newImages || [])]
      combinedData.newDocuments = [...combinedData.newDocuments, ...(createData.newDocuments || [])]

      // Add to Sets to prevent duplicates
      if (createData.imagesToDelete) {
        createData.imagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }
      if (createData.documentsToDelete) {
        createData.documentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    // Try to get data from window.__currentFileData directly as a fallback
    if (window.__currentFileData && (!tripId || window.__currentFileData.tripId === tripId)) {
      console.log("TripMediaCard - Retrieved file data from window:", window.__currentFileData)
      combinedData.newImages = [...combinedData.newImages, ...(window.__currentFileData.newImages || [])]
      combinedData.newDocuments = [...combinedData.newDocuments, ...(window.__currentFileData.newDocuments || [])]

      // Add to Sets to prevent duplicates
      if (window.__currentFileData.imagesToDelete) {
        window.__currentFileData.imagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }
      if (window.__currentFileData.documentsToDelete) {
        window.__currentFileData.documentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    // Try to access global variables directly as a last resort
    if (typeof window.globalNewImages !== "undefined") {
      console.log("TripMediaCard - Found global variables:", {
        images: window.globalNewImages?.length || 0,
        documents: window.globalNewDocuments?.length || 0,
        imagesToDelete: window.globalImagesToDelete?.length || 0,
        documentsToDelete: window.globalDocumentsToDelete?.length || 0,
      })

      if (window.globalNewImages && window.globalNewImages.length > 0) {
        combinedData.newImages = [...combinedData.newImages, ...window.globalNewImages]
      }

      if (window.globalNewDocuments && window.globalNewDocuments.length > 0) {
        combinedData.newDocuments = [...combinedData.newDocuments, ...window.globalNewDocuments]
      }

      // Add to Sets to prevent duplicates
      if (window.globalImagesToDelete && window.globalImagesToDelete.length > 0) {
        window.globalImagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }

      if (window.globalDocumentsToDelete && window.globalDocumentsToDelete.length > 0) {
        window.globalDocumentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    // Process tripImages from props
    if (tripImages && tripImages.length > 0) {
      console.log("TripMediaCard - Processing tripImages from props:", tripImages)

      // Check if the items are File objects or existing image objects
      if (tripImages[0] instanceof File) {
        // These are new images (File objects)
        combinedData.newImages = [...combinedData.newImages, ...(tripImages as File[])]
      } else {
        // These are existing images
        combinedData.existingImages = [
          ...combinedData.existingImages,
          ...(tripImages as Array<{ id: string; url: string; fileName?: string }>),
        ]
      }
    }

    // Process tripDocuments from props
    if (tripDocuments && tripDocuments.length > 0) {
      console.log("TripMediaCard - Processing tripDocuments from props:", tripDocuments)

      // Check if the items are File objects or existing document objects
      if (tripDocuments[0] instanceof File) {
        // These are new documents (File objects)
        combinedData.newDocuments = [...combinedData.newDocuments, ...(tripDocuments as File[])]
      } else {
        // These are existing documents
        combinedData.existingDocuments = [
          ...combinedData.existingDocuments,
          ...(tripDocuments as Array<{ id: string; url: string; fileName: string }>),
        ]
      }
    }

    // Process existingTripImages from props
    if (existingTripImages && existingTripImages.length > 0) {
      console.log("TripMediaCard - Processing existingTripImages from props:", existingTripImages)

      // Filter out images that are marked for deletion
      const filteredExistingImages = existingTripImages.filter((img) => !imagesToDeleteSet.has(img.id))

      combinedData.existingImages = [...combinedData.existingImages, ...filteredExistingImages]
    }

    // Process existingTripDocuments from props
    if (existingTripDocuments && existingTripDocuments.length > 0) {
      console.log("TripMediaCard - Processing existingTripDocuments from props:", existingTripDocuments)

      // Filter out documents that are marked for deletion
      const filteredExistingDocuments = existingTripDocuments.filter((doc) => !documentsToDeleteSet.has(doc.id))

      combinedData.existingDocuments = [...combinedData.existingDocuments, ...filteredExistingDocuments]
    }

    // Convert Sets back to arrays
    combinedData.imagesToDelete = [...imagesToDeleteSet]
    combinedData.documentsToDelete = [...documentsToDeleteSet]

    // Log the combined data
    console.log("TripMediaCard - Combined file data:", {
      newImages: combinedData.newImages.length,
      newDocuments: combinedData.newDocuments.length,
      existingImages: combinedData.existingImages.length,
      existingDocuments: combinedData.existingDocuments.length,
      imagesToDelete: combinedData.imagesToDelete.length,
      documentsToDelete: combinedData.documentsToDelete.length,
    })

    // Update state with the combined data
    setFileData(combinedData)
  }, [tripImages, tripDocuments, existingTripImages, existingTripDocuments, tripId])

  // Deduplicate new images by name
  const uniqueNewImages = fileData.newImages.reduce((acc, current) => {
    const isDuplicate = acc.some((item) => item.name === current.name && item.size === current.size)
    if (!isDuplicate) {
      acc.push(current)
    }
    return acc
  }, [] as File[])

  // Deduplicate existing images by id
  const uniqueExistingImages = fileData.existingImages.reduce(
    (acc, current) => {
      const isDuplicate = acc.some((item) => item.id === current.id)
      if (!isDuplicate) {
        acc.push(current)
      }
      return acc
    },
    [] as Array<{ id: string; url: string; fileName?: string }>,
  )

  // Deduplicate new documents by name
  const uniqueNewDocuments = fileData.newDocuments.reduce((acc, current) => {
    const isDuplicate = acc.some((item) => item.name === current.name && item.size === current.size)
    if (!isDuplicate) {
      acc.push(current)
    }
    return acc
  }, [] as File[])

  // Deduplicate existing documents by id
  const uniqueExistingDocuments = deduplicateDocuments(fileData.existingDocuments)

  // Update the hasDocuments check
  const hasDocuments = uniqueNewDocuments.length > 0 || uniqueExistingDocuments.length > 0

  // Check if we have any media to display
  const hasImages = fileData.newImages.length > 0 || fileData.existingImages.length > 0
  const hasMedia = hasImages || hasDocuments

  // If no media, don't render anything
  if (!hasMedia) {
    console.log("TripMediaCard - No media to display, not rendering")
    return null
  }

  console.log("TripMediaCard - Rendering with:", {
    newImages: fileData.newImages.length,
    newDocuments: fileData.newDocuments.length,
    existingImages: fileData.existingImages.length,
    existingDocuments: fileData.existingDocuments.length,
  })

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: "primary.main", mb: 2, textAlign: "left" }}>
          Kelionės medija
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Trip Images */}
        {hasImages && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Image color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Kelionės nuotraukos ({uniqueNewImages.length + uniqueExistingImages.length})
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {/* New images */}
              {uniqueNewImages.map((image, index) => (
                <Grid item key={`new-${index}`} xs={6} sm={4} md={3} lg={2}>
                  <Box
                    sx={{
                      height: 120,
                      borderRadius: 1,
                      overflow: "hidden",
                      border: "1px solid #eee",
                      position: "relative",
                    }}
                  >
                    <img
                      src={URL.createObjectURL(image) || "/placeholder.svg"}
                      alt={`Trip image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Chip
                      label="Naujas"
                      size="small"
                      color="primary"
                      sx={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        fontSize: "0.625rem",
                        height: 20,
                        opacity: 0.9,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, textAlign: "center" }}>
                    {image.name.length > 20 ? `${image.name.substring(0, 17)}...` : image.name}
                  </Typography>
                </Grid>
              ))}

              {/* Existing images */}
              {uniqueExistingImages.map((image, index) => (
                <Grid item key={`existing-${index}`} xs={6} sm={4} md={3} lg={2}>
                  <Box
                    sx={{
                      height: 120,
                      borderRadius: 1,
                      overflow: "hidden",
                      border: "1px solid #eee",
                    }}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Trip image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, textAlign: "center" }}>
                    {image.fileName
                      ? image.fileName.length > 20
                        ? `${image.fileName.substring(0, 17)}...`
                        : image.fileName
                      : `Nuotrauka ${index + 1}`}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Trip Documents */}
        {hasDocuments && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Kelionės dokumentai ({uniqueNewDocuments.length + uniqueExistingDocuments.length})
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {/* New documents */}
              {uniqueNewDocuments.map((doc, index) => (
                <Grid item key={`new-doc-${index}`} xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      p: 2,
                      border: "1px solid #eee",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <AttachFile color="primary" sx={{ mr: 1 }} />
                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography variant="body2" noWrap title={doc.name}>
                        {doc.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(doc.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <Chip
                      label="Naujas"
                      size="small"
                      color="primary"
                      sx={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        fontSize: "0.625rem",
                        height: 20,
                        opacity: 0.9,
                      }}
                    />
                  </Box>
                </Grid>
              ))}

              {/* Existing documents */}
              {uniqueExistingDocuments.map((doc, index) => (
                <Grid item key={`existing-doc-${index}`} xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      p: 2,
                      border: "1px solid #eee",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AttachFile color="primary" sx={{ mr: 1 }} />
                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography variant="body2" noWrap title={doc.fileName}>
                        {doc.fileName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Grid>
  )
}

export default TripMediaCard
