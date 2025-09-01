"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Box, IconButton, Divider, Tooltip, Paper } from "@mui/material"
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  FormatQuote,
} from "@mui/icons-material"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Pradėkite rašyti...",
  minHeight = 200,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const updateActiveFormats = () => {
    const formats = new Set<string>()

    if (document.queryCommandState("bold")) formats.add("bold")
    if (document.queryCommandState("italic")) formats.add("italic")
    if (document.queryCommandState("underline")) formats.add("underline")
    if (document.queryCommandState("insertUnorderedList")) formats.add("bulletList")
    if (document.queryCommandState("insertOrderedList")) formats.add("numberedList")

    setActiveFormats(formats)
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    setTimeout(updateActiveFormats, 10)
    editorRef.current?.focus()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleSelectionChange = () => {
    updateActiveFormats()
  }

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for lists
    if (e.key === "Enter") {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const parentElement = range.commonAncestorContainer.parentElement

        if (parentElement?.tagName === "LI") {
          // Let the browser handle list continuation
          return
        }
      }
    }

    // Handle common shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          executeCommand("bold")
          break
        case "i":
          e.preventDefault()
          executeCommand("italic")
          break
        case "u":
          e.preventDefault()
          executeCommand("underline")
          break
      }
    }
  }

  const insertLink = () => {
    const url = prompt("Įveskite nuorodos adresą:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const insertQuote = () => {
    executeCommand("formatBlock", "blockquote")
  }

  return (
    <Box>
      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          p: 1,
          bgcolor: "grey.50",
          borderRadius: "4px 4px 0 0",
          border: "1px solid",
          borderColor: isFocused ? "primary.main" : "grey.300",
          borderBottom: "none",
          flexWrap: "wrap",
        }}
      >
        <Tooltip title="Paryškintas tekstas (Ctrl+B)">
          <IconButton
            size="small"
            onClick={() => executeCommand("bold")}
            sx={{
              bgcolor: activeFormats.has("bold") ? "primary.main" : "transparent",
              color: activeFormats.has("bold") ? "white" : "inherit",
              "&:hover": {
                bgcolor: activeFormats.has("bold") ? "primary.dark" : "grey.100",
              },
            }}
          >
            <FormatBold />
          </IconButton>
        </Tooltip>

        <Tooltip title="Kursyvas (Ctrl+I)">
          <IconButton
            size="small"
            onClick={() => executeCommand("italic")}
            sx={{
              bgcolor: activeFormats.has("italic") ? "primary.main" : "transparent",
              color: activeFormats.has("italic") ? "white" : "inherit",
              "&:hover": {
                bgcolor: activeFormats.has("italic") ? "primary.dark" : "grey.100",
              },
            }}
          >
            <FormatItalic />
          </IconButton>
        </Tooltip>

        <Tooltip title="Pabrauktas (Ctrl+U)">
          <IconButton
            size="small"
            onClick={() => executeCommand("underline")}
            sx={{
              bgcolor: activeFormats.has("underline") ? "primary.main" : "transparent",
              color: activeFormats.has("underline") ? "white" : "inherit",
              "&:hover": {
                bgcolor: activeFormats.has("underline") ? "primary.dark" : "grey.100",
              },
            }}
          >
            <FormatUnderlined />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Sąrašas su ženkleliais">
          <IconButton
            size="small"
            onClick={() => executeCommand("insertUnorderedList")}
            sx={{
              bgcolor: activeFormats.has("bulletList") ? "primary.main" : "transparent",
              color: activeFormats.has("bulletList") ? "white" : "inherit",
              "&:hover": {
                bgcolor: activeFormats.has("bulletList") ? "primary.dark" : "grey.100",
              },
            }}
          >
            <FormatListBulleted />
          </IconButton>
        </Tooltip>

        <Tooltip title="Numeruotas sąrašas">
          <IconButton
            size="small"
            onClick={() => executeCommand("insertOrderedList")}
            sx={{
              bgcolor: activeFormats.has("numberedList") ? "primary.main" : "transparent",
              color: activeFormats.has("numberedList") ? "white" : "inherit",
              "&:hover": {
                bgcolor: activeFormats.has("numberedList") ? "primary.dark" : "grey.100",
              },
            }}
          >
            <FormatListNumbered />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Nuoroda">
          <IconButton size="small" onClick={insertLink}>
            <Link />
          </IconButton>
        </Tooltip>

        <Tooltip title="Citata">
          <IconButton size="small" onClick={insertQuote}>
            <FormatQuote />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        sx={{
          minHeight: `${minHeight}px`,
          maxHeight: "500px",
          overflowY: "auto",
          p: 2,
          border: "1px solid",
          borderColor: isFocused ? "primary.main" : "grey.300",
          borderRadius: "0 0 4px 4px",
          bgcolor: "background.paper",
          fontSize: "16px",
          lineHeight: 1.6,
          outline: "none",
          textAlign: "left",
          "&:empty::before": {
            content: `"${placeholder}"`,
            color: "text.secondary",
            fontStyle: "italic",
          },
          "& p": {
            margin: "0 0 16px 0",
            "&:last-child": {
              marginBottom: 0,
            },
          },
          "& h1, & h2, & h3": {
            margin: "24px 0 16px 0",
            "&:first-child": {
              marginTop: 0,
            },
          },
          "& ul, & ol": {
            margin: "16px 0",
            paddingLeft: "24px",
          },
          "& li": {
            margin: "4px 0",
          },
          "& blockquote": {
            margin: "16px 0",
            paddingLeft: "16px",
            borderLeft: "4px solid",
            borderColor: "primary.main",
            fontStyle: "italic",
            color: "text.secondary",
          },
          "& a": {
            color: "primary.main",
            textDecoration: "underline",
          },
        }}
      />
    </Box>
  )
}

export default RichTextEditor
