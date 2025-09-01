"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Typography,
  Autocomplete,
  Card,
  CardMedia,
  CardActions,
  Container,
} from "@mui/material"
import { Add, Save, Cancel, CloudUpload, Delete, Image as ImageIcon, Visibility } from "@mui/icons-material"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import {
  BlogCategory,
  BlogBlockType,
  type BlogDetailResponse,
  type EditBlogMetaRequest,
  type UpdateBlogBlocksRequest,
  type BlogBlockUpsert,
} from "../types/Blog"
import BlogBlockEditor from "../components/BlogBlockEditor"
import BlogPreviewModal from "../components/BlogPreviewModal"
import { uniquifyFiles } from "../Utils/fileUtils"

import countriesData from "../assets/full-countries-lt.json"
import type { Country } from "../types/Geography"

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

const BlogEditor: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>()
  const navigate = useNavigate()
  const isEditing = !!blogId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<BlogCategory>(BlogCategory.Europe)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<BlogBlockUpsert[]>([])
  const [isPublished, setIsPublished] = useState(false)

  const countries: Country[] = countriesData as Country[]

  useEffect(() => {
    if (isEditing && blogId) {
      fetchBlog()
    }
  }, [isEditing, blogId])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            if (!headerImageFile) {
              handleHeaderImageSelect(file)
            } else {
              // Add as image block
              addImageBlock(file)
            }
          }
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (!files) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith("image/")) {
          if (!headerImageFile && i === 0) {
            handleHeaderImageSelect(file)
          } else {
            addImageBlock(file)
          }
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("drop", handleDrop)

    return () => {
      document.removeEventListener("paste", handlePaste)
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("drop", handleDrop)
    }
  }, [headerImageFile])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const response = await axios.get<BlogDetailResponse>(`${API_URL}/Blog/${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const blog = response.data
      setTitle(blog.title)
      setCategory(blog.category)

      if (blog.country) {
        const country = countries.find((c) => c.name === blog.country) || null
        setSelectedCountry(country)
      }

      setBlocks(blog.blocks.map((block) => ({ ...block, payload: block.payload })))
      setIsPublished(blog.isPublished)

      if (blog.headerImage) {
        setHeaderImagePreview(blog.headerImage.url)
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Tinklaraščio įrašas nerastas")
      } else if (err.response?.status === 403) {
        setError("Neturite teisės redaguoti šio įrašo")
      } else {
        setError("Nepavyko gauti tinklaraščio įrašo")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHeaderImageSelect = (file: File) => {
    setHeaderImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setHeaderImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeHeaderImage = () => {
    setHeaderImageFile(null)
    setHeaderImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const addImageBlock = (file: File) => {
    const newBlock: BlogBlockUpsert = {
      order: blocks.length + 1,
      type: BlogBlockType.Image,
      payload: { file, caption: "" },
    }
    setBlocks([...blocks, newBlock])
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const token = localStorage.getItem("accessToken")
    const response = await axios.post(`${API_URL}/Files/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data.id
  }

  const handleSaveAsDraft = async () => {
    await handleSave(false)
  }

  const handlePublish = async () => {
    await handleSave(true)
  }

  const handleSave = async (publishNow = false) => {
    if (!title.trim()) {
      setError("Pavadinimas yra privalomas")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const token = localStorage.getItem("accessToken")
      if (!token) {
        setError("Nerastas autentifikacijos žetonas")
        return
      }

      if (isEditing && blogId) {
        let headerImageFileId: string | undefined

        if (headerImageFile) {
          headerImageFileId = await uploadFile(headerImageFile)
        }

        const reorderedBlocks = blocks.map((block, index) => ({
          ...block,
          order: index + 1,
        }))

        const metaRequest: EditBlogMetaRequest = {
          title,
          category,
          country: selectedCountry?.name || undefined,
          headerImageFileId,
        }

        await axios.put(`${API_URL}/Blog/${blogId}/meta`, metaRequest, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const blocksRequest: UpdateBlogBlocksRequest = {
          blocks: reorderedBlocks,
        }

        await axios.put(`${API_URL}/Blog/${blogId}/blocks`, blocksRequest, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (publishNow && !isPublished) {
          await axios.post(`${API_URL}/Blog/${blogId}/publish`, null, {
            params: { publish: true },
            headers: { Authorization: `Bearer ${token}` },
          })
        }

        navigate(`/admin-blog-list/blog/${blogId}`)
      } else {
        const reorderedBlocks = blocks.map((block, index) => ({
          ...block,
          order: index + 1,
        }))

        const imageFiles: File[] = []
        blocks.forEach((block) => {
          if (block.type === BlogBlockType.Image && block.payload.file) {
            imageFiles.push(block.payload.file)
          }
          if (block.type === BlogBlockType.Gallery && block.payload.files) {
            imageFiles.push(...block.payload.files)
          }
        })

        const allFiles: File[] = []
        if (headerImageFile) allFiles.push(headerImageFile)
        if (imageFiles.length > 0) allFiles.push(...imageFiles)

        const uniqueFiles = uniquifyFiles(allFiles)
        const fileNameMap = new Map<File, string>()
        uniqueFiles.forEach((uniqueFile, index) => {
          fileNameMap.set(allFiles[index], uniqueFile.name)
        })

        const processedBlocks = reorderedBlocks.map((block) => {
          if (block.type === BlogBlockType.Image && block.payload.file) {
            return {
              ...block,
              payload: {
                ...block.payload,
                fileName: fileNameMap.get(block.payload.file),
                file: undefined,
              },
            }
          }
          if (block.type === BlogBlockType.Gallery && block.payload.files) {
            return {
              ...block,
              payload: {
                ...block.payload,
                fileNames: block.payload.files.map((file) => fileNameMap.get(file)).filter(Boolean),
                files: undefined,
              },
            }
          }
          return block
        })

        const formData = new FormData()
        formData.append("Title", title)
        formData.append("Category", category.toString())
        formData.append("IsPublished", publishNow.toString())
        if (selectedCountry) formData.append("Country", selectedCountry.name)
        if (headerImageFile) {
          const uniqueHeaderFile = uniqueFiles.find((f) => fileNameMap.get(headerImageFile) === f.name)
          if (uniqueHeaderFile) formData.append("HeaderImage", uniqueHeaderFile)
        }
        uniqueFiles.forEach((file) => {
          if (file !== uniqueFiles.find((f) => fileNameMap.get(headerImageFile!) === f.name)) {
            formData.append("Images", file)
          }
        })
        formData.append("BlocksJson", JSON.stringify(processedBlocks))

        const response = await axios.post(`${API_URL}/Blog`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })

        navigate(`/admin-blog-list/blog/${response.data.id}`)
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("Neteisingi duomenys. Patikrinkite blokų tvarką ir privalomas reikšmes.")
      } else {
        setError("Nepavyko išsaugoti tinklaraščio įrašo")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate("/admin-blog-list")
  }

  const addBlock = (type: BlogBlockType) => {
    const newBlock: BlogBlockUpsert = {
      order: blocks.length + 1,
      type,
      payload: getDefaultPayload(type),
    }
    setBlocks([...blocks, newBlock])
  }

  const getDefaultPayload = (type: BlogBlockType) => {
    switch (type) {
      case BlogBlockType.Heading:
        return { level: 2, text: "" }
      case BlogBlockType.Paragraph:
        return { html: "" }
      case BlogBlockType.Quote:
        return { text: "", author: "" }
      case BlogBlockType.Divider:
        return {}
      case BlogBlockType.Image:
        return { file: null, caption: "" }
      default:
        return {}
    }
  }

  const updateBlock = (index: number, updatedBlock: BlogBlockUpsert) => {
    const newBlocks = [...blocks]
    newBlocks[index] = updatedBlock
    setBlocks(newBlocks)
  }

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index)
    setBlocks(newBlocks)
  }

  const moveBlockUp = (index: number) => {
    if (index === 0) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index - 1]
    newBlocks[index - 1] = temp
    setBlocks(newBlocks)
  }

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + 1]
    newBlocks[index + 1] = temp
    setBlocks(newBlocks)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
            {isEditing ? "Redaguoti tinklaraščio įrašą" : "Sukurti tinklaraščio įrašą"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 4, mb: 3, border: "1px solid", borderColor: "divider" }}>
          <TextField
            fullWidth
            label="Pavadinimas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 3 }}
            variant="outlined"
            size="large"
          />

          <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Kategorija</InputLabel>
              <Select value={category} label="Kategorija" onChange={(e) => setCategory(e.target.value as BlogCategory)}>
                {Object.values(BlogCategory).map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {getCategoryName(cat)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={countries}
              getOptionLabel={(option) => option.name}
              value={selectedCountry}
              onChange={(_, value) => setSelectedCountry(value)}
              renderInput={(params) => <TextField {...params} label="Šalis" size="medium" />}
              sx={{ minWidth: 300 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Antraštės paveikslėlis
            </Typography>
            {headerImagePreview ? (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Card sx={{ maxWidth: 400 }}>
                  <CardMedia component="img" height="200" image={headerImagePreview} alt="Header preview" />
                  <CardActions>
                    <Button size="small" color="error" onClick={removeHeaderImage} startIcon={<Delete />}>
                      Pašalinti
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ) : (
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
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Vilkite paveikslėlį čia arba spauskite pasirinkti
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taip pat galite įklijuoti iš iškarpinės (Ctrl+V)
                </Typography>
                <Button variant="outlined" sx={{ mt: 2 }} startIcon={<CloudUpload />}>
                  Pasirinkti failą
                </Button>
              </Box>
            )}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleHeaderImageSelect(file)
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6">Turinys</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => addBlock(BlogBlockType.Heading)}
                  startIcon={<Add />}
                >
                  Antraštė
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => addBlock(BlogBlockType.Paragraph)}
                  startIcon={<Add />}
                >
                  Pastraipa
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => addBlock(BlogBlockType.Quote)}
                  startIcon={<Add />}
                >
                  Citata
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => addBlock(BlogBlockType.Image)}
                  startIcon={<Add />}
                >
                  Paveikslėlis
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => addBlock(BlogBlockType.Divider)}
                  startIcon={<Add />}
                >
                  Skyrybos linija
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {blocks.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "text.secondary", bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Pradėkite kurti turinį
                </Typography>
                <Typography variant="body1">Pridėkite turinio blokų naudodami mygtukus aukščiau</Typography>
              </Box>
            ) : (
              <Box>
                {blocks.map((block, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <BlogBlockEditor
                      block={block}
                      onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
                      onDelete={() => deleteBlock(index)}
                      onFileUpload={uploadFile}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={saving} startIcon={<Cancel />}>
            Atšaukti
          </Button>

          <Button variant="outlined" onClick={handleSaveAsDraft} disabled={saving} startIcon={<Save />}>
            {saving ? "Išsaugoma..." : "Išsaugoti kaip juodraštį"}
          </Button>

          <Button variant="contained" onClick={handlePublish} disabled={saving} startIcon={<Save />} color="primary">
            {saving ? "Publikuojama..." : "Išsaugoti"}
          </Button>

          <Button variant="outlined" onClick={() => setShowPreview(true)} startIcon={<Visibility />}>
            Peržiūra
          </Button>
        </Box>

        <BlogPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={title}
          category={category}
          country={selectedCountry?.name}
          headerImagePreview={headerImagePreview}
          blocks={blocks}
        />
      </Container>
    </Box>
  )
}

export default BlogEditor
