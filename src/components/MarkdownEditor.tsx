"use client"

import type React from "react"
import MDEditor from "@uiw/react-md-editor"
import { Box, Typography, useTheme } from "@mui/material"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  label?: string
  minHeight?: number
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, label, minHeight = 200 }) => {
  const theme = useTheme()

  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
      )}

      <MDEditor
        value={value}
        onChange={onChange}
        height={minHeight}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{
          placeholder: "Įveskite tekstą naudodami Markdown formatavimą...",
        }}
        style={{
          borderRadius: theme.shape.borderRadius,
          overflow: "hidden",
        }}
      />

      <Box
        sx={{
          mt: 1,
          display: "flex",
          justifyContent: "flex-end",
          color: theme.palette.text.secondary,
          fontSize: "0.75rem",
        }}
      >
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: theme.palette.primary.main,
            textDecoration: "none",
          }}
        >
          Markdown sintaksės pagalba
        </a>
      </Box>
    </Box>
  )
}

export default MarkdownEditor

