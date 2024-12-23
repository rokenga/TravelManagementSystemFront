import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../Utils/Configuration";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  TextField,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import UserContext from "../contexts/UserContext";
import { RecordWithCommentsResponse } from "../types/Record";
import MarkdownViewer from "../components/MarkdownView";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCommentIcon from "@mui/icons-material/AddComment";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  boxShadow: theme.shadows[2],
}));

const CommentItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[1],
  padding: theme.spacing(2),
}));

const Record: React.FC = () => {
  const User = useContext(UserContext);
  const { destinationId, recordId } = useParams<{ destinationId: string; recordId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<RecordWithCommentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState<boolean>(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");

  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get<RecordWithCommentsResponse>(
          `${API_URL}/Destination/${destinationId}/Records/${recordId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setRecord(response.data.recordWithCommentsResponse);
      } catch (err: any) {
        console.error("Error fetching record data:", err);
        setError("Nepavyko gauti įrašo duomenų.");
      } finally {
        setIsLoading(false);
      }
    };

    if (recordId && destinationId) {
      fetchRecordData();
    }
  }, [recordId, destinationId]);

  const handleDeleteRecord = async () => {
    try {
      await axios.delete(`${API_URL}/Record/${recordId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      navigate(`/destination/${destinationId}`);
    } catch (err) {
      console.error("Error deleting record:", err);
      setError("Nepavyko ištrinti įrašo.");
    }
  };

  const handleRemoveComment = async (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteCommentDialogOpen(true);
  };

  const [editingComment, setEditingComment] = useState<null | { id: string; text: string }>(null);

// Function to open the edit form
const handleEditComment = (comment: { id: string; text: string }) => {
  setEditingComment({ id: comment.id, text: comment.text });
};

// Function to handle input change
const handleEditCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (editingComment) {
    setEditingComment({ ...editingComment, text: e.target.value });
  }
};

// Function to submit edited comment
const handleSubmitEditedComment = async () => {
  if (!editingComment) return;
  try {
    await axios.put(
      `${API_URL}/Comment/${editingComment.id}`,
      { text: editingComment.text,
        recordId: recordId
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    // Refresh comments
    const response = await axios.get<RecordWithCommentsResponse>(
      `${API_URL}/Destination/${destinationId}/Records/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    setRecord(response.data.recordWithCommentsResponse);
    setEditingComment(null);
  } catch (err) {
    console.error("Error editing comment:", err);
    setError("Nepavyko redaguoti komentaro.");
  }
};


  const confirmRemoveComment = async () => {
    if (commentToDelete) {
      try {
        await axios.delete(`${API_URL}/Comment/${commentToDelete}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
  
        setRecord((prevRecord) => ({
          ...prevRecord!,
          comments: prevRecord!.comments.filter((comment) => comment.id !== commentToDelete),
        }));
      } catch (err) {
        console.error("Error removing comment:", err);
        setError("Nepavyko pašalinti komentaro.");
      } finally {
        setDeleteCommentDialogOpen(false);
        setCommentToDelete(null);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setError("Komentaras negali būti tuščias.");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/Comment`,
        { 
          text: newComment, 
          recordId: recordId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setNewComment("");
      setShowCommentForm(false);
      setError(null);
  
      const response = await axios.get<RecordWithCommentsResponse>(
        `${API_URL}/Destination/${destinationId}/Records/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setRecord(response.data.recordWithCommentsResponse);
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Nepavyko pridėti komentaro.");
    }
  };

  const handleBack = () => navigate(`/destination/${destinationId}`);
  const openDeleteDialog = () => setDeleteDialogOpen(true);
  const closeDeleteDialog = () => setDeleteDialogOpen(false);

  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : record ? (
        <>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                  {record.title}
                </Typography>
                {(User?.role === "Admin" || User?.role === "Agent") && (User?.email === record.author)  &&(
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/destination/${destinationId}/records/edit/${recordId}`)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={openDeleteDialog}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 2 }}>
                <Chip icon={<EventIcon />} label={`Sukurta: ${new Date(record.createdAt).toLocaleDateString()}`} />
                <Chip icon={<EventIcon />} label={`Atnaujinta: ${new Date(record.updatedAt).toLocaleDateString()}`} />
                {(User?.role === "Admin" || User?.role === "Agent") && (
                  <Chip icon={<PersonIcon />} label={`Autorius: ${record.author}`} />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
              <MarkdownViewer content={record.content} />
            </CardContent>
          </StyledCard>

          <StyledPaper>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5">Komentarai</Typography>
            {User.id != "" && ( 
                <Button
                variant="contained"
                startIcon={<AddCommentIcon />}
                onClick={() => setShowCommentForm(true)}
                >
                Pridėti komentarą
                </Button>
            )}
            </Box>

            {showCommentForm && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Įveskite savo komentarą"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Paskelbti komentarą
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowCommentForm(false);
                      setNewComment("");
                    }}
                  >
                    Atšaukti
                  </Button>
                </Box>
              </Box>
            )}

            {record.comments.length > 0 ? (
              <List>
              {record.comments.map((comment) => (
                <CommentItem key={comment.id}>
                  <Avatar sx={{ mr: 2 }}>{comment.author[0]}</Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {comment.author.substring(0, 4)}
                      </Typography>
                    }
                    secondary={
                      <>
                        {editingComment && editingComment.id === comment.id ? (
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              variant="outlined"
                              value={editingComment.text}
                              onChange={handleEditCommentChange}
                              multiline
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={() => setEditingComment(null)}
                              >
                                Atšaukti
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleSubmitEditedComment}
                              >
                                Išsaugoti
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body1" paragraph>
                            {comment.text}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {`Sukurta: ${new Date(comment.createdAt).toLocaleString()}`}
                        </Typography>
                      </>
                    }
                  />
                  {User?.email === comment.author && (
                    <>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditComment(comment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveComment(comment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </CommentItem>
              ))}
            </List>
            
            ) : (
              <Typography>Nėra komentarų.</Typography>
            )}
          </StyledPaper>

          <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
            <DialogTitle>Ištrinti įrašą</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Ar tikrai norite ištrinti šį įrašą? Šis veiksmas yra negrįžtamas.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDeleteDialog} color="primary">
                Atšaukti
              </Button>
              <Button onClick={handleDeleteRecord} color="error">
                Ištrinti
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteCommentDialogOpen} onClose={() => setDeleteCommentDialogOpen(false)}>
            <DialogTitle>Ištrinti komentarą</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Ar tikrai norite ištrinti šį komentarą? Šis veiksmas yra negrįžtamas.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
            <Button onClick={confirmRemoveComment} color="error">
                Ištrinti
              </Button>
              <Button onClick={() => setDeleteCommentDialogOpen(false)} color="primary">
                Atšaukti
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography>Įrašas nerastas.</Typography>
      )}
      <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
        Grįžti
      </Button>
    </Box>
  );
};

export default Record;

