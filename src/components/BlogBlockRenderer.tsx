"use client"

import type React from "react"
import { Box, Typography, Divider, Paper } from "@mui/material"
import DOMPurify from "dompurify"
import { BlogBlockType, type BlogBlockResponse } from "../types/Blog"

interface BlogBlockRendererProps {
  block: BlogBlockResponse
  fileUrlResolver?: (fileId: string) => string
}

const BlogBlockRenderer: React.FC<BlogBlockRendererProps> = ({ block, fileUrlResolver }) => {
  const renderBlock = () => {
    switch (block.type) {
      case BlogBlockType.Heading: {
        const { level, text } = block.payload
        const HeadingComponent = `h${Math.min(Math.max(level, 1), 6)}` as keyof React.JSX.IntrinsicElements
        const variant = level === 1 ? "h3" : level === 2 ? "h4" : "h5"

        return (
          <Typography variant={variant} component={HeadingComponent} gutterBottom sx={{ fontWeight: 600 }}>
            {text}
          </Typography>
        )
      }

      case BlogBlockType.Paragraph: {
        const { html } = block.payload
        const sanitizedHtml = DOMPurify.sanitize(html)

        return (
          <Typography
            variant="body1"
            component="div"
            gutterBottom
            sx={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )
      }

      case BlogBlockType.Quote: {
        const { text, author } = block.payload

        return (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              my: 3,
              borderLeft: 4,
              borderColor: "primary.main",
              backgroundColor: "grey.50",
              fontStyle: "italic",
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "1.1rem", lineHeight: 1.6, mb: author ? 1 : 0 }}>
              "{text}"
            </Typography>
            {author && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "right" }}>
                — {author}
              </Typography>
            )}
          </Paper>
        )
      }

      case BlogBlockType.Divider: {
        const { style } = block.payload

        if (style === "dots") {
          return (
            <Box sx={{ textAlign: "center", my: 4 }}>
              <Typography variant="h4" color="text.secondary">
                • • •
              </Typography>
            </Box>
          )
        }

        return <Divider sx={{ my: 4 }} />
      }

      case BlogBlockType.Image: {
        const { fileId, caption, alt } = block.payload
        const imageUrl = fileUrlResolver ? fileUrlResolver(fileId) : `/api/files/${fileId}`

        return (
          <Box sx={{ my: 3 }}>
            <Box
              component="img"
              src={imageUrl}
              alt={alt || caption || "Blog image"}
              sx={{
                width: "100%",
                height: "auto",
                borderRadius: 1,
                boxShadow: 2,
              }}
            />
            {caption && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1, textAlign: "center" }}
              >
                {caption}
              </Typography>
            )}
          </Box>
        )
      }

      case BlogBlockType.Gallery: {
        const { fileIds, caption } = block.payload

        return (
          <Box sx={{ my: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 2,
              }}
            >
              {fileIds.map((fileId: string, index: number) => {
                const imageUrl = fileUrlResolver ? fileUrlResolver(fileId) : `/api/files/${fileId}`
                return (
                  <Box
                    key={fileId}
                    component="img"
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  />
                )
              })}
            </Box>
            {caption && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1, textAlign: "center" }}
              >
                {caption}
              </Typography>
            )}
          </Box>
        )
      }

      default:
        return (
          <Typography variant="body2" color="error">
            Nežinomas bloko tipas: {block.type}
          </Typography>
        )
    }
  }

  return <Box sx={{ mb: 2 }}>{renderBlock()}</Box>
}

export default BlogBlockRenderer
