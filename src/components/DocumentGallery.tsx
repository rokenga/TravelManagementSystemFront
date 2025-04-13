"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material"
import { PictureAsPdf, Description, Article, TableChart, Close, Download } from "@mui/icons-material"

interface DocumentFile {
  id: string
  url?: string // Attachment SAS URL (forces browser to download)
  urlInline?: string // Inline SAS URL (for <img> or <iframe>)
  fileName?: string
  altText?: string
  type?: string
}

interface DocumentGalleryProps {
  documents: DocumentFile[]
  title?: string
  showTitle?: boolean
}

const DocumentGallery: React.FC<DocumentGalleryProps> = ({ documents, title = "Dokumentai", showTitle = false }) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null)

  if (!documents || documents.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Nėra įkeltų dokumentų
        </Typography>
      </Box>
    )
  }

  // Fix the getDocumentIcon function to handle undefined or null fileName
  const getDocumentIcon = (fileName: string | undefined) => {
    if (!fileName) {
      return <Description fontSize="large" />
    }

    const extension = `.${fileName.split(".").pop()?.toLowerCase()}`
    switch (extension) {
      case ".pdf":
        return <PictureAsPdf fontSize="large" color="error" />
      case ".docx":
      case ".doc":
        return <Article fontSize="large" color="primary" />
      case ".txt":
        return <Description fontSize="large" color="action" />
      case ".xlsx":
      case ".xls":
        return <TableChart fontSize="large" color="success" />
      default:
        return <Description fontSize="large" />
    }
  }

  const handleDocumentClick = (doc: DocumentFile) => {
    setSelectedDoc(doc)
  }

  const handleClosePreview = () => {
    setSelectedDoc(null)
  }

  const handleDownload = (doc: DocumentFile) => {
    // Use the download URL (Url) if available, otherwise fall back to urlInline
    const downloadUrl = doc.url || doc.urlInline

    if (downloadUrl) {
      // Open in a new tab to force download
      window.open(downloadUrl, "_blank")
    }
  }

  // Check if a document can be previewed
  const canPreviewDocument = (doc: DocumentFile): boolean => {
    if (!doc.urlInline || !doc.fileName) return false

    const extension = `.${doc.fileName.split(".").pop()?.toLowerCase()}`
    return extension === ".pdf"
  }

  return (
    <Box sx={{ p: 2 }}>
      {showTitle && title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={doc.id}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                borderRadius: 2,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", p: 2 }}
                onClick={() => handleDocumentClick(doc)}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>{getDocumentIcon(doc.fileName)}</Box>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {doc.fileName || "Dokumentas"}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDoc} onClose={handleClosePreview} maxWidth="lg" fullWidth>
        {selectedDoc && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
              <Typography variant="h6" noWrap sx={{ maxWidth: "80%" }}>
                {selectedDoc.fileName || "Dokumentas"}
              </Typography>
              <Box>
                <Tooltip title="Atsisiųsti">
                  <IconButton onClick={() => handleDownload(selectedDoc)}>
                    <Download />
                  </IconButton>
                </Tooltip>
                <IconButton onClick={handleClosePreview} edge="end">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, height: "80vh" }}>
              {canPreviewDocument(selectedDoc) ? (
                <iframe
                  src={`${selectedDoc.urlInline}#toolbar=0`}
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  title={selectedDoc.fileName || "Dokumentas"}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body1" gutterBottom>
                    Šio dokumento peržiūra negalima. Atsisiųskite dokumentą, kad galėtumėte jį peržiūrėti.
                  </Typography>
                  <Box sx={{ mt: 2 }}>{getDocumentIcon(selectedDoc.fileName)}</Box>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default DocumentGallery
