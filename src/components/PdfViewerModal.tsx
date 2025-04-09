"use client"

import type React from "react"
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Button, CircularProgress } from "@mui/material"
import { Close as CloseIcon, Download as DownloadIcon } from "@mui/icons-material"

interface PdfViewerModalProps {
  open: boolean
  onClose: () => void
  pdfUrl: string | null
  title?: string
  onDownload?: () => void
  loading?: boolean
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  open,
  onClose,
  pdfUrl,
  title = "PDF Peržiūra",
  onDownload,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,0,0,0.12)",
          p: 2,
        }}
      >
        {title}
        <Box sx={{ display: "flex", gap: 1 }}>
          {onDownload && (
            <Button onClick={onDownload} startIcon={<DownloadIcon />} variant="outlined" size="small">
              Atsisiųsti
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="PDF Preview"
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            PDF dokumentas nepasiekiamas
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PdfViewerModal

