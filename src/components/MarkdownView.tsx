"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Box, Paper, useTheme } from "@mui/material"

interface MarkdownViewerProps {
  content: string
  bordered?: boolean
  padding?: number
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, bordered = false, padding = 2 }) => {
  const theme = useTheme()

  const Component = bordered ? Paper : Box

  return (
    <Component
      sx={{
        p: bordered ? padding : 0,
        width: "100%",
        color: theme.palette.text.primary,
        "& h1": {
          fontSize: "2rem",
          fontWeight: 700,
          my: 2,
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        "& h2": {
          fontSize: "1.75rem",
          fontWeight: 700,
          my: 2,
          pb: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        "& h3": {
          fontSize: "1.5rem",
          fontWeight: 600,
          my: 1.5,
        },
        "& h4": {
          fontSize: "1.25rem",
          fontWeight: 600,
          my: 1.5,
        },
        "& h5": {
          fontSize: "1.1rem",
          fontWeight: 600,
          my: 1,
        },
        "& h6": {
          fontSize: "1rem",
          fontWeight: 600,
          my: 1,
          color: theme.palette.text.secondary,
        },
        "& p": {
          my: 1.5,
          lineHeight: 1.6,
        },
        "& a": {
          color: theme.palette.primary.main,
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        },
        "& img": {
          maxWidth: "100%",
          borderRadius: theme.shape.borderRadius,
        },
        "& blockquote": {
          borderLeft: `4px solid ${theme.palette.primary.light}`,
          pl: 2,
          py: 0.5,
          my: 2,
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.action.hover,
          borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0`,
        },
        "& ul, & ol": {
          pl: 3,
          my: 1.5,
          "& li": {
            mb: 0.5,
          },
        },
        "& code": {
          backgroundColor: theme.palette.action.hover,
          padding: "0.2em 0.4em",
          borderRadius: theme.shape.borderRadius,
          fontSize: "85%",
          fontFamily: "monospace",
        },
        "& pre": {
          backgroundColor: "transparent !important",
          padding: "0 !important",
          margin: "1em 0 !important",
        },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          my: 2,
          "& th, & td": {
            border: `1px solid ${theme.palette.divider}`,
            padding: "0.5rem",
            textAlign: "left",
          },
          "& th": {
            backgroundColor: theme.palette.action.hover,
            fontWeight: 600,
          },
          "& tr:nth-of-type(even)": {
            backgroundColor: theme.palette.action.hover,
          },
        },
        "& hr": {
          border: "none",
          height: "1px",
          backgroundColor: theme.palette.divider,
          margin: "1.5rem 0",
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter style={materialLight} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Component>
  )
}

export default MarkdownViewer

