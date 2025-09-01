"use client"

import type React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import { BlogCategory, type BlogBlockUpsert } from "../types/Blog"
import BlogBlockRenderer from "./BlogBlockRenderer"

interface BlogPreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  category: BlogCategory
  country?: string
  headerImagePreview?: string
  blocks: BlogBlockUpsert[]
}

const getCategoryName = (category: BlogCategory): string => {
  switch (category) {
    case BlogCategory.Europe:
      return "Europa"
    case BlogCategory.Asia:
      return "Azija"
    case BlogCategory.Africa:
      return "Afrika"
    case BlogCategory.Australia:
      return "Australija"
    case BlogCategory.Advice:
      return "Patarimai"
    case BlogCategory.Inspiration:
      return "Įkvėpimas"
    default:
      return category
  }
}

const convertMarkdownToHtml = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$1. $2</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n/g, "<br>")
}

const BlogPreviewModal: React.FC<BlogPreviewModalProps> = ({
  open,
  onClose,
  title,
  category,
  country,
  headerImagePreview,
  blocks,
}) => {
  const processedBlocks = blocks.map((block) => {
    let processedBlock = block
    if (block.type === "Paragraph" && block.payload.html) {
      processedBlock = {
        ...block,
        payload: {
          ...block.payload,
          html: convertMarkdownToHtml(block.payload.html),
        },
      }
    }
    if (block.type === "Image" && block.payload.files) {
      processedBlock = {
        ...block,
        payload: {
          ...block.payload,
          imageUrls: block.payload.files.map((file: File) => URL.createObjectURL(file)),
        },
      }
    }
    return processedBlock
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          Tinklaraščio įrašo peržiūra
        </Typography>
        <Button onClick={onClose} startIcon={<Close />}>
          Uždaryti
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          {/* Header Image */}
          {headerImagePreview && (
            <Box sx={{ mb: 3 }}>
              <img
                src={headerImagePreview || "/placeholder.svg"}
                alt="Header"
                style={{
                  width: "100%",
                  height: "300px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </Box>
          )}

          {/* Title */}
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {title || "Tinklaraščio įrašo pavadinimas"}
          </Typography>

          {/* Meta info */}
          <Box sx={{ display: "flex", gap: 1, mb: 3, alignItems: "center" }}>
            <Chip label={getCategoryName(category)} color="primary" size="small" />
            {country && <Chip label={country} variant="outlined" size="small" />}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {new Date().toLocaleDateString("lt-LT")}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Content blocks */}
          <Box>
            {blocks.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                Turinys dar nepridėtas
              </Typography>
            ) : (
              processedBlocks.map((block, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <BlogBlockRenderer block={block} />
                </Box>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Uždaryti
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BlogPreviewModal
