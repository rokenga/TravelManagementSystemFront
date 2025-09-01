"use client"

import type React from "react"
import { Card, CardContent, CardMedia, Typography, Box, Chip } from "@mui/material"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import { BlogCategory, type BlogSummaryResponse } from "../types/Blog"

interface BlogCardProps {
  blog: BlogSummaryResponse
  onClick: (id: string) => void
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

const getCategoryColor = (
  category: BlogCategory,
): "primary" | "secondary" | "success" | "warning" | "error" | "info" => {
  switch (category) {
    case BlogCategory.Europe:
      return "primary"
    case BlogCategory.Asia:
      return "secondary"
    case BlogCategory.Africa:
      return "warning"
    case BlogCategory.Australia:
      return "success"
    case BlogCategory.Advice:
      return "info"
    case BlogCategory.Inspiration:
      return "error"
    default:
      return "primary"
  }
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onClick }) => {
  const handleClick = () => {
    onClick(blog.id)
  }

  const publishedDate = blog.publishedAt ? new Date(blog.publishedAt) : new Date(blog.createdAt)

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
      onClick={handleClick}
    >
      {blog.headerImage && (
        <CardMedia
          component="img"
          height="200"
          image={blog.headerImage.url}
          alt={blog.title}
          sx={{ objectFit: "cover" }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Chip
            label={getCategoryName(blog.category)}
            color={getCategoryColor(blog.category)}
            size="small"
            sx={{ mb: 1 }}
          />
          {!blog.isPublished && <Chip label="Juodraštis" color="default" size="small" variant="outlined" />}
        </Box>

        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {blog.title}
        </Typography>

        <Box sx={{ mt: "auto" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Autorius: {blog.agentName}
          </Typography>
          {blog.country && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Šalis: {blog.country}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {format(publishedDate, "yyyy-MM-dd", { locale: lt })}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default BlogCard
