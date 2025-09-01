"use client"

import type React from "react"
import { Box, IconButton, Divider, Tooltip } from "@mui/material"
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  FormatQuote,
} from "@mui/icons-material"

interface MarkdownToolbarProps {
  onInsert: (markdown: string) => void
  textAreaRef?: React.RefObject<HTMLTextAreaElement>
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onInsert, textAreaRef }) => {
  const insertMarkdown = (before: string, after = "", placeholder = "") => {
    onInsert(`${before}${placeholder}${after}`)
  }

  const insertList = (prefix: string, placeholder: string) => {
    const listItem = `${prefix}${placeholder}\n`
    onInsert(listItem)

    // Add Enter key handler for continuing lists
    if (textAreaRef?.current) {
      const textarea = textAreaRef.current
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          const cursorPos = textarea.selectionStart
          const textBefore = textarea.value.substring(0, cursorPos)
          const lines = textBefore.split("\n")
          const currentLine = lines[lines.length - 1]

          if (currentLine.match(/^- /)) {
            e.preventDefault()
            onInsert("\n- ")
          } else if (currentLine.match(/^\d+\. /)) {
            e.preventDefault()
            const match = currentLine.match(/^(\d+)\. /)
            if (match) {
              const nextNum = Number.parseInt(match[1]) + 1
              onInsert(`\n${nextNum}. `)
            }
          }
        }
      }

      textarea.addEventListener("keydown", handleKeyDown)
      setTimeout(() => textarea.removeEventListener("keydown", handleKeyDown), 5000)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        p: 1,
        bgcolor: "grey.50",
        borderRadius: 1,
        mb: 1,
        flexWrap: "wrap",
      }}
    >
      <Tooltip title="Paryškintas tekstas">
        <IconButton size="small" onClick={() => insertMarkdown("**", "**", "paryškintas tekstas")}>
          <FormatBold />
        </IconButton>
      </Tooltip>

      <Tooltip title="Kursyvas">
        <IconButton size="small" onClick={() => insertMarkdown("*", "*", "kursyvas")}>
          <FormatItalic />
        </IconButton>
      </Tooltip>

      <Tooltip title="Pabrauktas">
        <IconButton size="small" onClick={() => insertMarkdown("<u>", "</u>", "pabrauktas tekstas")}>
          <FormatUnderlined />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Sąrašas su ženkleliais">
        <IconButton size="small" onClick={() => insertList("- ", "sąrašo elementas")}>
          <FormatListBulleted />
        </IconButton>
      </Tooltip>

      <Tooltip title="Numeruotas sąrašas">
        <IconButton size="small" onClick={() => insertList("1. ", "sąrašo elementas")}>
          <FormatListNumbered />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Nuoroda">
        <IconButton size="small" onClick={() => insertMarkdown("[", "](https://)", "nuorodos tekstas")}>
          <Link />
        </IconButton>
      </Tooltip>

      <Tooltip title="Citata">
        <IconButton size="small" onClick={() => insertMarkdown("> ", "", "citatos tekstas")}>
          <FormatQuote />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export default MarkdownToolbar
