"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Typography, Box, Chip, Paper, CircularProgress, Alert } from "@mui/material"
import { format } from "date-fns"
import { lt } from "date-fns/locale"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import { BlogCategory, type BlogDetailResponse } from "../types/Blog"
import BlogBlockRenderer from "../components/BlogBlockRenderer"
import ActionBar from "../components/ActionBar"
import UserContext from "../contexts/UserContext"

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

const BlogDetail: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>()
  const navigate = useNavigate()
  const user = useContext(UserContext)

  const [blog, setBlog] = useState<BlogDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishLoading, setPublishLoading] = useState(false)

  const isAuthenticated = user?.role === "Admin" || user?.role === "Agent"
  const canEdit = isAuthenticated && (user?.role === "Admin" || blog?.agentName === user?.email)

  useEffect(() => {
    if (blogId) {
      fetchBlog()
    }
  }, [blogId])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: any = {}
      if (isAuthenticated) {
        headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`
      }

      const response = await axios.get<BlogDetailResponse>(`${API_URL}/Blog/${blogId}`, { headers })
      setBlog(response.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Dienoraščio įrašas nerastas")
      } else if (err.response?.status === 403) {
        setError("Neturite teisės peržiūrėti šį įrašą")
      } else {
        setError("Nepavyko gauti dienoraščio įrašo")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/admin-blog-list/blog/${blogId}/edit`)
  }

  const handleDelete = async () => {
    if (!window.confirm("Ar tikrai norite ištrinti šį dienoraščio įrašą?")) {
      return
    }

    try {
      const token = localStorage.getItem("accessToken")
      await axios.delete(`${API_URL}/Blog/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      navigate("/admin-blog-list")
    } catch (err) {
      console.error("Error deleting blog:", err)
    }
  }

  const handlePublishToggle = async () => {
    if (!blog) return

    try {
      setPublishLoading(true)
      const token = localStorage.getItem("accessToken")
      await axios.post(`${API_URL}/Blog/${blogId}/publish`, null, {
        params: { publish: !blog.isPublished },
        headers: { Authorization: `Bearer ${token}` },
      })

      setBlog({ ...blog, isPublished: !blog.isPublished })
    } catch (err: any) {
      if (err.response?.status === 400) {
        alert("Negalima publikuoti dienoraščio be turinio blokų")
      } else {
        console.error("Error toggling publish status:", err)
      }
    } finally {
      setPublishLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!blog) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Dienoraščio įrašas nerastas</Alert>
      </Container>
    )
  }

  const publishedDate = blog.publishedAt ? new Date(blog.publishedAt) : new Date(blog.createdAt)

  return (
    <Box sx={{ width: "100%" }}>
      {canEdit && (
        <ActionBar
          backUrl="/admin-blog-list"
          showEditButton={true}
          showDeleteButton={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showChangeStatusButton={true}
          onChangeStatus={handlePublishToggle}
        />
      )}

      <Container maxWidth="md" sx={{ py: canEdit ? 0 : 4 }}>
        {blog.headerImage && (
          <Box
            component="img"
            src={blog.headerImage.url}
            alt={blog.title}
            sx={{
              width: "100%",
              height: { xs: 250, md: 400 },
              objectFit: "cover",
              borderRadius: 2,
              mb: 4,
              boxShadow: 3,
            }}
          />
        )}

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip label={getCategoryName(blog.category)} color={getCategoryColor(blog.category)} size="small" />
              {!blog.isPublished && <Chip label="Juodraštis" color="default" size="small" variant="outlined" />}
            </Box>

            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {blog.title}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, color: "text.secondary", mb: 3 }}>
              <Typography variant="body2">Autorius: {blog.agentName}</Typography>
              {blog.country && <Typography variant="body2">Šalis: {blog.country}</Typography>}
              <Typography variant="body2">{format(publishedDate, "yyyy-MM-dd", { locale: lt })}</Typography>
            </Box>
          </Box>

          <Box sx={{ "& > *:last-child": { mb: 0 } }}>
            {blog.blocks.map((block) => (
              <BlogBlockRenderer
                key={`${block.order}-${block.type}`}
                block={block}
                fileUrlResolver={(fileId) => `${API_URL}/files/${fileId}`}
              />
            ))}
          </Box>

          {blog.blocks.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 4 }}>
              Šis dienoraščio įrašas dar neturi turinio.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default BlogDetail
