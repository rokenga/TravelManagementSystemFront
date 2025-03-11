"use client"

import { useState } from "react"
import { PDFViewer, PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Box } from "@mui/material"
import { Download, Preview, Close, OpenInNew } from "@mui/icons-material"
import ClientTripPDFPreview from "./ClientTripPDF"

const PDFActions = ({ tripData, itinerary }) => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const openInNewTab = async () => {
    const blob = await pdf(<ClientTripPDFPreview tripData={tripData} itinerary={itinerary} />).toBlob()
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
      {/* Preview Button */}
      <Button variant="contained" startIcon={<Preview />} onClick={handleOpen}>
        Peržiūrėti PDF
      </Button>

      {/* Download Button */}
      <PDFDownloadLink
        document={<ClientTripPDFPreview tripData={tripData} itinerary={itinerary} />}
        fileName="kelione.pdf"
        style={{ textDecoration: "none" }}
      >
        {({ loading }) => (
          <Button variant="contained" startIcon={<Download />} disabled={loading}>
            {loading ? "Generuojama..." : "Atsisiųsti PDF"}
          </Button>
        )}
      </PDFDownloadLink>

      {/* Open in New Tab Button */}
      <Button variant="contained" startIcon={<OpenInNew />} onClick={openInNewTab}>
        Atidaryti naujame lange
      </Button>

      {/* PDF Preview Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Kelionės PDF peržiūra
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PDFViewer style={{ width: "100%", height: "70vh" }}>
            <ClientTripPDFPreview tripData={tripData} itinerary={itinerary} />
          </PDFViewer>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default PDFActions

