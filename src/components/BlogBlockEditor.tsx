"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Typography,
  Divider,
} from "@mui/material"
import { Delete, Title, FormatQuote, Image as ImageIcon, HorizontalRule, Notes } from "@mui/icons-material"
import { BlogBlockType, type BlogBlockUpsert } from "../types/Blog"
import RichTextEditor from "./RichTextEditor"

interface BlogBlockEditorProps {
  block: BlogBlockUpsert
  onUpdate: (block: BlogBlockUpsert) => void
  onDelete: () => void
  onFileUpload?: (file: File) => Promise<string>
}

const BlogBlockEditor: React.FC<BlogBlockEditorProps> = ({ block, onUpdate, onDelete, onFileUpload }) => {
  const [uploading, setUploading] = useState(false)

  const handlePayloadChange = (newPayload: any) => {
    onUpdate({ ...block, payload: newPayload })
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !onFileUpload) return

    setUploading(true)
    try {
      const uploadedFiles = []
      for (let i = 0; i < files.length; i++) {
        uploadedFiles.push(files[i])
      }

      const existingFiles = block.payload.files || []
      handlePayloadChange({ ...block.payload, files: [...existingFiles, ...uploadedFiles] })
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    const updatedFiles = (block.payload.files || []).filter((_: File, index: number) => index !== indexToRemove)
    handlePayloadChange({ ...block.payload, files: updatedFiles })
  }

  const renderBlockEditor = () => {
    switch (block.type) {
      case BlogBlockType.Heading:
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Lygis</InputLabel>
              <Select
                value={block.payload.level || 1}
                label="Lygis"
                onChange={(e) => handlePayloadChange({ ...block.payload, level: Number(e.target.value) })}
              >
                <MenuItem value={1}>H1</MenuItem>
                <MenuItem value={2}>H2</MenuItem>
                <MenuItem value={3}>H3</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Antraštės tekstas"
              value={block.payload.text || ""}
              onChange={(e) => handlePayloadChange({ ...block.payload, text: e.target.value })}
              size="small"
            />
          </Box>
        )

      case BlogBlockType.Paragraph:
        return (
          <Box>
            <RichTextEditor
              value={block.payload.html || ""}
              onChange={(html) => handlePayloadChange({ ...block.payload, html })}
              placeholder="Pradėkite rašyti savo turinį..."
              minHeight={300}
            />
          </Box>
        )

      case BlogBlockType.Quote:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Citatos tekstas"
              value={block.payload.text || ""}
              onChange={(e) => handlePayloadChange({ ...block.payload, text: e.target.value })}
              size="small"
            />
            <TextField
              fullWidth
              label="Autorius (neprivaloma)"
              value={block.payload.author || ""}
              onChange={(e) => handlePayloadChange({ ...block.payload, author: e.target.value })}
              size="small"
            />
          </Box>
        )

      case BlogBlockType.Divider:
        return (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Stilius</InputLabel>
            <Select
              value={block.payload.style || "line"}
              label="Stilius"
              onChange={(e) => handlePayloadChange({ ...block.payload, style: e.target.value })}
            >
              <MenuItem value="line">Linija</MenuItem>
              <MenuItem value="dots">Taškai</MenuItem>
            </Select>
          </FormControl>
        )

      case BlogBlockType.Image:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {!block.payload.files?.length ? (
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main", bgcolor: "grey.50" },
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const files = e.dataTransfer.files
                  if (files) handleFileUpload(files)
                }}
                onDragOver={(e) => e.preventDefault()}
                onPaste={(e) => {
                  const items = e.clipboardData?.items
                  if (items) {
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf("image") !== -1) {
                        const file = items[i].getAsFile()
                        if (file) {
                          const fileList = new DataTransfer()
                          fileList.items.add(file)
                          handleFileUpload(fileList.files)
                        }
                      }
                    }
                  }
                }}
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleFileUpload(files)
                  }
                  input.click()
                }}
              >
                <ImageIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Pridėti paveikslėlius
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vilkite paveikslėlius čia, įklijuokite iš mainų srities arba spauskite pasirinkti
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Galite pasirinkti vieną ar kelis paveikslėlius
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 2,
                    justifyItems: "center",
                  }}
                >
                  {block.payload.files?.map((file: File, index: number) => (
                    <Box key={index} sx={{ textAlign: "center", position: "relative" }}>
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                        }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          bgcolor: "white",
                          boxShadow: 1,
                          "&:hover": { bgcolor: "error.light", color: "white" },
                        }}
                        onClick={() => removeImage(index)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                  <Typography variant="body2" color="success.main">
                    ✓ Paveikslėliai pasirinkti ({block.payload.files?.length || 0})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.multiple = true
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (files) handleFileUpload(files)
                      }
                      input.click()
                    }}
                  >
                    Pridėti daugiau
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handlePayloadChange({ ...block.payload, files: [] })}
                  >
                    Pašalinti visus
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  label="Aprašymas (neprivaloma)"
                  value={block.payload.caption || ""}
                  onChange={(e) => handlePayloadChange({ ...block.payload, caption: e.target.value })}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Alt tekstas (neprivaloma)"
                  value={block.payload.alt || ""}
                  onChange={(e) => handlePayloadChange({ ...block.payload, alt: e.target.value })}
                  size="small"
                />
              </Box>
            )}
          </Box>
        )

      default:
        return <Typography color="error">Nežinomas bloko tipas</Typography>
    }
  }

  const getBlockIcon = () => {
    switch (block.type) {
      case BlogBlockType.Heading:
        return <Title />
      case BlogBlockType.Paragraph:
        return <Notes />
      case BlogBlockType.Quote:
        return <FormatQuote />
      case BlogBlockType.Image:
        return <ImageIcon />
      case BlogBlockType.Divider:
        return <HorizontalRule />
      default:
        return <Notes />
    }
  }

  const getBlockTypeName = () => {
    switch (block.type) {
      case BlogBlockType.Heading:
        return "Antraštė"
      case BlogBlockType.Paragraph:
        return "Pastraipa"
      case BlogBlockType.Quote:
        return "Citata"
      case BlogBlockType.Image:
        return "Paveikslėliai"
      case BlogBlockType.Divider:
        return "Skyrybos linija"
      default:
        return "Nežinomas"
    }
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          {getBlockIcon()}
          <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
            {getBlockTypeName()}
          </Typography>
        </Box>

        <Box sx={{ ml: "auto" }}>
          <IconButton onClick={onDelete} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {renderBlockEditor()}
    </Paper>
  )
}

export default BlogBlockEditor
