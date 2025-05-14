"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Grid, Typography, Paper, Box, Divider, Chip } from "@mui/material"
import { Image, Description, AttachFile } from "@mui/icons-material"

import { getCurrentFileData as getCreateFileData } from "../Step2_5FileUploads"

interface TripMediaCardProps {
  existingStepImages?: { [key: number]: Array<{ id: string; url: string; urlInline?: string }> }
  tripImages?: File[] | Array<{ id: string; url: string; fileName?: string }>
  tripDocuments?: File[] | Array<{ id: string; url: string; fileName: string }>
  existingTripImages?: Array<{ id: string; url: string; fileName?: string }>
  existingTripDocuments?: Array<{ id: string; url: string; fileName: string }>
  tripId?: string 
}

const TripMediaCard: React.FC<TripMediaCardProps> = ({
  existingStepImages = {},
  tripImages = [],
  tripDocuments = [],
  existingTripImages = [],
  existingTripDocuments = [],
  tripId,
}) => {
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

  function deduplicateDocuments(
    documents: Array<{ id: string; url: string; fileName: string }>,
  ): Array<{ id: string; url: string; fileName: string }> {
    const uniqueDocuments: Array<{ id: string; url: string; fileName: string }> = []
    const seenIds = new Set<string>()
    const seenFileNames = new Set<string>()

    documents.forEach((doc) => {
      if (doc.id && seenIds.has(doc.id)) return
      if (doc.fileName && seenFileNames.has(doc.fileName)) return

      if (doc.id) seenIds.add(doc.id)
      if (doc.fileName) seenFileNames.add(doc.fileName)

      uniqueDocuments.push(doc)
    })

    return uniqueDocuments
  }

  useEffect(() => {
    const createData = getCreateFileData()

    const combinedData = {
      newImages: [] as File[],
      newDocuments: [] as File[],
      existingImages: [] as Array<{ id: string; url: string; fileName?: string }>,
      existingDocuments: [] as Array<{ id: string; url: string; fileName: string }>,
      imagesToDelete: [] as string[],
      documentsToDelete: [] as string[],
    }

    const imagesToDeleteSet = new Set<string>()
    const documentsToDeleteSet = new Set<string>()

    if (createData) {
      combinedData.newImages = [...combinedData.newImages, ...(createData.newImages || [])]
      combinedData.newDocuments = [...combinedData.newDocuments, ...(createData.newDocuments || [])]

      if (createData.imagesToDelete) {
        createData.imagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }
      if (createData.documentsToDelete) {
        createData.documentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    if (window.__currentFileData && (!tripId || window.__currentFileData.tripId === tripId)) {
      combinedData.newImages = [...combinedData.newImages, ...(window.__currentFileData.newImages || [])]
      combinedData.newDocuments = [...combinedData.newDocuments, ...(window.__currentFileData.newDocuments || [])]

      if (window.__currentFileData.imagesToDelete) {
        window.__currentFileData.imagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }
      if (window.__currentFileData.documentsToDelete) {
        window.__currentFileData.documentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    if (typeof window.globalNewImages !== "undefined") {
      if (window.globalNewImages && window.globalNewImages.length > 0) {
        combinedData.newImages = [...combinedData.newImages, ...window.globalNewImages]
      }

      if (window.globalNewDocuments && window.globalNewDocuments.length > 0) {
        combinedData.newDocuments = [...combinedData.newDocuments, ...window.globalNewDocuments]
      }

      if (window.globalImagesToDelete && window.globalImagesToDelete.length > 0) {
        window.globalImagesToDelete.forEach((id) => imagesToDeleteSet.add(id))
      }

      if (window.globalDocumentsToDelete && window.globalDocumentsToDelete.length > 0) {
        window.globalDocumentsToDelete.forEach((id) => documentsToDeleteSet.add(id))
      }
    }

    if (tripImages && tripImages.length > 0) {
      if (tripImages[0] instanceof File) {
        combinedData.newImages = [...combinedData.newImages, ...(tripImages as File[])]
      } else {
        combinedData.existingImages = [
          ...combinedData.existingImages,
          ...(tripImages as Array<{ id: string; url: string; fileName?: string }>),
        ]
      }
    }

    if (tripDocuments && tripDocuments.length > 0) {
      if (tripDocuments[0] instanceof File) {
        combinedData.newDocuments = [...combinedData.newDocuments, ...(tripDocuments as File[])]
      } else {
        combinedData.existingDocuments = [
          ...combinedData.existingDocuments,
          ...(tripDocuments as Array<{ id: string; url: string; fileName: string }>),
        ]
      }
    }

    if (existingTripImages && existingTripImages.length > 0) {
      const filteredExistingImages = existingTripImages.filter((img) => !imagesToDeleteSet.has(img.id))
      combinedData.existingImages = [...combinedData.existingImages, ...filteredExistingImages]
    }

    if (existingTripDocuments && existingTripDocuments.length > 0) {
      const filteredExistingDocuments = existingTripDocuments.filter((doc) => !documentsToDeleteSet.has(doc.id))
      combinedData.existingDocuments = [...combinedData.existingDocuments, ...filteredExistingDocuments]
    }

    combinedData.imagesToDelete = [...imagesToDeleteSet]
    combinedData.documentsToDelete = [...documentsToDeleteSet]

    setFileData(combinedData)
  }, [tripImages, tripDocuments, existingTripImages, existingTripDocuments, tripId])

  const uniqueNewImages = fileData.newImages.reduce((acc, current) => {
    const isDuplicate = acc.some((item) => item.name === current.name && item.size === current.size)
    if (!isDuplicate) {
      acc.push(current)
    }
    return acc
  }, [] as File[])

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

  const uniqueNewDocuments = fileData.newDocuments.reduce((acc, current) => {
    const isDuplicate = acc.some((item) => item.name === current.name && item.size === current.size)
    if (!isDuplicate) {
      acc.push(current)
    }
    return acc
  }, [] as File[])

  const uniqueExistingDocuments = deduplicateDocuments(fileData.existingDocuments)

  const hasDocuments = uniqueNewDocuments.length > 0 || uniqueExistingDocuments.length > 0

  const hasImages = fileData.newImages.length > 0 || fileData.existingImages.length > 0
  const hasMedia = hasImages || hasDocuments

  if (!hasMedia) {
    return null
  }

  return (
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: "primary.main", mb: 2, textAlign: "left" }}>
          Kelionės medija
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {hasImages && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Image color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Kelionės nuotraukos ({uniqueNewImages.length + uniqueExistingImages.length})
              </Typography>
            </Box>

            <Grid container spacing={1}>
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

        {hasDocuments && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Kelionės dokumentai ({uniqueNewDocuments.length + uniqueExistingDocuments.length})
              </Typography>
            </Box>

            <Grid container spacing={1}>
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
