"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Card,
  CardMedia,
  Chip,
  Grid,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import axios from "axios"
import { API_URL } from "../Utils/Configuration"
import CustomSnackbar from "./CustomSnackBar"
import CloseIcon from "@mui/icons-material/Close"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import DeleteIcon from "@mui/icons-material/Delete"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

enum BlogCategory {
  Travel = 0,
  Adventure = 1,
  Culture = 2,
  Food = 3,
  Tips = 4,
}

const categoryLabels = {
  [BlogCategory.Travel]: "Kelionės",
  [BlogCategory.Adventure]: "Nuotykiai",
  [BlogCategory.Culture]: "Kultūra",
  [BlogCategory.Food]: "Maistas",
  [BlogCategory.Tips]: "Patarimai",
}

interface BlogFormData {
  title: string
  content: string
  category: BlogCategory
  country: string
  headerImage: File | null
  images: File[]
}

interface BlogFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  blogId?: string
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
})

const BlogFormModal: React.FC<BlogFormModalProps> = ({ open, onClose, onSuccess, blogId }) => {
  const isEditMode = Boolean(blogId)
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    content: "",
    category: BlogCategory.Travel,
    country: "",
    headerImage: null,
    images: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success")

  const initialFormData = useCallback(
    () => ({
      title: "",
      content: "",
      category: BlogCategory.Travel,
      country: "",
      headerImage: null as File | null,
      images: [] as File[],
    }),
    []
  )

  useEffect(() => {
    if (open && isEditMode && blogId) {
      const fetchBlogData = async () => {
        setFetchLoading(true)
        try {
          const response = await axios.get(`${API_URL}/Blog/${blogId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          })
          const blogData = response.data
          setFormData({
            title: blogData.title || "",
            content: blogData.content || "",
            category: blogData.category || BlogCategory.Travel,
            country: blogData.country || "",
            headerImage: null,
            images: [],
          })
        } catch (err) {
          setSnackbarMessage("Nepavyko gauti tinklaraščio įrašo duomenų.")
          setSnackbarSeverity("error")
          setSnackbarOpen(true)
        } finally {
          setFetchLoading(false)
        }
      }
      fetchBlogData()
    } else if (open && !isEditMode) {
      setFormData(initialFormData())
    }
  }, [open, isEditMode, blogId, initialFormData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleCategoryChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      category: e.target.value as BlogCategory,
    }))
  }

  const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        headerImage: file,
      }))
    }
  }

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }))
  }

  const removeHeaderImage = () => {
    setFormData((prev) => ({
      ...prev,
      headerImage: null,
    }))
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setIsLoading(true)

    const formDataToSend = new FormData()
    formDataToSend.append("title", formData.title.trim())
    formDataToSend.append("content", formData.content.trim())
    formDataToSend.append("category", formData.category.toString())
    if (formData.country) formDataToSend.append("country", formData.country.trim())
    if (formData.headerImage) formDataToSend.append("headerImage", formData.headerImage)

    formData.images.forEach((image) => {
      formDataToSend.append("images", image)
    })

    try {
      let response
      if (isEditMode && blogId) {
        const endpoint = publish ? `${API_URL}/Blog/${blogId}/publish` : `${API_URL}/Blog/${blogId}`
        const method = publish ? "post" : "put"
        response = await axios[method](endpoint, formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        setSnackbarMessage(
          publish ? "Tinklaraščio įrašas sėkmingai paskelbtas!" : "Tinklaraščio įrašas sėkmingai atnaujintas!"
        )
      } else {
        const endpoint = publish ? `${API_URL}/Blog` : `${API_URL}/Blog`
        response = await axios.post(endpoint, formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })

        if (publish && response.data) {
          await axios.post(`${API_URL}/Blog/${response.data}/publish`, formDataToSend, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          })
        }

        setSnackbarMessage(
          publish ? "Tinklaraščio įrašas sėkmingai sukurtas ir paskelbtas!" : "Tinklaraščio įrašas sėkmingai sukurtas!"
        )
      }

      setSnackbarSeverity("success")
      setSnackbarOpen(true)
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (error: any) {
      if (error.response) {
        setSnackbarMessage(
          error.response.data?.message ||
            `Nepavyko ${isEditMode ? "atnaujinti" : "sukurti"} tinklaraščio įrašo.`
        )
      } else {
        setSnackbarMessage("Serverio klaida, bandykite dar kartą.")
      }
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 5,
          height: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">
          {isEditMode ? "Redaguoti tinklaraščio įrašą" : "Sukurti naują tinklaraščio įrašą"}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {fetchLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: "100%" }}>
            {/* Form Fields */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Pavadinimas"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Šalis (neprivaloma)"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Kategorija</InputLabel>
                    <Select value={formData.category} onChange={handleCategoryChange} label="Kategorija">
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <MenuItem key={value} value={Number(value)}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Image Upload Section */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Paveikslėliai
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pagrindinis paveikslėlis
                    </Typography>
                    {formData.headerImage ? (
                      <Card sx={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={URL.createObjectURL(formData.headerImage)}
                          alt="Header preview"
                        />
                        <IconButton
                          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.8)" }}
                          onClick={removeHeaderImage}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Card>
                    ) : (
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ width: "100%", height: 100, borderStyle: "dashed" }}
                      >
                        Įkelti pagrindinį paveikslėlį
                        <VisuallyHiddenInput type="file" accept="image/*" onChange={handleHeaderImageUpload} />
                      </Button>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Papildomi paveikslėliai
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{ width: "100%", mb: 2, borderStyle: "dashed" }}
                    >
                      Įkelti papildomus paveikslėlius
                      <VisuallyHiddenInput type="file" accept="image/*" multiple onChange={handleImagesUpload} />
                    </Button>
                    {formData.images.length > 0 && (
                      <Grid container spacing={1}>
                        {formData.images.map((image, index) => (
                          <Grid item xs={6} key={index}>
                            <Card sx={{ position: "relative" }}>
                              <CardMedia
                                component="img"
                                height="80"
                                image={URL.createObjectURL(image)}
                                alt={`Upload ${index + 1}`}
                              />
                              <IconButton
                                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,0.8)" }}
                                size="small"
                                onClick={() => removeImage(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* Content Editor */}
            <Box sx={{ height: "calc(100% - 300px)" }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tab label="Rašyti" />
                <Tab label="Peržiūra" />
              </Tabs>

              {activeTab === 0 && (
                <Box sx={{ p: 3, height: "calc(100% - 48px)" }}>
                  <TextField
                    label="Turinys"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    required
                    variant="outlined"
                    placeholder="Rašykite savo tinklaraščio įrašo turinį čia... Galite naudoti Markdown formatavimą!"
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "100%",
                        alignItems: "flex-start",
                      },
                      "& .MuiInputBase-input": {
                        height: "100% !important",
                        overflow: "auto !important",
                        fontFamily: "monospace",
                      },
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Palaikomas Markdown formatavimas:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      <Chip label="**paryškintas**" size="small" variant="outlined" />
                      <Chip label="*kursyvas*" size="small" variant="outlined" />
                      <Chip label="# Antraštė" size="small" variant="outlined" />
                      <Chip label="[nuoroda](url)" size="small" variant="outlined" />
                      <Chip label="![paveikslėlis](url)" size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ p: 3, height: "calc(100% - 48px)", overflow: "auto", bgcolor: "background.paper" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-lg max-w-none">
                    {formData.content || "*Nėra turinio peržiūrai*"}
                  </ReactMarkdown>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={(e) => handleSubmit(e, false)}
            variant="outlined"
            disabled={isLoading || fetchLoading || !formData.title || !formData.content}
            sx={{ textTransform: "none" }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Išsaugoti juodraštį"}
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, true)}
            variant="contained"
            color="primary"
            disabled={isLoading || fetchLoading || !formData.title || !formData.content}
            sx={{ textTransform: "none" }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Paskelbti"}
          </Button>
        </Box>
        <Button variant="text" color="secondary" onClick={onClose} sx={{ textTransform: "none" }}>
          Atšaukti
        </Button>
      </DialogActions>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage || ""}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </Dialog>
  )
}

export default BlogFormModal
